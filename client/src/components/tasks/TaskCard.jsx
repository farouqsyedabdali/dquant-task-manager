import { useState } from 'react';
import useAuthStore from '../../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import TaskModal from './TaskModal';

const TaskCard = ({ task, onStatusChange, onPriorityChange, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin } = useAuthStore();

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
    return {
      type: 'status',
      content: `Status changed to ${STATUS_LABELS[task.status]}`,
      author: task.createdBy.name,
      time: new Date(task.updatedAt).toLocaleDateString()
    };
  };

  const lastUpdate = getLastUpdate();

  return (
    <>
      <div 
        className="task-card bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-750 transition-all duration-200"
        onClick={handleCardClick}
      >
        {/* Task Header */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-white font-medium text-lg truncate flex-1 mr-3">
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
            {task.assignedTo ? (
              <div className="flex items-center space-x-2">
                <div className="avatar placeholder">
                  <div className="bg-indigo-600 text-white rounded-full w-6">
                    <span className="text-xs">{task.assignedTo.name.charAt(0)}</span>
                  </div>
                </div>
                <span className="text-white text-sm">{task.assignedTo.name}</span>
              </div>
            ) : (
              <span className="text-gray-500 text-sm">Unassigned</span>
            )}
          </div>

          {/* Last Update */}
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm truncate">
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
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs">
              Created by {task.createdBy.name}
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
    </>
  );
};

export default TaskCard; 