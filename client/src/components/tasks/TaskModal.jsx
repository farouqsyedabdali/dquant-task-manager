import { useState, useEffect, useCallback } from 'react';
import useTaskStore from '../../stores/taskStore';
import useAuthStore from '../../context/authStore';
import useUserStore from '../../stores/userStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import CommentSection from '../comments/CommentSection';
import AddSubtaskModal from './AddSubtaskModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import TaskShareModal from './TaskShareModal';
import SendTaskEmailModal from './SendTaskEmailModal';
import TaskUpdatesModal from './TaskUpdatesModal';
import SearchableDropdown from '../common/SearchableDropdown';
import { usersAPI, tasksAPI, commentsAPI } from '../../services/api';

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
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [viewedTask, setViewedTask] = useState(task); // local state for current viewed task
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [coAssignees, setCoAssignees] = useState([]);
  const [isLoadingCoAssignees, setIsLoadingCoAssignees] = useState(false);
  const [isAddingCoAssignee, setIsAddingCoAssignee] = useState(false);
  const [selectedCoAssigneeId, setSelectedCoAssigneeId] = useState('');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
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

  // When the modal opens or the task prop changes, update viewedTask
  useEffect(() => {
    if (isOpen && task) {
      setViewedTask(task);
      if (isOpen) {
        fetchUsers();
        fetchCoAssignees(task.id);
      }
    }
  }, [isOpen, task, fetchCoAssignees]);

  const handleAddCoAssignee = async () => {
    if (!selectedCoAssigneeId || !viewedTask?.id) return;

    try {
      setIsAddingCoAssignee(true);
      const response = await tasksAPI.addCoAssignee(viewedTask.id, selectedCoAssigneeId);
      
      // Add to co-assignees list
      setCoAssignees(prev => [...prev, response.data]);
      
      // Track as recent employee
      const selectedUser = users.find(u => u.id.toString() === selectedCoAssigneeId);
      if (selectedUser) {
        addToRecentEmployees(selectedUser);
      }
      
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
    } catch (error) {
      console.error('Error removing co-assignee:', error);
      alert(error.response?.data?.error || 'Failed to remove co-assignee');
    }
  };

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

  // Handle task summarization
  const handleSummarizeTask = async () => {
    if (!viewedTask) return;
    
    setIsLoadingSummary(true);
    try {
      const summary = await createTaskSummary(viewedTask);
      setSummaryData(summary);
      setIsSummaryModalOpen(true);
    } catch (error) {
      console.error('Failed to create task summary:', error);
      alert('Failed to create task summary');
    } finally {
      setIsLoadingSummary(false);
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

    // Fetch comments for the task
    let comments = [];
    try {
      const response = await commentsAPI.getByTaskId(task.id);
      comments = response.data || [];
    } catch (error) {
      console.error('Failed to fetch comments for summary:', error);
    }

    // Create AI-style intelligent summary
    const generateIntelligentSummary = () => {
      let summary = '';
      
      // Analyze task status and urgency
      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
      const isUrgent = task.priority === 'URGENT' || task.priority === 'HIGH';
      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
      const hasParent = task.parentTask;
      const hasComments = comments.length > 0;
      
      // Start with task overview
      if (task.status === 'COMPLETED') {
        summary += `✅ This task "${task.title}" has been completed`;
      } else if (task.status === 'IN_PROGRESS') {
        summary += `🔄 "${task.title}" is currently in progress`;
      } else if (task.status === 'TODO') {
        summary += `⏳ "${task.title}" is pending and ready to start`;
      } else {
        summary += `📋 "${task.title}" is currently ${task.status.toLowerCase().replace('_', ' ')}`;
      }
      
      // Add urgency context
      if (isOverdue) {
        summary += ' and is OVERDUE';
      } else if (isUrgent && task.status !== 'COMPLETED') {
        summary += ` with ${task.priority.toLowerCase()} priority`;
      }
      
      summary += '.';
      
      // Add assignment context
      if (task.assignee && task.assigner) {
        if (task.assignee.id === task.assigner.id) {
          summary += ` ${task.assignee.name} created this task for themselves`;
        } else {
          summary += ` Assigned by ${task.assigner.name} to ${task.assignee.name}`;
        }
      } else if (task.assignee) {
        summary += ` Currently assigned to ${task.assignee.name}`;
      } else if (task.assigner) {
        summary += ` Created by ${task.assigner.name} but unassigned`;
      }
      
      // Add due date context
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          summary += ` and was due ${Math.abs(diffDays)} day(s) ago`;
        } else if (diffDays === 0) {
          summary += ' and is due today';
        } else if (diffDays === 1) {
          summary += ' and is due tomorrow';
        } else if (diffDays <= 7) {
          summary += ` and is due in ${diffDays} day(s)`;
        } else {
          summary += ` with a due date of ${dueDate.toLocaleDateString()}`;
        }
      }
      
      summary += '.';
      
      // Add description context if available
      if (task.description && task.description.trim()) {
        const descLength = task.description.length;
        if (descLength > 100) {
          summary += ` The task includes detailed requirements and specifications.`;
        } else {
          summary += ` Additional context: "${task.description.substring(0, 80)}${descLength > 80 ? '...' : ''}"`;
        }
      }
      
      // Add hierarchy context
      if (hasParent && hasSubtasks) {
        summary += ` This is a mid-level task with ${task.subtasks.length} subtask(s) and is part of "${task.parentTask.title}".`;
      } else if (hasParent) {
        summary += ` This task is a subtask of "${task.parentTask.title}".`;
      } else if (hasSubtasks) {
        summary += ` This is a parent task managing ${task.subtasks.length} subtask(s).`;
      }
      
      // Add collaboration context
      if (hasComments) {
        const recentComments = comments.slice(0, 3);
        const uniqueCommenters = [...new Set(recentComments.map(c => c.author?.name).filter(Boolean))];
        
        if (uniqueCommenters.length > 1) {
          summary += ` Active collaboration with ${comments.length} comment(s) from ${uniqueCommenters.length} team member(s).`;
        } else if (comments.length > 1) {
          summary += ` Includes ${comments.length} comment(s) with ongoing discussion.`;
        } else {
          summary += ` Has ${comments.length} comment for additional context.`;
        }
      }
      
      // Add actionable insight
      if (task.status !== 'COMPLETED') {
        if (isOverdue && isUrgent) {
          summary += ' ⚠️ IMMEDIATE ATTENTION REQUIRED - This high-priority task is overdue.';
        } else if (isOverdue) {
          summary += ' ⏰ This task requires attention as it has passed its due date.';
        } else if (isUrgent && task.status === 'TODO') {
          summary += ' 🚨 High priority task ready to begin.';
        } else if (task.status === 'IN_PROGRESS') {
          summary += ' 👍 Task is actively being worked on.';
        }
      } else {
        summary += ' ✨ Task successfully completed.';
      }
      
      return summary;
    };

    const textSummary = generateIntelligentSummary();

    return {
      title: task.title,
      description: task.description || 'No description provided',
      textSummary: textSummary,
      status: `${getStatusEmoji(task.status)} ${task.status.replace('_', ' ')}`,
      priority: `${getPriorityEmoji(task.priority)} ${task.priority}`,
      dueDate: formatDate(task.dueDate),
      createdBy: task.assigner?.name || 'Unknown',
      assignedTo: task.assignee?.name || 'Unassigned',
      createdAt: new Date(task.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      comments: comments.length,
      subtasks: task.subtasks?.length || 0
    };
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
    <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 50 }}>
      <div className="modal-box max-w-5xl max-h-[90vh] min-h-[550px] overflow-y-auto bg-gray-800 border border-gray-700 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {/* Header - Title and Action Buttons */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            {/* Left: Title */}
            <div className="flex-1 pr-4">
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
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      {viewedTask.title}
                    </h3>
                    {isSharedTask && (
                      <div className="status-badge bg-blue-600 text-blue-100 capitalize">
                        📤 Shared with you
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    {!isPersonalAccount && <span>Created by {viewedTask.assigner?.name}</span>}
                    {!isPersonalAccount && <span>•</span>}
                    <span>{new Date(viewedTask.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Action Buttons and Close */}
            <div className="flex items-start gap-2 flex-shrink-0">
              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 max-w-xs">
            <button
              onClick={() => setIsUpdatesModalOpen(true)}
              className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white border-blue-600 text-xs px-2"
              title="View task updates"
            >
              <span className="text-sm">📊</span>
              <span className="hidden sm:inline ml-1">Updates</span>
            </button>
            
            <button
              onClick={handleSummarizeTask}
              disabled={isLoadingSummary}
              className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-xs px-2"
              title="Summarize this task"
            >
              {isLoadingSummary ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <>
                  <span className="text-sm">📋</span>
                  <span className="hidden sm:inline ml-1">Summary</span>
                </>
              )}
            </button>
            
            {canShare && !isPersonalAccount && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 text-xs px-2"
                title="Share this task"
              >
                <span className="text-sm">📤</span>
                <span className="hidden sm:inline ml-1">Share</span>
              </button>
            )}
            
            {(viewedTask?.assignerId === user?.id) && (
              <button
                onClick={() => setIsSendEmailModalOpen(true)}
                className="btn btn-sm bg-green-600 hover:bg-green-700 text-white border-green-600 text-xs px-2"
                title="Send task via email"
              >
                <span className="text-sm">📧</span>
                <span className="hidden sm:inline ml-1">Email</span>
              </button>
            )}
            
            {canArchive && (
              <button
                onClick={() => {
                  if (viewedTask.archived) {
                    onUnarchive?.(viewedTask.id);
                  } else {
                    onArchive?.(viewedTask.id);
                  }
                }}
                className={`btn btn-sm text-xs px-2 ${
                  viewedTask.archived 
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600'
                }`}
                title={viewedTask.archived ? 'Unarchive this task' : 'Archive this task'}
              >
                <span className="text-sm">{viewedTask.archived ? '📂' : '📁'}</span>
                <span className="hidden sm:inline ml-1">{viewedTask.archived ? 'Unarchive' : 'Archive'}</span>
              </button>
            )}
            
            {(isAdmin() || viewedTask.assignerId === user?.id) && !isSharedTask && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-white border-gray-600 text-xs px-2"
              >
                <span className="text-sm">✏️</span>
                <span className="hidden sm:inline ml-1">{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
            )}
            
            {(isAdmin() || viewedTask.assignerId === user?.id) && !isSharedTask && (
              <button
                onClick={handleDelete}
                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-0 text-xs px-2"
              >
                <span className="text-sm">🗑️</span>
                <span className="hidden sm:inline ml-1">Delete</span>
              </button>
            )}
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

        {/* Two Column Layout: Left (Task Details) and Right (Comments) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* LEFT COLUMN - Task Details */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
              {isEditing ? (
                <div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={300}
                    rows={4}
                    className="textarea textarea-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter task description"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.description.length}/300 characters
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">
                    {viewedTask.description || 'No description provided'}
                  </p>
                </div>
              )}
            </div>

            {/* Status, Priority, Due Date - Inline */}
            <div className="grid grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <h4 className="text-base font-semibold text-gray-300 mb-3">Status</h4>
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
                  <span className={`px-3 py-2 rounded-full text-sm font-medium capitalize ${getStatusColor(viewedTask.status)}`}>
                    {STATUS_LABELS[viewedTask.status]}
                  </span>
                )}
              </div>

              {/* Priority */}
              <div>
                <h4 className="text-base font-semibold text-gray-300 mb-3">Priority</h4>
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
                  <span className={`px-3 py-2 rounded-full text-sm font-medium capitalize ${getPriorityColor(viewedTask.priority)}`}>
                    {PRIORITY_LABELS[viewedTask.priority]}
                  </span>
                )}
              </div>

              {/* Due Date */}
              <div>
                <h4 className="text-base font-semibold text-gray-300 mb-3">Due Date</h4>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="input bg-gray-700 border-gray-600 text-white w-full focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="flex flex-col">
                    {viewedTask.dueDate ? (
                      <>
                        <span className="text-white text-base">
                          {new Date(viewedTask.dueDate).toLocaleDateString()}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {new Date(viewedTask.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {new Date(viewedTask.dueDate) < new Date() && viewedTask.status !== 'COMPLETED' && (
                          <span className="text-red-400 text-sm mt-1">Overdue</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 text-base">No due date</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned To & Co-Assignees - Side by side for company accounts */}
            {!isPersonalAccount && (
              <div className="grid grid-cols-2 gap-4">
                {/* Assigned To */}
                <div>
                  <h4 className="text-base font-semibold text-gray-300 mb-3">Assigned To</h4>
                  {isEditing ? (
                    <SearchableDropdown
                      options={users}
                      value={formData.assigneeId}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, assigneeId: value }));
                        const selectedEmployee = users.find(user => user.id.toString() === value);
                        if (selectedEmployee) {
                          addToRecentEmployees(selectedEmployee);
                        }
                      }}
                      placeholder="Select an employee"
                      disabled={isLoadingUsers}
                      recentEmployees={recentEmployees}
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      {viewedTask.assignee ? (
                        <div className="flex items-center space-x-3 group relative">
                          <div className="avatar placeholder">
                            <div className="bg-indigo-600 text-white rounded-full w-10">
                              <span className="text-sm">{viewedTask.assignee.name.charAt(0)}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-white text-base">{viewedTask.assignee.name}</span>
                          </div>
                          {/* Email tooltip */}
                          <div className="absolute left-0 top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap">
                            {viewedTask.assignee.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-base">Unassigned</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Co-Assignees */}
                <div>
                  <h4 className="text-base font-semibold text-gray-300 mb-3">Co-Assignees</h4>
                  
                  {/* Check if current user is the lead assignee */}
                  {viewedTask?.assigneeId === user?.id ? (
                    <div className="space-y-2">
                      {/* Add Co-Assignee Section */}
                      <div className="flex space-x-1">
                        <div className="flex-1">
                          <SearchableDropdown
                            options={users.filter(u => 
                              u.id !== viewedTask.assigneeId && 
                              !coAssignees.some(co => co.userId === u.id)
                            )}
                            value={selectedCoAssigneeId}
                            onChange={setSelectedCoAssigneeId}
                            placeholder="Add..."
                            disabled={isLoadingUsers}
                            recentEmployees={recentEmployees}
                          />
                        </div>
                        <button
                          onClick={handleAddCoAssignee}
                          disabled={!selectedCoAssigneeId || isAddingCoAssignee}
                          className="btn btn-primary btn-sm"
                        >
                          +
                        </button>
                      </div>
                      
                      {/* Co-Assignees List */}
                      {isLoadingCoAssignees ? (
                        <div className="flex justify-center py-2">
                          <span className="loading loading-spinner loading-sm"></span>
                        </div>
                      ) : coAssignees.length > 0 ? (
                        <div className="space-y-3">
                          {coAssignees.map((coAssignee) => (
                            <div key={coAssignee.id} className="flex items-center justify-between gap-3 group relative">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="avatar placeholder flex-shrink-0">
                                  <div className="bg-green-600 text-white rounded-full w-8">
                                    <span className="text-sm">{coAssignee.user.name.charAt(0)}</span>
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-white text-base block truncate">{coAssignee.user.name}</span>
                                </div>
                                {/* Email tooltip */}
                                <div className="absolute left-0 top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap">
                                  {coAssignee.user.email}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveCoAssignee(coAssignee.userId)}
                                className="btn btn-error btn-xs flex-shrink-0 w-6 h-6 min-h-0 p-0 flex items-center justify-center"
                                title="Remove co-assignee"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No co-assignees</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {isLoadingCoAssignees ? (
                        <div className="flex justify-center py-2">
                          <span className="loading loading-spinner loading-sm"></span>
                        </div>
                      ) : coAssignees.length > 0 ? (
                        <div className="space-y-3">
                          {coAssignees.map((coAssignee) => (
                            <div key={coAssignee.id} className="flex items-center space-x-3 group relative">
                              <div className="avatar placeholder">
                                <div className="bg-green-600 text-white rounded-full w-8">
                                  <span className="text-sm">{coAssignee.user.name.charAt(0)}</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-white text-base">{coAssignee.user.name}</span>
                              </div>
                              {/* Email tooltip */}
                              <div className="absolute left-0 top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap">
                                {coAssignee.user.email}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No co-assignees</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parent Task */}
            {viewedTask.parentTask && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Parent Task</h4>
                <div
                  className="bg-gray-700 border border-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-600 transition text-sm"
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
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Subtasks ({viewedTask.subtasks.length})</h4>
                <div className="space-y-1">
                  {viewedTask.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="bg-gray-700 border border-gray-600 rounded-lg p-2 cursor-pointer hover:bg-gray-600 transition"
                      onClick={() => handleTaskClick(subtask.id)}
                      title="Open subtask"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">{subtask.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(subtask.status)}`}>
                          {STATUS_LABELS[subtask.status]}
                        </span>
                      </div>
                      {!isPersonalAccount && (
                        <div className="text-gray-400 text-xs mt-0.5">
                          {subtask.assignee?.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Subtask Button (assigner or assignee only) */}
            {(viewedTask.assignerId === user?.id || viewedTask.assigneeId === user?.id) && (
              <button
                className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-0 w-full"
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

        {/* RIGHT COLUMN - Comments */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <h4 className="text-lg font-semibold text-white mb-2">Comments</h4>
          <div className="overflow-y-auto pr-2">
            <CommentSection taskId={viewedTask.id} extensionUpdateData={extensionUpdateData} />
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

      {/* Task Share Modal */}
      <TaskShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        task={viewedTask}
        onShareUpdate={() => {
          // Refresh the task data to show updated shared users
          if (task) {
            fetchTask(task.id);
          }
        }}
      />

      {/* Send Task Email Modal */}
      <SendTaskEmailModal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        task={viewedTask}
      />

      {/* Task Updates Modal */}
      <TaskUpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        task={viewedTask}
      />

      {/* Task Summary Modal */}
      {isSummaryModalOpen && summaryData && (
        <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 60 }}>
          <div className="modal-box max-w-6xl max-h-[95vh] overflow-y-auto bg-gray-800 border border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-white">Task Summary</h3>
              <button
                onClick={() => {
                  setIsSummaryModalOpen(false);
                  setSummaryData(null);
                }}
                className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* AI Analysis Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3">Content Summary</h4>
                <div className="bg-gray-800 rounded p-3 text-gray-200 leading-relaxed">
                  {summaryData.textSummary}
                </div>
              </div>

              {/* Task Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status & Priority */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">📊 Status & Priority</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Status:</span>
                      <span className="text-white">{summaryData.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Priority:</span>
                      <span className="text-white">{summaryData.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Due Date:</span>
                      <span className="text-white">{summaryData.dueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Assignment */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">👥 Assignment</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Created By:</span>
                      <span className="text-white">{summaryData.createdBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Assigned To:</span>
                      <span className="text-white">{summaryData.assignedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Created:</span>
                      <span className="text-white">{summaryData.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Activity */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">📈 Activity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Comments:</span>
                      <span className="text-white">{summaryData.comments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Subtasks:</span>
                      <span className="text-white">{summaryData.subtasks}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskModal; 