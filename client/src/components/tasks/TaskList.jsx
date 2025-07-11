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



  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-green-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getLastUpdates = (task) => {
    const updates = [];
    
    // Add comments if they exist
    if (task.comments && task.comments.length > 0) {
      task.comments.slice(0, 3).forEach(comment => {
        updates.push({
          type: 'comment',
          content: comment.content,
          author: comment.author.name,
          time: new Date(comment.createdAt).toLocaleDateString()
        });
      });
    }

    return updates; // Return all available updates (max 3 from comments)
  };

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-700 text-gray-300">
                <th className="text-left p-4 w-1/3">Task</th>
                <th className="text-left p-4 w-2/3">Recent Updates</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center py-8 text-gray-400">
                    No tasks found
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const lastUpdates = getLastUpdates(task);
                  
                  return (
                    <tr 
                      key={task.id} 
                      className="border-b border-gray-700 hover:bg-gray-900 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(task)}
                    >
                      {/* Task Title with Priority Bar */}
                      <td className="p-4">
                        <div className="flex items-start space-x-3">
                          {/* Priority Bar */}
                          <div className={`w-1 h-12 ${getPriorityColor(task.priority)} rounded-full flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-2xl truncate">
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

                      {/* Recent Updates - Horizontal Layout */}
                      <td className="p-4">
                        <div className="flex items-center space-x-4">
                          {lastUpdates.length > 0 ? (
                            <>
                              {lastUpdates.map((update, index) => (
                                <div key={index} className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-4">
                                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-gray-300 text-md truncate max-w-xs">
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
                                <div className="text-gray-500 text-xs bg-gray-700 rounded-lg px-3 py-2">
                                  💬 {task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-gray-500 text-xs bg-gray-700 rounded-lg px-3 py-2">
                              No Recent Updates
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