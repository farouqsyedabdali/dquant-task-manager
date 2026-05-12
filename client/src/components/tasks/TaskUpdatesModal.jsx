import { useState, useEffect } from 'react';
import { auditAPI } from '../../services/api';

const TaskUpdatesModal = ({ isOpen, onClose, task }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && task) {
      fetchUpdates();
    }
  }, [isOpen, task]);

  const fetchUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await auditAPI.getTaskAuditLogs(task.id);
      setUpdates(response.data.data || []);
    } catch (err) {
      console.error('Error fetching task updates:', err);
      setError('Failed to load task updates');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      TASK_CREATED: '✨',
      TASK_UPDATED: '📝',
      TASK_DELETED: '🗑️',
      TASK_STATUS_CHANGED: '🔄',
      TASK_PRIORITY_CHANGED: '⚡',
      TASK_ASSIGNED: '👤',
      TASK_UNASSIGNED: '👤',
      TASK_DUE_DATE_CHANGED: '📅',
      TASK_SHARED: '📤',
      TASK_UNSHARED: '📥',
      TASK_ARCHIVED: '📦',
      TASK_UNARCHIVED: '📦',
      COMMENT_CREATED: '💬',
      COMMENT_UPDATED: '✏️',
      COMMENT_DELETED: '🗑️',
      CO_ASSIGNEE_ADDED: '👥',
      CO_ASSIGNEE_REMOVED: '👥',
      SUBTASK_ADDED: '➕',
      USER_CREATED: '👤',
      USER_UPDATED: '👤',
      USER_DELETED: '👤',
      USER_ROLE_CHANGED: '🔑',
    };
    return icons[action] || '📝';
  };

  const getActionColor = (action) => {
    const colors = {
      TASK_CREATED: 'text-blue-400',
      TASK_UPDATED: 'text-gray-400',
      TASK_DELETED: 'text-red-400',
      TASK_STATUS_CHANGED: 'text-purple-400',
      TASK_PRIORITY_CHANGED: 'text-orange-400',
      TASK_ASSIGNED: 'text-green-400',
      TASK_UNASSIGNED: 'text-gray-400',
      TASK_DUE_DATE_CHANGED: 'text-blue-400',
      TASK_SHARED: 'text-teal-400',
      TASK_UNSHARED: 'text-gray-400',
      TASK_ARCHIVED: 'text-gray-400',
      TASK_UNARCHIVED: 'text-blue-400',
      COMMENT_CREATED: 'text-blue-400',
      COMMENT_UPDATED: 'text-yellow-400',
      COMMENT_DELETED: 'text-red-400',
      CO_ASSIGNEE_ADDED: 'text-green-400',
      CO_ASSIGNEE_REMOVED: 'text-gray-400',
      SUBTASK_ADDED: 'text-green-400',
    };
    return colors[action] || 'text-gray-400';
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const updateDate = new Date(date);
    const diff = now - updateDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return updateDate.toLocaleDateString();
  };

  const formatDescription = (description) => {
    // Remove timestamp from description (it's redundant with our relative time)
    // Description format: "User did something at 11/22/2025, 3:45:00 PM"
    return description.replace(/ at \d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} (AM|PM)/, '');
  };

  if (!isOpen || !task) return null;

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop, not the modal box
    if (e.target === e.currentTarget) {
      e.stopPropagation(); // Prevent event from bubbling to parent TaskModal
      onClose();
    }
  };

  return (
    <div 
      className="modal modal-open backdrop-blur-sm" 
      style={{ zIndex: 60 }}
    >
      <div 
        className="modal-box max-w-2xl border" 
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Task Updates
          </h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            ✕
          </button>
        </div>

        {/* Task Info */}
        <div 
          className="mb-4 p-3 rounded-lg" 
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          <h4 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            {task.title}
          </h4>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Created by {task.assigner?.name} on {new Date(task.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Updates Timeline */}
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-md" style={{ color: 'var(--color-primary)' }}></span>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Loading updates...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchUpdates}
                className="mt-2 btn btn-sm"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                Retry
              </button>
            </div>
          ) : updates.length > 0 ? (
            updates.map((update) => (
              <div
                key={update.id}
                className="flex gap-3 p-3 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }}
              >
                <div className={`text-2xl ${getActionColor(update.action)}`}>
                  {getActionIcon(update.action)}
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {formatDescription(update.description)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {update.user?.name || 'Unknown User'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>•</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {formatTimestamp(update.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
              <p className="text-4xl mb-2">📝</p>
              <p>No updates yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Task activity will appear here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="mt-4 pt-4 border-t" 
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            {updates.length > 0 
              ? `${updates.length} update${updates.length !== 1 ? 's' : ''} total`
              : 'All task changes and activity are tracked here'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskUpdatesModal;
