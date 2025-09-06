import { create } from 'zustand';
import { notificationAPI } from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Fetch notifications
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationAPI.getNotifications();
      if (response.data.success) {
        set({ 
          notifications: response.data.notifications,
          unreadCount: response.data.notifications.filter(n => !n.isRead).length
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ error: 'Failed to fetch notifications' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch unread count only
  fetchUnreadCount: async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        set({ unreadCount: response.data.count });
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllAsRead();
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  // Add new notification (for real-time updates)
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useNotificationStore;
