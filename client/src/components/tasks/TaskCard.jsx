import { useState } from 'react';
import useAuthStore from '../../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import TaskModal from './TaskModal';
import AddSubtaskModal from './AddSubtaskModal';
import { 
  FaCircle, FaSpinner, FaCheckCircle, FaPauseCircle, FaTimesCircle,
  FaArrowDown, FaMinus, FaArrowUp, FaExclamationTriangle,
  FaCalendar, FaComment, FaList, FaLevelUpAlt, FaShareAlt, FaPlayCircle
} from 'react-icons/fa';

const TaskCard = ({ task, onStatusChange, onPriorityChange, onDelete, onArchive, onUnarchive }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [showAllCoAssignees, setShowAllCoAssignees] = useState(false);
  const { user, isAdmin } = useAuthStore();

  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  // Check if current user is viewing a shared task
  const isSharedTask = task?.sharedWith?.some(share => share.userId === user?.id);

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TODO':
        return 'status-todo';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'COMPLETED':
        return 'status-completed';
      case 'ON_HOLD':
        return 'status-on-hold';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-todo';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'priority-urgent';
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      case 'LOW':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'TODO':
        return <FaCircle className="w-3 h-3" />;
      case 'IN_PROGRESS':
        return <FaPlayCircle className="w-3 h-3" />;
      case 'COMPLETED':
        return <FaCheckCircle className="w-3 h-3" />;
      case 'ON_HOLD':
        return <FaPauseCircle className="w-3 h-3" />;
      case 'CANCELLED':
        return <FaTimesCircle className="w-3 h-3" />;
      default:
        return <FaCircle className="w-3 h-3" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'LOW':
        return <FaArrowDown className="w-3 h-3" />;
      case 'MEDIUM':
        return <FaMinus className="w-3 h-3" />;
      case 'HIGH':
        return <FaArrowUp className="w-3 h-3" />;
      case 'URGENT':
        return <FaExclamationTriangle className="w-3 h-3" />;
      default:
        return <FaMinus className="w-3 h-3" />;
    }
  };

  const getLastUpdate = () => {
    if (task.comments && task.comments.length > 0) {
      const lastComment = task.comments[0];
      return {
        type: 'comment',
        content: lastComment.content,
        author: lastComment.author.name,
        time: new Date(lastComment.createdAt).toLocaleDateString()
      };
    }
    return null;
  };

  const lastUpdate = getLastUpdate();

  return (
    <>
      <div 
        className={`task-card border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          task.dueDate && new Date(task.dueDate) < new Date() && (task.status === 'TODO' || task.status === 'IN_PROGRESS')
            ? 'border-red-500 border-2'
            : ''
        }`}
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: task.dueDate && new Date(task.dueDate) < new Date() && (task.status === 'TODO' || task.status === 'IN_PROGRESS')
            ? '#ef4444' 
            : 'var(--color-border-default)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
        }}
        onClick={handleCardClick}
      >
        {/* Task Header */}
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <h3 
              className="font-medium text-lg line-clamp-2 flex-1 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {task.title}
            </h3>
            {isSharedTask && (
              <div className="status-badge bg-blue-600 text-blue-100 uppercase flex items-center gap-1">
                <FaShareAlt className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`status-badge uppercase ${getStatusColor(task.status)}`}>
              {STATUS_LABELS[task.status]}
            </span>
            <span className={`status-badge uppercase ${getPriorityColor(task.priority)}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </div>

        {/* Task Details */}
        <div className="space-y-3">
          {/* Assigned To */}
          {true && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span 
                  className="text-sm transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Lead:
                </span>
                {task.assignee ? (
                  <div className="flex items-center space-x-2">
                      <div 
                      className="text-white rounded-full w-6 h-6 flex items-center justify-center"
                      style={{ 
                        backgroundColor: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1'
                      }}
                      >
                      <span 
                        className="text-xs"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}
                      >
                        {task.assignee.name.charAt(0)}
                      </span>
                    </div>
                    <span 
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {task.assignee.name}
                    </span>
                  </div>
                ) : (
                    <span 
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Unassigned
                    </span>
                )}
              </div>
              
              {/* Co-Assignees */}
              {task.coAssignees && task.coAssignees.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span 
                    className="text-sm transition-colors duration-200"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Co-assignees:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(showAllCoAssignees ? task.coAssignees : task.coAssignees.slice(0, 5)).map((coAssignee) => (
                      <div key={coAssignee.id} className="flex items-center space-x-1">
                          <div 
                          className="text-white rounded-full w-5 h-5 flex items-center justify-center"
                          style={{ 
                            backgroundColor: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: '1'
                          }}
                          >
                          <span 
                            className="text-xs"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1'
                            }}
                          >
                            {coAssignee.user.name.charAt(0)}
                          </span>
                        </div>
                        <span 
                          className="text-xs transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {coAssignee.user.name}
                        </span>
                      </div>
                    ))}
                    {task.coAssignees.length > 5 && (
                      <button
                        onClick={() => setShowAllCoAssignees(!showAllCoAssignees)}
                        className="text-xs underline transition-colors duration-200"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-tertiary)';
                        }}
                      >
                        {showAllCoAssignees ? 'Show Less' : `+${task.coAssignees.length - 5} more`}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parent Task Info */}
          {task.parentTask && (
            <div className="flex items-center space-x-2">
              <FaLevelUpAlt 
                className="w-4 h-4 transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <span 
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Parent:
              </span>
              <span 
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--color-primary-light)' }}
              >
                {task.parentTask.title}
              </span>
            </div>
          )}

          {/* Subtasks Count */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="flex items-center space-x-2">
              <FaList 
                className="w-4 h-4 transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <span 
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Subtasks:
              </span>
              <span 
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {task.subtasks.length}
              </span>
            </div>
          )}

          {/* Due Date */}
          <div className="flex items-center space-x-2">
            <FaCalendar 
              className="w-4 h-4 transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
            />
            <span 
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Due:
            </span>
            {task.dueDate ? (
              <div className="flex items-center space-x-2">
                <span 
                  className={`text-sm transition-colors duration-200 ${
                    new Date(task.dueDate) < new Date() && (task.status === 'TODO' || task.status === 'IN_PROGRESS')
                      ? 'text-red-400 font-medium'
                      : ''
                  }`}
                  style={new Date(task.dueDate) >= new Date() || (task.status !== 'TODO' && task.status !== 'IN_PROGRESS')
                    ? { color: 'var(--color-text-primary)' }
                    : {}
                  }
                >
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
                {new Date(task.dueDate) < new Date() && (task.status === 'TODO' || task.status === 'IN_PROGRESS') && (
                  <span className="status-badge-sm priority-urgent">Overdue</span>
                )}
              </div>
            ) : (
              <span 
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--color-text-muted)' }}
              >
                No due date
              </span>
            )}
          </div>

          {/* Last Update */}
          {lastUpdate ? (
            <div 
              className="border-t pt-3 transition-colors duration-200"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <div className="flex items-start space-x-2">
                <div 
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm line-clamp-2 transition-colors duration-200"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {lastUpdate.content}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span 
                      className="text-xs transition-colors duration-200"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {lastUpdate.author}
                    </span>
                    <span 
                      className="text-xs transition-colors duration-200"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      •
                    </span>
                    <span 
                      className="text-xs transition-colors duration-200"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {lastUpdate.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="border-t pt-3 transition-colors duration-200"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200"
                  style={{ backgroundColor: 'var(--color-text-muted)' }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm transition-colors duration-200"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    No recent updates
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div 
          className="flex items-center justify-between mt-4 pt-3 border-t transition-colors duration-200"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <div className="flex items-center space-x-2">
            {!isPersonalAccount && (
              <span 
                className="text-xs transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Created by {task.assigner.name}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {task.comments && task.comments.length > 0 && (
              <span 
                className="text-xs flex items-center gap-1 transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <FaComment className="w-3 h-3" />
                {task.comments.length}
              </span>
            )}
            
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={task}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onDelete={onDelete}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onTaskChange={(newTask) => {
            // Update the task prop when switching tasks within TaskCard's modal
            // This is a no-op for TaskCard since it doesn't manage task state
            // But it prevents the "onTaskChange is not provided" warning
          }}
        />
      )}

      {/* Subtask Modal */}
      {isSubtaskModalOpen && (
        <AddSubtaskModal
          isOpen={isSubtaskModalOpen}
          onClose={() => setIsSubtaskModalOpen(false)}
          parentTask={task}
          extensionUpdateData={null}
        />
      )}
    </>
  );
};

export default TaskCard; 