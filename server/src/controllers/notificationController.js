const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get notifications for a user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    
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
        isRead: true
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

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

    await prisma.notification.updateMany({
      where: {
        userId: userId,
        companyId: companyId,
        isRead: false
      },
      data: {
        isRead: true
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
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification
};
