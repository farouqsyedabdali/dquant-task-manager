import { useState, useEffect } from 'react';
import useTaskStore from '../../stores/taskStore';
import useAuthStore from '../../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '../../utils/constants';
import TaskModal from './TaskModal';
import TaskFilters from './TaskFilters';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

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

const TaskTable = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { 
    tasks, 
    isLoading, 
    error, 
    fetchTasks, 
    deleteTask, 
    updateTaskStatus, 
    updateTaskPriority,
    filters,
    setFilters,
    clearFilters,
    getFilteredTasks
  } = useTaskStore();

  const { isAdmin } = useAuthStore();

  useEffect(() => {
    fetchTasks(filters);
  }, [fetchTasks, filters]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const handlePriorityChange = async (taskId, newPriority) => {
    await updateTaskPriority(taskId, newPriority);
  };

  const handleDelete = async (taskId) => {
    setDeleteTaskId(taskId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTaskId) {
      await deleteTask(deleteTaskId);
      setIsDeleteModalOpen(false);
      setDeleteTaskId(null);
    }
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleView = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // Sort tasks
  const sortedTasks = getFilteredTasks().sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'assignedTo') {
      aValue = a.assignedTo?.name || '';
      bValue = b.assignedTo?.name || '';
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <TaskFilters 
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={clearFilters}
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('title')}
                >
                  Title {getSortIcon('title')}
                </th>
                <th 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('assignedTo')}
                >
                  Assigned To {getSortIcon('assignedTo')}
                </th>
                <th 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('priority')}
                >
                  Priority {getSortIcon('priority')}
                </th>
                <th 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('createdAt')}
                >
                  Created {getSortIcon('createdAt')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No tasks found
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td>
                      <div className="font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="space-y-1">
                        {/* Lead Assignee */}
                        {task.assignedTo ? (
                          <div className="flex items-center space-x-2">
                            <div className="avatar placeholder">
                              <div className="bg-indigo-600 text-white rounded-full w-6">
                                <span className="text-xs">{task.assignedTo.name.charAt(0)}</span>
                              </div>
                            </div>
                            <span className="text-sm text-indigo-400">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                        
                        {/* Co-Assignees */}
                        {task.coAssignees && task.coAssignees.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.coAssignees.slice(0, 3).map((coAssignee) => (
                              <div key={coAssignee.id} className="flex items-center space-x-1">
                                <div className="avatar placeholder">
                                  <div className="bg-green-600 text-white rounded-full w-5">
                                    <span className="text-xs">{coAssignee.user.name.charAt(0)}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-green-400">{coAssignee.user.name}</span>
                              </div>
                            ))}
                            {task.coAssignees.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{task.coAssignees.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {isAdmin() ? (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className={`select select-sm ${STATUS_COLORS[task.status]}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`status-badge ${getStatusColor(task.status)}`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                      )}
                    </td>
                    <td>
                      {isAdmin() ? (
                        <select
                          value={task.priority}
                          onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                          className={`select select-sm ${PRIORITY_COLORS[task.priority]}`}
                        >
                          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`status-badge ${getPriorityColor(task.priority)}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="text-sm text-gray-500">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(task.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(task)}
                          className="btn btn-ghost btn-xs"
                          title="View Details"
                        >
                          👁️
                        </button>
                        {isAdmin() && (
                          <>
                            <button
                              onClick={() => handleEdit(task)}
                              className="btn btn-ghost btn-xs"
                              title="Edit Task"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="btn btn-ghost btn-xs text-error"
                              title="Delete Task"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={closeModal}
          isEdit={isAdmin()}
          onTaskChange={(newTask) => {
            setSelectedTask(newTask);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTaskId && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTaskId(null);
          }}
          onConfirm={confirmDelete}
          taskTitle={tasks.find(t => t.id === deleteTaskId)?.title || 'Unknown Task'}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default TaskTable; 