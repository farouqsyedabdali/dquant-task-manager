import { useState, useEffect } from 'react';
import useTaskStore from '../../stores/taskStore';
import useUserStore from '../../stores/userStore';
import useAuthStore from '../../context/authStore';
import { PRIORITY_OPTIONS, getDefaultDueDate } from '../../utils/constants';
import { usersAPI, tasksAPI } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';

const AddSubtaskModal = ({ isOpen, onClose, parentTask, extensionUpdateData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: getDefaultDueDate()
  });
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(parentTask?.id || '');

  const { createSubtask, isLoading } = useTaskStore();
  const { recentEmployees, addToRecentEmployees } = useUserStore();
  const { user } = useAuthStore();

  // Fetch users and available tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchAvailableTasks();
    }
  }, [isOpen]);

  // Function to fetch available parent tasks
  const fetchAvailableTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      
      // Show all visible tasks as potential parents
      // (A subtask can also be a parent to other subtasks)
      const parentTasks = response.data;
      
      setAvailableTasks(parentTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setAvailableTasks([]);
    }
  };

  // Prefill form when users are loaded and extensionUpdateData is present
  useEffect(() => {
    if (isOpen && users.length > 0 && extensionUpdateData) {
      // Set the suggested parent task from AI
      if (extensionUpdateData.taskId) {
        setSelectedParentId(extensionUpdateData.taskId.toString());
      }
      
      if (extensionUpdateData.subtaskData) {
        const { title, description, priority, assignee, dueDate } = extensionUpdateData.subtaskData;
        let assigneeId = '';
        if (assignee) {
          const found = users.find(u => u.name.toLowerCase() === assignee.toLowerCase());
          if (found) assigneeId = found.id.toString();
        }
        setFormData(prev => ({
          ...prev,
          title: title || '',
          description: description || '',
          priority: priority || 'MEDIUM',
          assigneeId: assigneeId,
          dueDate: dueDate ? new Date(dueDate).toISOString().slice(0, 16) : getDefaultDueDate()
        }));
      } else if (extensionUpdateData.originalText) {
        const originalText = extensionUpdateData.originalText;
        let title = '';
        let description = originalText;
        if (originalText.length <= 50) {
          title = originalText;
          description = '';
        } else {
          const firstSentence = originalText.split(/[.!?]/)[0].trim();
          if (firstSentence.length <= 50) {
            title = firstSentence;
            description = originalText;
          } else {
            title = originalText.substring(0, 50);
            description = originalText;
          }
        }
        setFormData(prev => ({
          ...prev,
          title: title,
          description: description.length > 300 ? description.substring(0, 300) : description,
          priority: 'MEDIUM',
          assigneeId: user ? user.id.toString() : '',
          dueDate: getDefaultDueDate()
        }));
      }
    }
  }, [isOpen, extensionUpdateData, users]);

  // Set default assignee to current user when users are loaded and no assignee is set
  useEffect(() => {
    if (users.length > 0 && user && isOpen && !formData.assigneeId) {
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          assigneeId: currentUser.id.toString()
        }));
      }
    }
  }, [users, user, isOpen, formData.assigneeId]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await usersAPI.getEmployees();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
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
    
    if (!formData.assigneeId) {
      newErrors.assigneeId = 'Assignee is required';
    }
    
    if (formData.description && formData.description.length > 300) {
      newErrors.description = 'Description must be 300 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!selectedParentId) {
      setErrors({ parentTask: 'Please select a parent task' });
      return;
    }

    // Prepare the data for creation
    const createData = {
      ...formData,
      assigneeId: parseInt(formData.assigneeId),
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
    };

    const result = await createSubtask(parseInt(selectedParentId), createData);
    if (result.success) {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: user ? user.id.toString() : '',
        dueDate: getDefaultDueDate()
      });
      setErrors({});
      setSelectedParentId(parentTask?.id || '');
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      assigneeId: user ? user.id.toString() : '',
      dueDate: getDefaultDueDate()
    });
    setErrors({});
    setSelectedParentId(parentTask?.id || '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open" style={{ zIndex: 60 }}>
      <div className="modal-box max-w-2xl bg-gray-800 border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">
              Create Subtask
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Creating subtask for: <span className="text-white font-medium">
                {selectedParentId ? availableTasks.find(t => t.id == selectedParentId)?.title || 'Selected Task' : 'Choose parent task below'}
              </span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Task Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Parent Task *
            </label>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className={`select select-bordered w-full bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500 ${errors.parentTask ? 'border-red-500' : ''}`}
            >
              <option value="">Select a parent task...</option>
              {availableTasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.status})
                </option>
              ))}
            </select>
            {errors.parentTask && (
              <p className="text-red-400 text-sm mt-1">{errors.parentTask}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title * ({formData.title.length}/50)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={50}
              className={`input bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500 ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter subtask title"
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description ({formData.description.length}/300)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={300}
              rows={4}
              className="textarea bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter subtask description"
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="select bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
            >
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assign To *
            </label>
            <SearchableDropdown
              options={users}
              value={formData.assigneeId}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, assigneeId: value }));
                // Track the selected employee as recent
                const selectedEmployee = users.find(user => user.id.toString() === value);
                if (selectedEmployee) {
                  addToRecentEmployees(selectedEmployee);
                }
              }}
              placeholder="Select an employee"
              disabled={isLoadingUsers}
              error={!!errors.assigneeId}
              recentEmployees={recentEmployees}
            />
            {errors.assigneeId && (
              <p className="text-red-400 text-sm mt-1">{errors.assigneeId}</p>
            )}
            {isLoadingUsers && (
              <p className="text-sm text-gray-400 mt-1">Loading employees...</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="input bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
              min={new Date().toISOString().slice(0, 16)}
            />
            {errors.dueDate && (
              <p className="text-red-400 text-sm mt-1">{errors.dueDate}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Subtask'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubtaskModal; 