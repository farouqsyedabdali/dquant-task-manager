import { useState } from 'react';
import useAuthStore from '../../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import TaskModal from './TaskModal';

const TaskList = ({ tasks, onStatusChange, onPriorityChange, onDelete }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin } = useAuthStore();

  const handleRowClick = (task) => {
    setSelectedTask(task);
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

  const getLastUpdates = (task) => {
    const updates = [];
    
    // Add status change as first update
    updates.push({
      type: 'status',
      content: `Status: ${STATUS_LABELS[task.status]}`,
      author: task.createdBy.name,
      time: new Date(task.updatedAt).toLocaleDateString()
    });

    // Add comments if they exist
    if (task.comments && task.comments.length > 0) {
      task.comments.slice(0, 2).forEach(comment => {
        updates.push({
          type: 'comment',
          content: comment.content,
          author: comment.author.name,
          time: new Date(comment.createdAt).toLocaleDateString()
        });
      });
    }

    return updates.slice(0, 3); // Return max 3 updates
  };

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-700 text-gray-300">
                <th className="text-left p-4">Task</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Priority</th>
                <th className="text-left p-4">Assigned To</th>
                <th className="text-left p-4">Recent Updates</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400">
                    No tasks found
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const lastUpdates = getLastUpdates(task);
                  
                  return (
                    <tr 
                      key={task.id} 
                      className="border-b border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(task)}
                    >
                      {/* Task Title */}
                      <td className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium text-lg truncate">
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-gray-400 text-sm mt-1 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`status-badge ${getStatusColor(task.status)}`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="p-4">
                        <span className={`status-badge ${getPriorityColor(task.priority)}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="p-4">
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
                      </td>

                      {/* Recent Updates */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {lastUpdates.map((update, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-300 text-xs truncate">
                                  {update.content}
                                </p>
                                <div className="flex items-center space-x-1 mt-0.5">
                                  <span className="text-gray-500 text-xs">{update.author}</span>
                                  <span className="text-gray-500 text-xs">•</span>
                                  <span className="text-gray-500 text-xs">{update.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {task.comments && task.comments.length > 0 && (
                            <div className="text-gray-500 text-xs mt-1">
                              💬 {task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

export default TaskList; 