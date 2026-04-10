const prisma = require('../lib/prisma');
const { sendPushToUser } = require('../services/pushNotificationService');

// Get notifications for a user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    
    // Clean up read notifications older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await prisma.notification.deleteMany({
      where: {
        userId: userId,
        companyId: companyId,
        isRead: true,
        readAt: {
          lt: sevenDaysAgo
        }
      }
    });
    
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        companyId: companyId
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const companyId = req.user.companyId;

    const notification = await prisma.notification.updateMany({
      where: {
        id: parseInt(notificationId),
        userId: userId,
        companyId: companyId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Clean up read notifications older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await prisma.notification.deleteMany({
      where: {
        userId: userId,
        companyId: companyId,
        isRead: true,
        readAt: {
          lt: sevenDaysAgo
        }
      }
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    const now = new Date();

    await prisma.notification.updateMany({
      where: {
        userId: userId,
        companyId: companyId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: now
      }
    });

    // Clean up read notifications older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await prisma.notification.deleteMany({
      where: {
        userId: userId,
        companyId: companyId,
        isRead: true,
        readAt: {
          lt: sevenDaysAgo
        }
      }
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;

    const count = await prisma.notification.count({
      where: {
        userId: userId,
        companyId: companyId,
        isRead: false
      }
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Create a notification (helper function for other controllers)
const createNotification = async (type, title, message, taskId, userId, companyId) => {
  try {
    // Check current notification count for this user
    const notificationCount = await prisma.notification.count({
      where: {
        userId: userId,
        companyId: companyId
      }
    });

    const MAX_NOTIFICATIONS = 30;

    // If user has 30 or more notifications, delete the oldest ones
    if (notificationCount >= MAX_NOTIFICATIONS) {
      const notificationsToDelete = notificationCount - MAX_NOTIFICATIONS + 1; // +1 to make room for the new one
      
      // Get the oldest notifications (prioritize unread, then oldest read)
      const oldestNotifications = await prisma.notification.findMany({
        where: {
          userId: userId,
          companyId: companyId
        },
        orderBy: [
          { isRead: 'asc' }, // Unread first
          { createdAt: 'asc' } // Then oldest
        ],
        take: notificationsToDelete,
        select: {
          id: true
        }
      });

      if (oldestNotifications.length > 0) {
        await prisma.notification.deleteMany({
          where: {
            id: {
              in: oldestNotifications.map(n => n.id)
            }
          }
        });
      }
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        taskId,
        userId,
        companyId
      }
    });

    // Fire-and-forget push notification to the user's devices
    sendPushToUser(userId, {
      title,
      body: message,
      data: { type, taskId: String(taskId), notificationId: String(notification.id) },
    }).catch(() => {});

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Get all users who should be notified about a task change
 * @param {number} taskId - The task ID
 * @param {number} actorId - The user performing the action (won't be notified)
 * @param {object} options - Configuration options
 * @param {boolean} options.includeCreator - Whether to notify the task creator (default: true)
 * @param {boolean} options.includeAssignee - Whether to notify the lead assignee (default: true)
 * @param {boolean} options.includeCoAssignees - Whether to notify co-assignees (default: true)
 * @param {boolean} options.excludeCreatorForSubtaskComments - Exclude creator for subtask comments (default: false)
 * @returns {Promise<number[]>} Array of user IDs to notify
 */
const getUsersToNotify = async (taskId, actorId, options = {}) => {
  const {
    includeCreator = true,
    includeAssignee = true,
    includeCoAssignees = true,
    excludeCreatorForSubtaskComments = false
  } = options;

  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        coAssignees: {
          select: { userId: true }
        }
      }
    });

    if (!task) return [];

    const usersToNotify = new Set();

    // Add task creator (if enabled and not the actor)
    if (includeCreator && task.assignerId !== actorId) {
      // Special case: Don't notify creator for subtask comments if flag is set
      if (!(excludeCreatorForSubtaskComments && task.parentTaskId)) {
        usersToNotify.add(task.assignerId);
      }
    }

    // Add lead assignee (if enabled and not the actor)
    if (includeAssignee && task.assigneeId && task.assigneeId !== actorId) {
      usersToNotify.add(task.assigneeId);
    }

    // Add all co-assignees (if enabled and not the actor)
    if (includeCoAssignees) {
      task.coAssignees.forEach(coAssignee => {
        if (coAssignee.userId !== actorId) {
          usersToNotify.add(coAssignee.userId);
        }
      });
    }

    return Array.from(usersToNotify);
  } catch (error) {
    console.error('Error getting users to notify:', error);
    return [];
  }
};

/**
 * Create notifications for multiple users about a task change
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} taskId - Task ID
 * @param {number} actorId - User performing the action
 * @param {number} companyId - Company ID
 * @param {object} options - Options for getUsersToNotify
 * @returns {Promise<void>}
 */
const notifyTaskUsers = async (type, title, message, taskId, actorId, companyId, options = {}) => {
  try {
    const userIds = await getUsersToNotify(taskId, actorId, options);
    
    const notifications = await Promise.all(
      userIds.map(userId => 
        createNotification(type, title, message, taskId, userId, companyId)
      )
    );

    return notifications.filter(n => n !== null);
  } catch (error) {
    console.error('Error notifying task users:', error);
    return [];
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification,
  getUsersToNotify,
  notifyTaskUsers
};
