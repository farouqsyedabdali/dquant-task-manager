const prisma = require('../lib/prisma');
const { createNotification } = require('../controllers/notificationController');
const { logAuditActionDirect } = require('../middleware/auditLogger');

/**
 * Auto-archive tasks that are past their due date by the configured period
 * This function should be called periodically (e.g., daily)
 */
async function autoArchiveOverdueTasks() {
  try {
    console.log('📦 Starting auto-archive check...');
    
    const now = new Date();
    let totalArchived = 0;

    // Get all companies that have auto-archive enabled
    const companies = await prisma.company.findMany({
      where: {
        autoArchivePeriod: {
          not: null
        },
        markedForDeletion: false
      },
      include: {
        users: {
          where: {
            role: {
              in: ['SYSDMIN', 'ADMIN']
            }
          },
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`Found ${companies.length} companies with auto-archive enabled`);

    for (const company of companies) {
      if (!company.autoArchivePeriod) continue;

      // Calculate the cutoff date: dueDate + autoArchivePeriod months
      // We need to find tasks where: dueDate + autoArchivePeriod months < now
      // This means: dueDate < now - autoArchivePeriod months
      const cutoffDate = new Date(now);
      cutoffDate.setMonth(cutoffDate.getMonth() - company.autoArchivePeriod);

      // Find tasks that:
      // 1. Belong to this company
      // 2. Have a due date
      // 3. Are not already archived
      // 4. Due date is before the cutoff date
      const tasksToArchive = await prisma.task.findMany({
        where: {
          companyId: company.id,
          dueDate: {
            not: null,
            lt: cutoffDate
          },
          archived: false
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assigner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          coAssignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      console.log(`Company ${company.name}: Found ${tasksToArchive.length} tasks to archive`);

      // Archive each task
      for (const task of tasksToArchive) {
        try {
          // Archive the task
          await prisma.task.update({
            where: { id: task.id },
            data: { archived: true }
          });

          // Send notification to assignee
          if (task.assigneeId) {
            await createNotification(
              'TASK_ARCHIVED',
              'Task Auto-Archived',
              `Task "${task.title}" has been automatically archived (overdue by ${company.autoArchivePeriod} months)`,
              task.id,
              task.assigneeId,
              company.id
            );
          }

          // Notify co-assignees
          for (const coAssignee of task.coAssignees) {
            await createNotification(
              'TASK_ARCHIVED',
              'Task Auto-Archived',
              `Task "${task.title}" has been automatically archived (overdue by ${company.autoArchivePeriod} months)`,
              task.id,
              coAssignee.userId,
              company.id
            );
          }

          // Log audit action (use first admin user as the actor, or system if no admin)
          const adminUser = company.users[0];
          if (adminUser) {
            const mockReq = { user: adminUser };
            await logAuditActionDirect(
              'TASK_ARCHIVED',
              'Task',
              task.id,
              {
                taskTitle: task.title,
                archivedBy: 'System (Auto-Archive)',
                autoArchivePeriod: company.autoArchivePeriod,
                dueDate: task.dueDate,
                assigneeId: task.assigneeId,
                coAssignees: task.coAssignees.map(ca => ca.userId)
              },
              adminUser.id,
              company.id,
              mockReq
            );
          }

          totalArchived++;
        } catch (taskError) {
          console.error(`Error archiving task ${task.id}:`, taskError);
        }
      }
    }

    console.log(`✅ Auto-archive completed. Archived ${totalArchived} task(s).`);
    return { success: true, archived: totalArchived };
  } catch (error) {
    console.error('❌ Auto-archive error:', error);
    throw error;
  }
}

/**
 * Start the auto-archive scheduler
 * Checks for overdue tasks daily
 */
function startAutoArchiveScheduler() {
  console.log('📦 Starting auto-archive scheduler...');
  
  // Run immediately on startup
  autoArchiveOverdueTasks().catch(err => {
    console.error('Error in initial auto-archive check:', err);
  });
  
  // Then run daily (24 hours)
  const intervalId = setInterval(() => {
    autoArchiveOverdueTasks().catch(err => {
      console.error('Error in scheduled auto-archive check:', err);
    });
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

  console.log('✅ Auto-archive scheduler started (checking daily)');
  
  return intervalId;
}

/**
 * Stop the auto-archive scheduler
 */
function stopAutoArchiveScheduler(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Auto-archive scheduler stopped');
  }
}

module.exports = {
  autoArchiveOverdueTasks,
  startAutoArchiveScheduler,
  stopAutoArchiveScheduler
};

