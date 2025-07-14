import { useState } from 'react';
import useAuthStore from '../../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import TaskModal from './TaskModal';
import AddSubtaskModal from './AddSubtaskModal';

const TaskCard = ({ task, onStatusChange, onPriorityChange, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const { user, isAdmin } = useAuthStore();

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
        className="task-card bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-900 transition-all duration-200"
        onClick={handleCardClick}
      >
        {/* Task Header */}
        <div className="mb-3">
          <h3 className="text-white font-medium text-lg mb-2 line-clamp-2">
            {task.title}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`status-badge ${getStatusColor(task.status)}`}>
              {STATUS_LABELS[task.status]}
            </span>
            <span className={`status-badge ${getPriorityColor(task.priority)}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </div>

        {/* Task Details */}
        <div className="space-y-3">
          {/* Assigned To */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Assigned to:</span>
            {task.assignee ? (
              <div className="flex items-center space-x-2">
                <div className="avatar placeholder">
                  <div className="bg-indigo-600 text-white rounded-full w-6">
                    <span className="text-xs">{task.assignee.name.charAt(0)}</span>
                  </div>
                </div>
                <span className="text-white text-sm">{task.assignee.name}</span>
              </div>
            ) : (
              <span className="text-gray-500 text-sm">Unassigned</span>
            )}
          </div>

          {/* Parent Task Info */}
          {task.parentTask && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Parent:</span>
              <span className="text-indigo-400 text-sm">{task.parentTask.title}</span>
            </div>
          )}

          {/* Subtasks Count */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Subtasks:</span>
              <span className="text-white text-sm">{task.subtasks.length}</span>
            </div>
          )}

          {/* Last Update */}
          {lastUpdate ? (
            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {lastUpdate.content}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-gray-500 text-xs">{lastUpdate.author}</span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{lastUpdate.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-sm">
                    No recent updates
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs">
              Created by {task.assigner.name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {task.comments && task.comments.length > 0 && (
              <span className="text-gray-400 text-xs">
                💬 {task.comments.length}
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
        />
      )}

      {/* Subtask Modal */}
      {isSubtaskModalOpen && (
        <AddSubtaskModal
          isOpen={isSubtaskModalOpen}
          onClose={() => setIsSubtaskModalOpen(false)}
          parentTask={task}
        />
      )}
    </>
  );
};

export default TaskCard; 