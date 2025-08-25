import { useState, useEffect } from 'react';
import useTaskStore from '../../stores/taskStore';
import useAuthStore from '../../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import CommentSection from '../comments/CommentSection';
import AddSubtaskModal from './AddSubtaskModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const TaskModal = ({ task, isOpen, onClose, onStatusChange, onPriorityChange, onDelete, extensionUpdateData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [isAddSubtaskOpen, setIsAddSubtaskOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewedTask, setViewedTask] = useState(task); // local state for current viewed task
  const { updateTask, isLoading, fetchTask } = useTaskStore();
  const { user, isAdmin } = useAuthStore();

  // When the modal opens or the task prop changes, update viewedTask
  useEffect(() => {
    if (isOpen && task) {
      setViewedTask(task);
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (viewedTask) {
      setFormData({
        title: viewedTask.title || '',
        description: viewedTask.description || '',
        status: viewedTask.status || 'TODO',
        priority: viewedTask.priority || 'MEDIUM',
        assigneeId: viewedTask.assigneeId?.toString() || '',
        dueDate: viewedTask.dueDate ? new Date(viewedTask.dueDate).toISOString().slice(0, 16) : ''
      });
    }
  }, [viewedTask]);

  // Handle extension data for automatic actions
  useEffect(() => {
    if (extensionUpdateData && extensionUpdateData.action === 'addSubtask') {
      setIsAddSubtaskOpen(true);
    }
  }, [extensionUpdateData]);

  // Click handler for parent/subtask
  const handleTaskClick = async (taskId) => {
    if (!taskId) return;
    const result = await fetchTask(taskId);
    if (result.success && result.data) {
      setViewedTask(result.data);
      setIsEditing(false);
      setIsAddSubtaskOpen(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Apply character limits
    let limitedValue = value;
    if (name === 'title' && value.length > 50) {
      limitedValue = value.slice(0, 50);
    } else if (name === 'description' && value.length > 300) {
      limitedValue = value.slice(0, 300);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: limitedValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 50) {
      newErrors.title = 'Title must be 50 characters or less';
    }
    
    if (formData.description && formData.description.length > 300) {
      newErrors.description = 'Description must be 300 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare the data for update
    const updateData = {
      ...formData,
      assigneeId: parseInt(formData.assigneeId),
      dueDate: formData.dueDate || null
    };

    const result = await updateTask(viewedTask.id, updateData);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (onDelete) {
      await onDelete(viewedTask.id);
    }
    setIsDeleteModalOpen(false);
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-600 text-gray-200';
      case 'IN_PROGRESS':
        return 'bg-blue-600 text-blue-200';
      case 'COMPLETED':
        return 'bg-green-600 text-green-200';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-600 text-red-200';
      case 'HIGH':
        return 'bg-orange-600 text-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-600 text-yellow-200';
      case 'LOW':
        return 'bg-green-600 text-green-200';
      default:
        return 'bg-yellow-600 text-yellow-200';
    }
  };

  if (!isOpen || !viewedTask) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {isEditing ? (
              <div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={50}
                  className="text-2xl font-bold text-white bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter task title"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formData.title.length}/50 characters
                </div>
              </div>
            ) : (
              <h3 className="text-2xl font-bold text-white mb-2">
                {viewedTask.title}
              </h3>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Created by {viewedTask.assigner?.name}</span>
              <span>•</span>
              <span>{new Date(viewedTask.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {(isAdmin() || viewedTask.assignerId === user?.id) && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            )}
            {(isAdmin() || viewedTask.assignerId === user?.id) && (
              <button
                onClick={handleDelete}
                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-0"
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
              {isEditing ? (
                <div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={300}
                    rows={4}
                    className="textarea bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter task description"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.description.length}/300 characters
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <p className="text-gray-300">
                    {viewedTask.description || 'No description provided'}
                  </p>
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Comments</h4>
              <CommentSection taskId={viewedTask.id} extensionUpdateData={extensionUpdateData} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Status</h4>
              {isEditing ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="select bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewedTask.status)}`}>
                    {STATUS_LABELS[viewedTask.status]}
                  </span>
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Priority</h4>
              {isEditing ? (
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="select bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(viewedTask.priority)}`}>
                    {PRIORITY_LABELS[viewedTask.priority]}
                  </span>
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Due Date</h4>
              {isEditing ? (
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="input bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  {viewedTask.dueDate ? (
                    <>
                      <span className="text-white">
                        {new Date(viewedTask.dueDate).toLocaleDateString()} at {new Date(viewedTask.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {new Date(viewedTask.dueDate) < new Date() && viewedTask.status !== 'COMPLETED' && (
                        <span className="badge badge-error">Overdue</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">No due date</span>
                  )}
                </div>
              )}
            </div>

            {/* Assigned To */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Assigned To</h4>
              <div className="flex items-center space-x-3">
                {viewedTask.assignee ? (
                  <>
                    <div className="avatar placeholder">
                      <div className="bg-indigo-600 text-white rounded-full w-8">
                        <span className="text-xs">{viewedTask.assignee.name.charAt(0)}</span>
                      </div>
                    </div>
                    <span className="text-white">{viewedTask.assignee.name}</span>
                  </>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </div>
            </div>

            {/* Parent Task */}
            {viewedTask.parentTask && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Parent Task</h4>
                <div
                  className="bg-gray-700 border border-gray-600 rounded-lg p-3 cursor-pointer hover:bg-gray-900 hover:text-white transition"
                  onClick={() => handleTaskClick(viewedTask.parentTask.id)}
                  title="Open parent task"
                >
                  <span className="text-white">{viewedTask.parentTask.title}</span>
                </div>
              </div>
            )}

            {/* Subtasks */}
            {viewedTask.subtasks && viewedTask.subtasks.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Subtasks ({viewedTask.subtasks.length})</h4>
                <div className="space-y-2">
                  {viewedTask.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="bg-gray-700 border border-gray-600 rounded-lg p-3 cursor-pointer hover:bg-gray-900 hover:text-white transition"
                      onClick={() => handleTaskClick(subtask.id)}
                      title="Open subtask"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white">{subtask.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subtask.status)}`}>
                          {STATUS_LABELS[subtask.status]}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        Assigned to {subtask.assignee?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Subtask Button (assigner or assignee only) */}
            {(viewedTask.assignerId === user?.id || viewedTask.assigneeId === user?.id) && (
              <button
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 w-full mt-4"
                onClick={() => setIsAddSubtaskOpen(true)}
              >
                + Add Subtask
              </button>
            )}
            {/* AddSubtaskModal */}
            {isAddSubtaskOpen && (
              <AddSubtaskModal
                isOpen={isAddSubtaskOpen}
                onClose={() => setIsAddSubtaskOpen(false)}
                parentTask={viewedTask}
                extensionUpdateData={extensionUpdateData}
              />
            )}

            {/* Save Button */}
            {isEditing && (
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 w-full"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        taskTitle={viewedTask.title}
        isLoading={isLoading}
      />
    </div>
  );
};

export default TaskModal; 