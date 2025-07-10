import { useState, useEffect } from 'react';
import useTaskStore from '../../stores/taskStore';
import useAuthStore from '../../context/authStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import CommentSection from '../comments/CommentSection';

const TaskModal = ({ task, isOpen, onClose, onStatusChange, onPriorityChange, onDelete }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assignedToId: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  const { updateTask, isLoading } = useTaskStore();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        assignedToId: task.assignedToId?.toString() || ''
      });
    }
  }, [task]);

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

    // Prepare the data for update, converting empty string to null for assignedToId
    const updateData = {
      ...formData,
      assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : null
    };

    const result = await updateTask(task.id, updateData);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      await onDelete(task.id);
      onClose();
    }
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

  if (!isOpen || !task) return null;

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
                {task.title}
              </h3>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Created by {task.createdBy?.name}</span>
              <span>•</span>
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAdmin() && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            )}
            {isAdmin() && (
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
                    className="textarea bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter task description"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.description.length}/300 characters
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <p className="text-gray-300">
                    {task.description || 'No description provided'}
                  </p>
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Comments</h4>
              <CommentSection taskId={task.id} />
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  {isAdmin() && (
                    <button
                      onClick={() => onStatusChange(task.id, task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'TODO')}
                      className="btn btn-xs bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                    >
                      Change
                    </button>
                  )}
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  {isAdmin() && (
                    <button
                      onClick={() => onPriorityChange(task.id, task.priority === 'LOW' ? 'MEDIUM' : task.priority === 'MEDIUM' ? 'HIGH' : task.priority === 'HIGH' ? 'URGENT' : 'LOW')}
                      className="btn btn-xs bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                    >
                      Change
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Assigned To */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Assigned To</h4>
              <div className="flex items-center space-x-3">
                {task.assignedTo ? (
                  <>
                    <div className="avatar placeholder">
                      <div className="bg-indigo-600 text-white rounded-full w-8">
                        <span className="text-xs">{task.assignedTo.name.charAt(0)}</span>
                      </div>
                    </div>
                    <span className="text-white">{task.assignedTo.name}</span>
                  </>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </div>
            </div>

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
    </div>
  );
};

export default TaskModal; 