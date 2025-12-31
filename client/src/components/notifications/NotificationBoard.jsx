import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../../stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';

const NotificationBoard = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close notification board when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TASK_CREATED':
        return '🆕';
      case 'TASK_UPDATED':
        return '📝';
      case 'TASK_STATUS_CHANGED':
        return '🔄';
      case 'TASK_PRIORITY_CHANGED':
        return '⚡';
      case 'TASK_ASSIGNED':
        return '👤';
      case 'COMMENT_ADDED':
        return '💬';
      case 'SUBTASK_ADDED':
        return '➕';
      case 'TASK_COMPLETED':
        return '✅';
      case 'TASK_DUE_SOON':
        return '⏰';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'TASK_CREATED':
      case 'TASK_ASSIGNED':
        return 'text-green-400';
      case 'TASK_STATUS_CHANGED':
        return 'text-blue-400';
      case 'TASK_PRIORITY_CHANGED':
        return 'text-yellow-400';
      case 'COMMENT_ADDED':
        return 'text-purple-400';
      case 'TASK_COMPLETED':
        return 'text-green-500';
      case 'TASK_DUE_SOON':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // If notification has a task, open it
    const taskId = notification.task?.id || notification.taskId;
    if (taskId) {
      // Dispatch custom event to open task modal
      const event = new CustomEvent('openTaskFromNotification', {
        detail: { taskId }
      });
      window.dispatchEvent(event);
      
      // Navigate to dashboard if not already there
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/dashboard')) {
        navigate('/dashboard');
      }
    }
    
    // Close the notification board
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 transition-colors duration-200"
        style={{ color: 'var(--color-text-tertiary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-tertiary)';
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 top-12 w-80 border rounded-lg shadow-xl z-50 transition-all duration-200 animate-[slideDown_0.2s_ease-out]"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          {/* Header */}
          <div 
            className="p-4 border-b transition-colors duration-200"
            style={{ borderColor: 'var(--color-border-default)' }}
          >
            <div className="flex items-center justify-between">
              <h3 
                className="text-lg font-semibold transition-colors duration-200"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm transition-colors duration-200"
                  style={{ color: '#60a5fa' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#93c5fd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#60a5fa';
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div 
                className="p-4 text-center transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Loading notifications...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-400">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div 
                className="p-4 text-center transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 border-b cursor-pointer transition-colors duration-200"
                  style={{
                    borderColor: 'var(--color-border-default)',
                    backgroundColor: !notification.isRead 
                      ? 'var(--color-bg-tertiary)' 
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = !notification.isRead 
                      ? 'var(--color-bg-tertiary)' 
                      : 'transparent';
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`text-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 
                          className="text-sm font-medium transition-colors duration-200"
                          style={{ 
                            color: (notification.task?.id || notification.taskId)
                              ? 'var(--color-primary)'
                              : (!notification.isRead 
                              ? 'var(--color-text-primary)' 
                                : 'var(--color-text-secondary)'),
                            textDecoration: (notification.task?.id || notification.taskId) ? 'underline' : 'none'
                          }}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: '#3b82f6' }}
                          ></div>
                        )}
                      </div>
                      <p 
                        className="text-sm mt-1 transition-colors duration-200"
                        style={{ 
                          color: 'var(--color-text-tertiary)',
                          textDecoration: notification.task && notification.task.id ? 'none' : 'none'
                        }}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className="text-xs transition-colors duration-200"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div 
              className="p-4 border-t transition-colors duration-200"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-sm transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-tertiary)';
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBoard;
