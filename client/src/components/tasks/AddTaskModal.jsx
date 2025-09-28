import { useState, useEffect } from 'react';
import useTaskStore from '../../stores/taskStore';
import useUserStore from '../../stores/userStore';
import useAuthStore from '../../context/authStore';
import { PRIORITY_OPTIONS, getDefaultDueDate } from '../../utils/constants';
import { usersAPI } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';

const AddTaskModal = ({ isOpen, onClose, initialData = null }) => {
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

  const { createTask, isLoading } = useTaskStore();
  const { recentEmployees, addToRecentEmployees } = useUserStore();
  const { user } = useAuthStore();
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  useEffect(() => {
    if (isOpen && !isPersonalAccount) {
      fetchUsers();
    } else if (isOpen && isPersonalAccount) {
      // For personal accounts, set the current user as the only option
      setUsers([user]);
      setFormData(prev => ({
        ...prev,
        assigneeId: user?.id?.toString() || ''
      }));
    }
  }, [isOpen, isPersonalAccount, user]);

  // Handle initial data from browser extension
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(prev => ({
        ...prev,
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'MEDIUM',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 16) : getDefaultDueDate(),
        // We'll handle assignee after users are loaded
      }));
    }
  }, [initialData, isOpen]);

  // Set assignee after users are loaded and if initialData has assignee name
  useEffect(() => {
    if (initialData?.assignee && users.length > 0 && isOpen) {
      const matchingUser = users.find(user => 
        user.name.toLowerCase().includes(initialData.assignee.toLowerCase()) ||
        initialData.assignee.toLowerCase().includes(user.name.toLowerCase())
      );
      if (matchingUser) {
        setFormData(prev => ({
          ...prev,
          assigneeId: matchingUser.id.toString()
        }));
      }
    }
  }, [initialData, users, isOpen]);

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
    
    if (!isPersonalAccount && !formData.assigneeId) {
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

    // Prepare the data for creation
    const createData = {
      ...formData,
      assigneeId: isPersonalAccount ? user.id : parseInt(formData.assigneeId),
      dueDate: formData.dueDate || null
    };

    const result = await createTask(createData);
    if (result.success) {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: user ? user.id.toString() : '',
        dueDate: getDefaultDueDate()
      });
      setErrors({});
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box max-w-2xl bg-gray-800 border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
          <h3 className="text-2xl font-bold text-white">
            Create New Task
          </h3>
            {initialData && (
              <p className="text-sm text-indigo-400 mt-1">
                ✨ Task details extracted from browser extension
              </p>
            )}
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
              placeholder="Enter task title"
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
              placeholder="Enter task description"
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

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date (Optional)
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="input bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Assign To - Only show for company accounts */}
          {!isPersonalAccount && (
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
          )}

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
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal; 