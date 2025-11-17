const { checkAndSendReminders } = require('../utils/taskReminderScheduler');
const prisma = require('../lib/prisma');

/**
 * Manually trigger reminder check (admin only)
 */
const triggerReminderCheck = async (req, res) => {
  try {
    // Only admins and super admins can trigger manual checks
    if (!['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    console.log(`🔔 Manual reminder check triggered by user ${req.user.email}`);
    
    const result = await checkAndSendReminders();
    
    res.json({
      success: true,
      message: 'Reminder check completed',
      data: result
    });
  } catch (error) {
    console.error('Error triggering reminder check:', error);
    res.status(500).json({ error: 'Failed to trigger reminder check' });
  }
};

/**
 * Get reminder statistics
 */
const getReminderStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    // Get total reminders sent for this company's tasks
    const reminderCount = await prisma.taskReminder.count({
      where: {
        task: {
          companyId: companyId
        }
      }
    });

    // Get reminders sent in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentReminders = await prisma.taskReminder.count({
      where: {
        task: {
          companyId: companyId
        },
        sentAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Get upcoming tasks that will need reminders (due in 24-72 hours)
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const seventyTwoHoursFromNow = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    
    const upcomingTasks = await prisma.task.count({
      where: {
        companyId: companyId,
        dueDate: {
          gte: twentyFourHoursFromNow,
          lte: seventyTwoHoursFromNow
        },
        status: {
          notIn: ['COMPLETED', 'CANCELLED']
        },
        archived: false
      }
    });

    res.json({
      success: true,
      stats: {
        totalRemindersSent: reminderCount,
        remindersLast7Days: recentReminders,
        upcomingReminders: upcomingTasks
      }
    });
  } catch (error) {
    console.error('Error getting reminder stats:', error);
    res.status(500).json({ error: 'Failed to get reminder statistics' });
  }
};

/**
 * Get reminder history for a specific task
 */
const getTaskReminderHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    // Verify user has access to this task
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        coAssignees: {
          select: { userId: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.assignerId === userId;
    const isCoAssignee = task.coAssignees.some(ca => ca.userId === userId);
    const isAdmin = ['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(userRole) && task.companyId === companyId;

    if (!isAssignee && !isCreator && !isCoAssignee && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get reminder history
    const reminders = await prisma.taskReminder.findMany({
      where: {
        taskId: parseInt(taskId)
      },
      orderBy: {
        sentAt: 'desc'
      }
    });

    res.json({
      success: true,
      reminders
    });
  } catch (error) {
    console.error('Error getting task reminder history:', error);
    res.status(500).json({ error: 'Failed to get reminder history' });
  }
};

module.exports = {
  triggerReminderCheck,
  getReminderStats,
  getTaskReminderHistory
};

