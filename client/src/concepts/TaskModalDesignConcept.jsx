import { useState, useEffect, useCallback } from 'react';
import useTaskStore from '../../stores/taskStore';
import useAuthStore from '../../context/authStore';
import useUserStore from '../../stores/userStore';
import { STATUS_LABELS, PRIORITY_LABELS, getMinDueDate } from '../../utils/constants';
import CommentSection from '../comments/CommentSection';
import AddSubtaskModal from './AddSubtaskModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import TaskShareModal from './TaskShareModal';
import SearchableDropdown from '../common/SearchableDropdown';
import { usersAPI, tasksAPI } from '../../services/api';
import TaskUpdatesSection from './TaskUpdatesSection';
import TaskActionButtons from './TaskActionButtons';
import CoAssigneeList from './CoAssigneeList';
import SharedWithList from './SharedWithList';
import TaskEditModal from './TaskEditModal';
import AIModal from './AIModal';
import TaskSummaryModal from './TaskSummaryModal';

const TaskModal = ({ task, isOpen, onClose, onDelete, onArchive, onUnarchive, extensionUpdateData = null }) => {
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewedTask, setViewedTask] = useState(task); // local state for current viewed task
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [coAssignees, setCoAssignees] = useState([]);
  const [isLoadingCoAssignees, setIsLoadingCoAssignees] = useState(false);
  const [isAddingCoAssignee, setIsAddingCoAssignee] = useState(false);
  const [selectedCoAssigneeId, setSelectedCoAssigneeId] = useState('');
  const [sharedWith, setSharedWith] = useState([]);
  const [isLoadingSharedWith, setIsLoadingSharedWith] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const { updateTask, isLoading, fetchTask } = useTaskStore();
  const { user, isAdmin } = useAuthStore();
  const { recentEmployees, addToRecentEmployees } = useUserStore();
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  // Check if current user is viewing a shared task (view-only access)
  const isSharedTask = viewedTask?.sharedWith?.some(share => share.userId === user?.id);
  
  // Check if current user is the lead assignee (can share)
  const canShare = viewedTask?.assigneeId === user?.id;
  
  // Check if user can archive/unarchive this task
  const canArchive = !isSharedTask && (
    isAdmin || 
    user?.role === 'SYSDMIN' || 
    viewedTask?.assignerId === user?.id
  );

  // Check if task is completed or cancelled
  const isTaskLocked = viewedTask?.status === 'COMPLETED' || viewedTask?.status === 'CANCELLED';
  
  // If task is locked, only allow status changes back to TODO or IN_PROGRESS
  const allowedStatuses = isTaskLocked 
    ? ['TODO', 'IN_PROGRESS'] 
    : Object.keys(STATUS_LABELS);

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

  const fetchCoAssignees = useCallback(async (taskId) => {
    if (!taskId) return;
    
    try {
      setIsLoadingCoAssignees(true);
      const response = await tasksAPI.getCoAssignees(taskId);
      setCoAssignees(response.data);
    } catch (error) {
      console.error('Error fetching co-assignees:', error);
    } finally {
      setIsLoadingCoAssignees(false);
    }
  }, []);

  const fetchSharedWith = useCallback(async (taskId) => {
    if (!taskId) return;
    
    try {
      setIsLoadingSharedWith(true);
      const response = await tasksAPI.getSharedWith(taskId);
      setSharedWith(response.data || []);
    } catch (error) {
      console.error('Error fetching shared users:', error);
    } finally {
      setIsLoadingSharedWith(false);
    }
  }, []);

  // Auto-change status from TODO to IN_PROGRESS on updates
  const handleAutoStatusChange = useCallback(async (taskId) => {
    if (!taskId || !viewedTask) return;
    
    // Only auto-change if status is TODO and hasn't been manually changed
    if (viewedTask.status === 'TODO' && !viewedTask.statusManuallyChanged) {
      try {
        await updateTask(taskId, { status: 'IN_PROGRESS' });
        // Update local state
        setViewedTask(prev => ({ ...prev, status: 'IN_PROGRESS' }));
      } catch (error) {
        console.error('Error auto-changing status:', error);
      }
    }
  }, [viewedTask, updateTask]);

  // When the modal opens or the task prop changes, update viewedTask
  useEffect(() => {
    if (isOpen && task) {
      setViewedTask(task);
      if (isOpen) {
        fetchUsers();
        fetchCoAssignees(task.id);
        fetchSharedWith(task.id);
      }
    }
  }, [isOpen, task, fetchCoAssignees, fetchSharedWith]);

  // Update form data when viewedTask changes
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

  const handleAddCoAssignee = async () => {
    if (!selectedCoAssigneeId || !viewedTask?.id) return;

    try {
      setIsAddingCoAssignee(true);
      const response = await tasksAPI.addCoAssignee(viewedTask.id, selectedCoAssigneeId);
      
      // Add to co-assignees list
      setCoAssignees(prev => [...prev, response.data]);
      
      // Update viewedTask to include new co-assignee
      setViewedTask(prev => ({
        ...prev,
        coAssignees: [...(prev.coAssignees || []), response.data]
      }));
      
      // Track as recent employee
      const selectedUser = users.find(u => u.id.toString() === selectedCoAssigneeId);
      if (selectedUser) {
        addToRecentEmployees(selectedUser);
      }
      
      // Trigger auto-status change
      await handleAutoStatusChange(viewedTask.id);
      
      setSelectedCoAssigneeId('');
    } catch (error) {
      console.error('Error adding co-assignee:', error);
      alert(error.response?.data?.error || 'Failed to add co-assignee');
    } finally {
      setIsAddingCoAssignee(false);
    }
  };

  const handleRemoveCoAssignee = async (userId) => {
    if (!viewedTask?.id) return;

    try {
      await tasksAPI.removeCoAssignee(viewedTask.id, userId);
      setCoAssignees(prev => prev.filter(co => co.userId !== userId));
      
      // Update viewedTask to remove co-assignee
      setViewedTask(prev => ({
        ...prev,
        coAssignees: (prev.coAssignees || []).filter(co => co.userId !== userId)
      }));
    } catch (error) {
      console.error('Error removing co-assignee:', error);
      alert(error.response?.data?.error || 'Failed to remove co-assignee');
    }
  };

  // Create a comprehensive task summary
  const createTaskSummary = async (task) => {
    const formatDate = (dateString) => {
      if (!dateString) return 'No due date set';
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `Overdue by ${Math.abs(diffDays)} day(s)`;
      } else if (diffDays === 0) {
        return 'Due today';
      } else if (diffDays === 1) {
        return 'Due tomorrow';
      } else {
        return `Due in ${diffDays} day(s)`;
      }
    };

    const getStatusEmoji = (status) => {
      switch (status) {
        case 'TODO': return '⏳';
        case 'IN_PROGRESS': return '🔄';
        case 'COMPLETED': return '✅';
        case 'ON_HOLD': return '⏸️';
        case 'CANCELLED': return '❌';
        default: return '❓';
      }
    };

    const getPriorityEmoji = (priority) => {
      switch (priority) {
        case 'URGENT': return '🚨';
        case 'HIGH': return '🔴';
        case 'MEDIUM': return '🟡';
        case 'LOW': return '🟢';
        default: return '⚪';
      }
    };

    // Create text summary of title, description, and comments
    let textSummary = `Task: ${task.title}`;
    
    if (task.description) {
      textSummary += `\n\nDescription: ${task.description}`;
    }
    
    if (task.comments && task.comments.length > 0) {
      textSummary += `\n\nComments Summary:`;
      task.comments.forEach((comment, index) => {
        textSummary += `\n${index + 1}. ${comment.author.name}: ${comment.content}`;
      });
    }

    return {
      title: task.title,
      status: task.status,
      priority: task.priority,
      description: task.description || 'No description',
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date',
      dueDateStatus: formatDate(task.dueDate),
      createdAt: new Date(task.createdAt).toLocaleDateString(),
      assignee: task.assignee?.name || 'Unassigned',
      coAssignees: task.coAssignees?.map(co => co.user.name).join(', ') || 'None',
      subtasks: task.subtasks?.map(sub => sub.title).join(', ') || 'None',
      comments: task.comments || [],
      textSummary: textSummary,
      statusEmoji: getStatusEmoji(task.status),
      priorityEmoji: getPriorityEmoji(task.priority)
    };
  };

  // Handle task summarization
  const handleSummarizeTask = async () => {
    if (!viewedTask) return;

    try {
      const summary = await createTaskSummary(viewedTask);
      setSummaryData(summary);
      setIsSummaryModalOpen(true);
    } catch (error) {
      console.error('Failed to create task summary:', error);
      alert('Failed to create task summary');
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
    
    // Enforce due date requirement
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const now = new Date();
      
      // Check if due date is in the past
      if (selectedDate <= now) {
        newErrors.dueDate = 'Due date must be in the future';
      }
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
      assigneeId: isPersonalAccount ? user.id : parseInt(formData.assigneeId),
      dueDate: formData.dueDate || null
    };

    const result = await updateTask(viewedTask.id, updateData);
    if (result.success) {
      // Update the viewedTask with the new data
      setViewedTask(prev => ({
        ...prev,
        ...result.data,
        // Ensure we have the latest data
        title: result.data.title || formData.title,
        description: result.data.description || formData.description,
        status: result.data.status || formData.status,
        priority: result.data.priority || formData.priority,
        assigneeId: result.data.assigneeId || formData.assigneeId,
        dueDate: result.data.dueDate || formData.dueDate
      }));
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (onDelete) {
      await onDelete(viewedTask.id);
      onClose();
    }
  };

  const handleTaskClick = (taskId) => {
    // This would typically open the task in a new modal or navigate to it
    console.log('Opening task:', taskId);
  };

  const getStatusColor = (status) => {
    const colors = {
      'TODO': 'bg-gray-500 text-white',
      'IN_PROGRESS': 'bg-blue-500 text-white',
      'COMPLETED': 'bg-green-500 text-white',
      'ON_HOLD': 'bg-yellow-500 text-white',
      'CANCELLED': 'bg-red-500 text-white'
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-green-500 text-white',
      'MEDIUM': 'bg-yellow-500 text-white',
      'HIGH': 'bg-orange-500 text-white',
      'URGENT': 'bg-red-500 text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  if (!isOpen || !viewedTask) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 50 }}>
      <div className="modal-box max-w-7xl max-h-[95vh] overflow-hidden bg-gray-800 border border-gray-700 p-0">
        {/* Header - Task Title Only */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={50}
                    className="input input-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter task title"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                  )}
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-white">{viewedTask.title}</h2>
              )}
            </div>
            
            {/* Close Button Only in Header */}
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Three-Section Layout */}
        <div className="flex h-[calc(95vh-120px)]">
          {/* Left Section - Task Details & Updates */}
          <div className="w-1/2 border-r border-gray-700 flex flex-col">
            {/* Task Basic Info */}
            <div className="p-6 border-b border-gray-700">
              {/* Description */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                {isEditing ? (
                  <div>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      maxLength={300}
                      rows={4}
                      disabled={isTaskLocked}
                      className={`textarea bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full rounded-lg focus:border-indigo-500 focus:ring-indigo-500 ${isTaskLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder={isTaskLocked ? "Cannot edit completed/cancelled task" : "Enter task description"}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {formData.description.length}/300 characters
                    </div>
                    {isTaskLocked && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Description cannot be edited for completed/cancelled tasks
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <p className="text-gray-300">
                      {viewedTask.description || 'No description provided'}
                    </p>
                  </div>
                )}
              </div>

              {/* Task Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Status</h4>
                  {isEditing ? (
                    <div>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="select select-sm bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {allowedStatuses.map((value) => (
                          <option key={value} value={value}>{STATUS_LABELS[value]}</option>
                        ))}
                      </select>
                      {isTaskLocked && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Task is {viewedTask?.status.toLowerCase()}. Only status changes to "To Do" or "In Progress" are allowed.
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(viewedTask.status)}`}>
                      {STATUS_LABELS[viewedTask.status]}
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Priority</h4>
                  {isEditing ? (
                    <div>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        disabled={isTaskLocked}
                        className={`select select-sm bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500 ${isTaskLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      {isTaskLocked && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Priority cannot be edited for completed/cancelled tasks
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getPriorityColor(viewedTask.priority)}`}>
                      {PRIORITY_LABELS[viewedTask.priority]}
                    </span>
                  )}
                </div>

                {/* Due Date */}
                <div className="col-span-2">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Due Date *</h4>
                  {isEditing ? (
                    <div>
                      <input
                        type="datetime-local"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        min={getMinDueDate()}
                        disabled={isTaskLocked}
                        className={`input input-sm bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500 ${errors.dueDate ? 'border-red-500' : ''} ${isTaskLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {errors.dueDate && (
                        <p className="text-red-400 text-xs mt-1">{errors.dueDate}</p>
                      )}
                      {isTaskLocked && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Due date cannot be edited for completed/cancelled tasks
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {viewedTask.dueDate ? (
                        <>
                          <span className="text-white">
                            {new Date(viewedTask.dueDate).toLocaleDateString()} at {new Date(viewedTask.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {new Date(viewedTask.dueDate) < new Date() && viewedTask.status !== 'COMPLETED' && (
                            <span className="status-badge-sm priority-urgent capitalize">Overdue</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">No due date</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Updates Section */}
            <div className="flex-1 overflow-y-auto">
              <TaskUpdatesSection
                task={viewedTask}
                extensionUpdateData={extensionUpdateData}
              />
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="p-6 border-t border-gray-700">
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

          {/* Right Section - Split into Top and Bottom */}
          <div className="w-1/2 flex flex-col">
            {/* Top Right - Actions & Assignments */}
            <div className="flex-1 p-6 border-b border-gray-700 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">Actions & Management</h4>
              </div>
              
              {/* Action Buttons */}
              <div className="mb-6">
                <h5 className="text-sm font-semibold text-gray-300 mb-3">Task Actions</h5>
                <TaskActionButtons
                    task={viewedTask}
                    user={user}
                    isAdmin={isAdmin}
                    isPersonalAccount={isPersonalAccount}
                    isSharedTask={isSharedTask}
                    canShare={canShare}
                    canArchive={canArchive}
                    isEditing={isEditing}
                    onEdit={() => setIsEditModalOpen(true)}
                    onDelete={handleDelete}
                    onArchive={() => {
                      if (viewedTask.archived) {
                        onUnarchive?.(viewedTask.id);
                      } else {
                        onArchive?.(viewedTask.id);
                      }
                    }}
                    onShare={() => setIsShareModalOpen(true)}
                    onCoAssign={() => {/* Will be handled by co-assign modal */}}
                    onComplete={() => {
                      updateTask(viewedTask.id, { status: 'COMPLETED' });
                    }}
                    onClose={() => {}} // Remove close from action buttons
                    onCoAssignAdded={(newCoAssignee) => {
                      // Add to co-assignees list
                      setCoAssignees(prev => [...prev, newCoAssignee]);
                    }}
                  />
              </div>
              
              {/* Assigned To - Only show for company accounts */}
              {!isPersonalAccount && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Assigned To</h4>
                  {isEditing ? (
                    <div>
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
                        disabled={isLoadingUsers || isTaskLocked}
                        recentEmployees={recentEmployees}
                      />
                      {isTaskLocked && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Assignee cannot be changed for completed/cancelled tasks
                        </p>
                      )}
                    </div>
                  ) : (
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
                  )}
                </div>
              )}

              {/* Co-Assignees - Only show for company accounts */}
              {!isPersonalAccount && (
                <div className="mb-6">
                  <CoAssigneeList
                    coAssignees={coAssignees}
                    leadAssignee={viewedTask.assignee}
                    task={viewedTask}
                    user={user}
                    isPersonalAccount={isPersonalAccount}
                    canManageCoAssignees={viewedTask?.assigneeId === user?.id && !isTaskLocked}
                    onCoAssignAdded={(newCoAssignee) => {
                      setCoAssignees(prev => [...prev, newCoAssignee]);
                      handleAutoStatusChange(viewedTask.id);
                    }}
                    onRemoveCoAssignee={handleRemoveCoAssignee}
                  />
                  {isTaskLocked && (
                    <p className="text-xs text-yellow-400 mt-2">
                      Co-assignees cannot be managed for completed/cancelled tasks
                    </p>
                  )}
                </div>
              )}

              {/* Shared With - Only show for company accounts */}
              {!isPersonalAccount && (
                <div className="mb-6">
                  <SharedWithList
                    sharedWith={sharedWith}
                    canManageShares={canShare}
                    onRemoveShare={async (userId) => {
                      // Implement remove share functionality
                      console.log('Remove share for user:', userId);
                    }}
                  />
                </div>
              )}

              {/* Parent Task */}
              {viewedTask.parentTask && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Parent Task</h4>
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
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Subtasks ({viewedTask.subtasks.length})</h4>
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(subtask.status)}`}>
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
              {(viewedTask.assignerId === user?.id || viewedTask.assigneeId === user?.id) && !isTaskLocked && (
                <button
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 w-full"
                  onClick={() => setIsAddSubtaskOpen(true)}
                >
                  + Add Subtask
                </button>
              )}
              {isTaskLocked && (viewedTask.assignerId === user?.id || viewedTask.assigneeId === user?.id) && (
                <div className="text-center py-4">
                  <p className="text-sm text-yellow-400">
                    Subtasks cannot be added to completed/cancelled tasks
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Right - Comments */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">Comments</h4>
                <button
                  onClick={handleSummarizeTask}
                  className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                  title="Summarize this task"
                >
                  🤖 Summarize
                </button>
              </div>
              <CommentSection 
                taskId={viewedTask.id} 
                extensionUpdateData={extensionUpdateData}
                taskViewers={[
                  ...(viewedTask.assignee ? [viewedTask.assignee] : []),
                  ...(coAssignees.map(co => co.user)),
                  ...(sharedWith.map(share => share.user))
                ]}
              />
            </div>
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

      {/* Add Subtask Modal */}
      <AddSubtaskModal
        isOpen={isAddSubtaskOpen}
        onClose={() => setIsAddSubtaskOpen(false)}
        parentTask={viewedTask}
        extensionUpdateData={extensionUpdateData}
      />

      {/* Task Share Modal */}
      <TaskShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        task={viewedTask}
        onShareUpdate={() => {
          // Refresh the task data to show updated shared users
          if (task) {
            fetchTask(task.id);
            fetchSharedWith(task.id);
          }
        }}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={viewedTask}
        onTaskUpdated={(updatedTask) => {
          setViewedTask(updatedTask);
          // Trigger auto-status change if needed
          handleAutoStatusChange(updatedTask.id);
        }}
      />

      {/* AI Modal */}
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />

      {/* Task Summary Modal */}
      <TaskSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryData={summaryData}
      />
    </div>
  );
};

export default TaskModal;