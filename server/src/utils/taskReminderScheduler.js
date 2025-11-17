const prisma = require('../lib/prisma');
const emailService = require('../services/emailService');

/**
 * Check for tasks due in 48 hours and send reminder emails
 * This function should be called periodically (e.g., every hour)
 */
async function checkAndSendReminders() {
  try {
    console.log('🔔 Starting task reminder check...');
    
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const fortyNineHoursFromNow = new Date(now.getTime() + 49 * 60 * 60 * 1000);
    
    // Find tasks that are due between 48 and 49 hours from now
    // This gives us a 1-hour window to catch tasks
    const tasksDueSoon = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: fortyEightHoursFromNow,
          lte: fortyNineHoursFromNow
        },
        status: {
          notIn: ['COMPLETED', 'CANCELLED']
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
        },
        reminders: true
      }
    });

    console.log(`📋 Found ${tasksDueSoon.length} tasks due in 48 hours`);

    let remindersSent = 0;
    let remindersSkipped = 0;

    for (const task of tasksDueSoon) {
      // Collect all users who should receive reminders
      const usersToNotify = new Set();
      
      // Add lead assignee
      if (task.assignee) {
        usersToNotify.add(JSON.stringify({
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email
        }));
      }

      // Add co-assignees
      if (task.coAssignees && task.coAssignees.length > 0) {
        task.coAssignees.forEach(coAssignee => {
          usersToNotify.add(JSON.stringify({
            id: coAssignee.user.id,
            name: coAssignee.user.name,
            email: coAssignee.user.email
          }));
        });
      }

      // Send reminders to each user
      for (const userJson of usersToNotify) {
        const user = JSON.parse(userJson);
        
        // Check if reminder already sent to this user for this task
        const existingReminder = task.reminders.find(r => r.userId === user.id);
        
        if (existingReminder) {
          console.log(`⏭️  Skipping reminder for task ${task.id} to user ${user.email} - already sent`);
          remindersSkipped++;
          continue;
        }

        try {
          // Send reminder email
          const emailResult = await emailService.sendTaskReminder({
            recipientEmail: user.email,
            userName: user.name,
            task: {
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: task.status,
              dueDate: task.dueDate,
              assignee: task.assigner
            },
            taskId: task.id
          });

          if (emailResult.success) {
            // Record that we sent this reminder
            await prisma.taskReminder.create({
              data: {
                taskId: task.id,
                userId: user.id
              }
            });

            console.log(`✅ Sent reminder for task "${task.title}" to ${user.email}`);
            remindersSent++;
          } else {
            console.error(`❌ Failed to send reminder for task ${task.id} to ${user.email}:`, emailResult.error);
          }
        } catch (error) {
          console.error(`❌ Error sending reminder for task ${task.id} to ${user.email}:`, error);
        }
      }
    }

    console.log(`🔔 Reminder check complete: ${remindersSent} sent, ${remindersSkipped} skipped`);
    
    return {
      success: true,
      tasksDueSoon: tasksDueSoon.length,
      remindersSent,
      remindersSkipped
    };
  } catch (error) {
    console.error('❌ Error in checkAndSendReminders:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Start the reminder scheduler
 * Checks for reminders every hour
 */
function startReminderScheduler() {
  console.log('🚀 Starting task reminder scheduler...');
  
  // Run immediately on startup
  checkAndSendReminders();
  
  // Then run every hour
  const intervalId = setInterval(() => {
    checkAndSendReminders();
  }, 60 * 60 * 1000); // 1 hour in milliseconds

  console.log('✅ Task reminder scheduler started (checking every hour)');
  
  return intervalId;
}

/**
 * Stop the reminder scheduler
 */
function stopReminderScheduler(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Task reminder scheduler stopped');
  }
}

module.exports = {
  checkAndSendReminders,
  startReminderScheduler,
  stopReminderScheduler
};

