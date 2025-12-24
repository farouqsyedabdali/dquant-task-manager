import { useState, useEffect, useCallback } from 'react';
import useTaskStore from '../../stores/taskStore';
import useAuthStore from '../../context/authStore';
import useUserStore from '../../stores/userStore';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import CommentSection from '../comments/CommentSection';
import AddSubtaskModal from './AddSubtaskModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import TaskShareModal from './TaskShareModal';
import TaskUpdatesModal from './TaskUpdatesModal';
import SearchableDropdown from '../common/SearchableDropdown';
import { usersAPI, tasksAPI, commentsAPI } from '../../services/api';
import useContactStore from '../../stores/contactStore';
import IconButton from '../common/IconButton';
import { 
  FaTimes, FaEdit, FaTrash, FaArchive, FaShareAlt, FaChartBar, 
  FaMagic, FaSave, FaPlus, FaUserPlus,
  FaCircle, FaSpinner, FaCheckCircle, FaPauseCircle, FaTimesCircle,
  FaArrowDown, FaMinus, FaArrowUp, FaExclamationTriangle, FaUsers, FaSitemap
} from 'react-icons/fa';

const TaskModal = ({ task, isOpen, onClose, onDelete, onArchive, onUnarchive, extensionUpdateData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    externalContactId: '',
    dueDate: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [isAddSubtaskOpen, setIsAddSubtaskOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'hierarchy'
  const { updateTask, isLoading, fetchTask } = useTaskStore();
  const { user, isAdmin } = useAuthStore();
  const { recentEmployees, addToRecentEmployees } = useUserStore();
  const { fetchContacts } = useContactStore();
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  // Check if current user is viewing a shared task (view-only access)
  const isSharedTask = viewedTask?.sharedWith?.some(share => share.userId === user?.id);
  
  // Check if current user can share (lead assignee or assigner)
  const canShare = viewedTask?.assigneeId === user?.id || viewedTask?.assignerId === user?.id;
  
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

  const fetchContactsForTask = async () => {
    setIsLoadingContacts(true);
    try {
      const result = await fetchContacts();
      if (result.success) {
        setContacts(result.data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // When the modal opens or the task prop changes, update viewedTask
  useEffect(() => {
    if (isOpen && task) {
      setViewedTask(task);
      if (isOpen) {
        if (!isPersonalAccount) {
          fetchUsers();
        }
        fetchCoAssignees(task.id);
        if (isPersonalAccount) {
          fetchContactsForTask();
        }
      }
    }
  }, [isOpen, task, fetchCoAssignees, isPersonalAccount]);

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
        externalContactId: viewedTask.externalContactId?.toString() || '',
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
      assigneeId: formData.assigneeId ? parseInt(formData.assigneeId) : null,
      externalContactId: formData.externalContactId ? parseInt(formData.externalContactId) : null,
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'TODO':
        return <FaCircle className="w-3 h-3" />;
      case 'IN_PROGRESS':
        return <FaSpinner className="w-3 h-3 animate-spin" />;
      case 'COMPLETED':
        return <FaCheckCircle className="w-3 h-3" />;
      case 'ON_HOLD':
        return <FaPauseCircle className="w-3 h-3" />;
      case 'CANCELLED':
        return <FaTimesCircle className="w-3 h-3" />;
      default:
        return <FaCircle className="w-3 h-3" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'LOW':
        return <FaArrowDown className="w-3 h-3" />;
      case 'MEDIUM':
        return <FaMinus className="w-3 h-3" />;
      case 'HIGH':
        return <FaArrowUp className="w-3 h-3" />;
      case 'URGENT':
        return <FaExclamationTriangle className="w-3 h-3" />;
      default:
        return <FaMinus className="w-3 h-3" />;
    }
  };

  if (!isOpen || !viewedTask) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 50 }}>
      <div 
        className="modal-box max-w-5xl max-h-[90vh] min-h-[550px] overflow-y-auto scrollbar-thin transition-colors duration-200"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
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
                    className="text-2xl font-bold rounded px-3 py-2 w-full transition-colors duration-200"
                    style={{
                      color: 'var(--color-text-primary)',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-default)';
                    }}
                    placeholder="Enter task title"
                  />
                  <div 
                    className="text-xs mt-1 transition-colors duration-200"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {formData.title.length}/50 characters
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 
                      className="text-2xl font-bold transition-colors duration-200"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {viewedTask.title}
                    </h3>
                    {isSharedTask && (
                      <div className="status-badge bg-blue-600 text-blue-100 capitalize flex items-center gap-1.5">
                        <FaShareAlt className="w-3 h-3" />
                        <span>Shared with you</span>
                      </div>
                    )}
                  </div>
                  <div 
                    className="flex items-center space-x-4 text-sm transition-colors duration-200"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
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
              <div className="flex flex-wrap gap-2">
            <IconButton
              icon={<FaChartBar />}
              label="Updates"
              variant="primary"
              size="sm"
              onClick={() => setIsUpdatesModalOpen(true)}
              className="!bg-blue-600 hover:!bg-blue-700"
            />
            
            <IconButton
              icon={<FaMagic />}
              label="Summary"
              variant="primary"
              size="sm"
              onClick={handleSummarizeTask}
              disabled={isLoadingSummary}
              loading={isLoadingSummary}
              className="!bg-purple-600 hover:!bg-purple-700"
            />
            
            {canShare && !isPersonalAccount && (
              <IconButton
                icon={<FaShareAlt />}
                label="Share"
                variant="primary"
                size="sm"
                onClick={() => setIsShareModalOpen(true)}
              />
            )}
            
            {canArchive && (
              <IconButton
                icon={<FaArchive />}
                label={viewedTask.archived ? 'Unarchive' : 'Archive'}
                variant={viewedTask.archived ? 'success' : 'warning'}
                size="sm"
                onClick={() => {
                  if (viewedTask.archived) {
                    onUnarchive?.(viewedTask.id);
                  } else {
                    onArchive?.(viewedTask.id);
                  }
                }}
              />
            )}
            
            {((isAdmin() && viewedTask.companyId === user?.companyId) || viewedTask.assignerId === user?.id) && !isSharedTask && (
              <IconButton
                icon={<FaEdit />}
                label={isEditing ? 'Cancel' : 'Edit'}
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              />
            )}
            
            {((isAdmin() && viewedTask.companyId === user?.companyId) || viewedTask.assignerId === user?.id) && !isSharedTask && (
              <IconButton
                icon={<FaTrash />}
                label="Delete"
                variant="danger"
                size="sm"
                onClick={handleDelete}
              />
            )}
          </div>
          
          {/* Close Button */}
          <IconButton
            icon={<FaTimes />}
            label="Close"
            iconOnly={true}
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="!p-2 !rounded-full"
          />
        </div>
      </div>
    </div>

        {/* Two Column Layout: Left (Task Details) and Right (Comments) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* LEFT COLUMN - Task Details */}
          <div 
            className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin transition-colors duration-200"
            style={{
              scrollbarThumbColor: 'var(--color-scrollbar-thumb)',
              scrollbarTrackColor: 'var(--color-scrollbar-track)',
            }}
          >
            {/* Description */}
            <div>
              <h4 
                className="text-sm font-semibold mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Description
              </h4>
              {isEditing ? (
                <div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={300}
                    rows={4}
                    className="textarea textarea-sm w-full rounded-lg transition-colors duration-200"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-default)';
                    }}
                    placeholder="Enter task description"
                  />
                  <div 
                    className="text-xs mt-1 transition-colors duration-200"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {formData.description.length}/300 characters
                  </div>
                </div>
              ) : (
                <div 
                  className="border rounded-lg p-3 transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                  }}
                >
                  <p 
                    className="text-sm transition-colors duration-200"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {viewedTask.description || 'No description provided'}
                  </p>
                </div>
              )}
            </div>

            {/* Status, Priority, Due Date - Inline */}
            <div className="grid grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <h4 
                  className="text-base font-semibold mb-3 transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Status
                </h4>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="select w-full transition-colors duration-200"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-default)';
                    }}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`px-3 py-2 rounded-full text-sm font-medium capitalize ${getStatusColor(viewedTask.status)} flex items-center gap-1.5 w-fit`}>
                    {getStatusIcon(viewedTask.status)}
                    {STATUS_LABELS[viewedTask.status]}
                  </span>
                )}
              </div>

              {/* Priority */}
              <div>
                <h4 
                  className="text-base font-semibold mb-3 transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Priority
                </h4>
                {isEditing ? (
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="select w-full transition-colors duration-200"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-default)';
                    }}
                  >
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`px-3 py-2 rounded-full text-sm font-medium capitalize ${getPriorityColor(viewedTask.priority)} flex items-center gap-1.5 w-fit`}>
                    {getPriorityIcon(viewedTask.priority)}
                    {PRIORITY_LABELS[viewedTask.priority]}
                  </span>
                )}
              </div>

              {/* Due Date */}
              <div>
                <h4 
                  className="text-base font-semibold mb-3 transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Due Date
                </h4>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="input w-full transition-colors duration-200"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-default)';
                    }}
                  />
                ) : (
                  <div className="flex flex-col">
                    {viewedTask.dueDate ? (
                      <>
                        <span 
                          className="text-base transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {new Date(viewedTask.dueDate).toLocaleDateString()}
                        </span>
                        <span 
                          className="text-sm transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {new Date(viewedTask.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {new Date(viewedTask.dueDate) < new Date() && viewedTask.status !== 'COMPLETED' && (
                          <span className="text-red-400 text-sm mt-1">Overdue</span>
                        )}
                      </>
                    ) : (
                      <span 
                        className="text-base transition-colors duration-200"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        No due date
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tabbed Interface for Team & Hierarchy */}
            <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--color-border-default)' }}>
              {/* Tab Headers */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('team')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'team'
                      ? 'shadow-md'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: activeTab === 'team' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                    color: activeTab === 'team' ? 'white' : 'var(--color-text-secondary)',
                  }}
                >
                  <FaUsers className="w-4 h-4" />
                  <span>Team & Sharing</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('hierarchy')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'hierarchy'
                      ? 'shadow-md'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: activeTab === 'hierarchy' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                    color: activeTab === 'hierarchy' ? 'white' : 'var(--color-text-secondary)',
                  }}
                >
                  <FaSitemap className="w-4 h-4" />
                  <span>Task Hierarchy</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[200px]">
                {/* Team & Sharing Tab */}
                {activeTab === 'team' && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Assigned To & Co-Assignees - Side by side for company accounts */}
                    {!isPersonalAccount && (
                      <div className="grid grid-cols-2 gap-4">
                {/* Assigned To */}
                <div>
                  <h4 
                    className="text-base font-semibold mb-3 transition-colors duration-200"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Assigned To
                  </h4>
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
                            <div 
                              className="text-white rounded-full w-10"
                              style={{ backgroundColor: 'var(--color-primary)' }}
                            >
                              <span className="text-sm">{viewedTask.assignee.name.charAt(0)}</span>
                            </div>
                          </div>
                          <div>
                            <span 
                              className="text-base transition-colors duration-200"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {viewedTask.assignee.name}
                            </span>
                          </div>
                          {/* Email tooltip */}
                          <div 
                            className="absolute left-0 top-full mt-2 px-2 py-1 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap"
                            style={{
                              backgroundColor: 'var(--color-bg-primary)',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {viewedTask.assignee.email}
                          </div>
                        </div>
                      ) : (
                        <span 
                          className="text-base transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          Unassigned
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Co-Assignees */}
                <div>
                  <h4 
                    className="text-base font-semibold mb-3 transition-colors duration-200"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Co-Assignees
                  </h4>
                  
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
                        <IconButton
                          icon={<FaUserPlus />}
                          label="Add Co-Assignee"
                          variant="primary"
                          size="sm"
                          onClick={handleAddCoAssignee}
                          disabled={!selectedCoAssigneeId || isAddingCoAssignee}
                          loading={isAddingCoAssignee}
                        />
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
                                  <div 
                                    className="text-white rounded-full w-8"
                                    style={{ backgroundColor: '#10b981' }}
                                  >
                                    <span className="text-sm">{coAssignee.user.name.charAt(0)}</span>
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span 
                                    className="text-base block truncate transition-colors duration-200"
                                    style={{ color: 'var(--color-text-primary)' }}
                                  >
                                    {coAssignee.user.name}
                                  </span>
                                </div>
                                {/* Email tooltip */}
                                <div 
                                  className="absolute left-0 top-full mt-2 px-2 py-1 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap"
                                  style={{
                                    backgroundColor: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)',
                                  }}
                                >
                                  {coAssignee.user.email}
                                </div>
                              </div>
                              <IconButton
                                icon={<FaTimes />}
                                label="Remove co-assignee"
                                iconOnly={true}
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveCoAssignee(coAssignee.userId)}
                                className="!p-1 !w-6 !h-6 !min-h-0"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p 
                          className="text-sm transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          No co-assignees
                        </p>
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
                                <div 
                                  className="text-white rounded-full w-8"
                                  style={{ backgroundColor: '#10b981' }}
                                >
                                  <span className="text-sm">{coAssignee.user.name.charAt(0)}</span>
                                </div>
                              </div>
                              <div>
                                <span 
                                  className="text-base transition-colors duration-200"
                                  style={{ color: 'var(--color-text-primary)' }}
                                >
                                  {coAssignee.user.name}
                                </span>
                              </div>
                              {/* Email tooltip */}
                              <div 
                                className="absolute left-0 top-full mt-2 px-2 py-1 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap"
                                style={{
                                  backgroundColor: 'var(--color-bg-primary)',
                                  color: 'var(--color-text-primary)',
                                }}
                              >
                                {coAssignee.user.email}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p 
                          className="text-sm transition-colors duration-200"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          No co-assignees
                        </p>
                      )}
                    </div>
                  )}
                </div>

                        {/* External Collaborators */}
                        {viewedTask.collaborators && viewedTask.collaborators.length > 0 && (
                          <div>
                            <h4 
                              className="text-base font-semibold mb-3 transition-colors duration-200"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              External Collaborators
                            </h4>
                            <div className="space-y-3">
                              {viewedTask.collaborators.map((collaborator) => (
                                <div key={collaborator.id} className="flex items-center space-x-3 group relative">
                                  <div className="avatar placeholder">
                                    <div 
                                      className="text-white rounded-full w-8"
                                      style={{ backgroundColor: '#3b82f6' }}
                                    >
                                      <span className="text-sm">{collaborator.user.name.charAt(0)}</span>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span 
                                        className="text-base transition-colors duration-200"
                                        style={{ color: 'var(--color-text-primary)' }}
                                      >
                                        {collaborator.user.name}
                                      </span>
                                      <span 
                                        className="text-xs px-2 py-1 rounded transition-colors duration-200"
                                        style={{
                                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                          color: '#93c5fd',
                                        }}
                                      >
                                        {collaborator.permissionLevel}
                                      </span>
                                    </div>
                                    <div 
                                      className="text-sm transition-colors duration-200"
                                      style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                      {collaborator.company.name}
                                    </div>
                                  </div>
                                  {/* Email tooltip */}
                                  <div 
                                    className="absolute left-0 top-full mt-2 px-2 py-1 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap"
                                    style={{
                                      backgroundColor: 'var(--color-bg-primary)',
                                      color: 'var(--color-text-primary)',
                                    }}
                                  >
                                    {collaborator.user.email}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Personal Account Assignment */}
                    {isPersonalAccount && (
                      <div>
                        <h4 
                          className="text-base font-semibold mb-3 transition-colors duration-200"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          Assigned To
                        </h4>
                        {isEditing ? (
                          <div className="space-y-3">
                            <SearchableDropdown
                              options={contacts}
                              value={formData.externalContactId || ''}
                              onChange={(value) => {
                                setFormData(prev => ({ ...prev, externalContactId: value }));
                              }}
                              placeholder="Select a contact (optional)"
                              disabled={isLoadingContacts}
                              renderOption={(contact) => (
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${contact.isPersonal ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                  <span>{contact.name}</span>
                                  <span 
                                    className="transition-colors duration-200"
                                    style={{ color: 'var(--color-text-tertiary)' }}
                                  >
                                    ({contact.email})
                                  </span>
                                  {contact.company && (
                                    <span 
                                      className="transition-colors duration-200"
                                      style={{ color: 'var(--color-text-muted)' }}
                                    >
                                      - {contact.company}
                                    </span>
                                  )}
                                </div>
                              )}
                            />
                            <p 
                              className="text-sm transition-colors duration-200"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              Leave blank to assign to yourself
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            {viewedTask.externalContact ? (
                              <div className="flex items-center space-x-3 group relative">
                                <div className="avatar placeholder">
                                  <div 
                                    className="text-white rounded-full w-10"
                                    style={{ backgroundColor: '#3b82f6' }}
                                  >
                                    <span className="text-sm">{viewedTask.externalContact.name.charAt(0)}</span>
                                  </div>
                                </div>
                                <div>
                                  <span 
                                    className="text-base transition-colors duration-200"
                                    style={{ color: 'var(--color-text-primary)' }}
                                  >
                                    {viewedTask.externalContact.name}
                                  </span>
                                  <div 
                                    className="text-sm transition-colors duration-200"
                                    style={{ color: 'var(--color-text-tertiary)' }}
                                  >
                                    {viewedTask.externalContact.email}
                                  </div>
                                </div>
                                {/* Email tooltip */}
                                <div 
                                  className="absolute left-0 top-full mt-2 px-2 py-1 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap"
                                  style={{
                                    backgroundColor: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)',
                                  }}
                                >
                                  {viewedTask.externalContact.email}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3 group relative">
                                <div className="avatar placeholder">
                                  <div 
                                    className="text-white rounded-full w-10"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                  >
                                    <span className="text-sm">{user?.name?.charAt(0)}</span>
                                  </div>
                                </div>
                                <div>
                                  <span 
                                    className="text-base transition-colors duration-200"
                                    style={{ color: 'var(--color-text-primary)' }}
                                  >
                                    You
                                  </span>
                                  <div 
                                    className="text-sm transition-colors duration-200"
                                    style={{ color: 'var(--color-text-tertiary)' }}
                                  >
                                    {user?.email}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Task Hierarchy Tab */}
                {activeTab === 'hierarchy' && (
                  <div className="animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Parent Task */}
                      <div>
                        <div className="flex items-center justify-between mb-2 h-8">
                          <h4 
                            className="text-sm font-semibold transition-colors duration-200"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Parent Task
                          </h4>
                        </div>
                        {viewedTask.parentTask ? (
                          <div
                            className="border rounded-lg p-3 cursor-pointer transition text-sm transition-colors duration-200"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              borderColor: 'var(--color-border-default)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                            }}
                            onClick={() => handleTaskClick(viewedTask.parentTask.id)}
                            title="Open parent task"
                          >
                            <div className="flex items-center gap-2">
                              <FaSitemap className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                              <span 
                                className="font-medium transition-colors duration-200"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                {viewedTask.parentTask.title}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="text-center py-8 border rounded-lg transition-colors duration-200"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              borderColor: 'var(--color-border-default)',
                              color: 'var(--color-text-tertiary)',
                            }}
                          >
                            <FaSitemap className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No parent task</p>
                          </div>
                        )}
                      </div>

                      {/* Subtasks */}
                      <div>
                        <div className="flex items-center justify-between mb-2 h-8">
                          <h4 
                            className="text-sm font-semibold transition-colors duration-200"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Subtasks {viewedTask.subtasks && viewedTask.subtasks.length > 0 && `(${viewedTask.subtasks.length})`}
                          </h4>
                          {(viewedTask.assignerId === user?.id || viewedTask.assigneeId === user?.id) && (
                            <IconButton
                              icon={<FaPlus />}
                              label="Add"
                              variant="primary"
                              size="sm"
                              onClick={() => setIsAddSubtaskOpen(true)}
                            />
                          )}
                        </div>
                        
                        {viewedTask.subtasks && viewedTask.subtasks.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                            {viewedTask.subtasks.map((subtask) => (
                              <div
                                key={subtask.id}
                                className="border rounded-lg p-3 cursor-pointer transition transition-colors duration-200"
                                style={{
                                  backgroundColor: 'var(--color-bg-tertiary)',
                                  borderColor: 'var(--color-border-default)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                                }}
                                onClick={() => handleTaskClick(subtask.id)}
                                title="Open subtask"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span 
                                    className="text-sm font-medium transition-colors duration-200"
                                    style={{ color: 'var(--color-text-primary)' }}
                                  >
                                    {subtask.title}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(subtask.status)} flex items-center gap-1 w-fit`}>
                                    {getStatusIcon(subtask.status)}
                                    {STATUS_LABELS[subtask.status]}
                                  </span>
                                </div>
                                {!isPersonalAccount && subtask.assignee && (
                                  <div 
                                    className="text-xs flex items-center gap-1 transition-colors duration-200"
                                    style={{ color: 'var(--color-text-tertiary)' }}
                                  >
                                    <FaUsers className="w-3 h-3" />
                                    {subtask.assignee.name}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="text-center py-8 border rounded-lg transition-colors duration-200"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              borderColor: 'var(--color-border-default)',
                              color: 'var(--color-text-tertiary)',
                            }}
                          >
                            <FaSitemap className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No subtasks yet</p>
                            {(viewedTask.assignerId === user?.id || viewedTask.assigneeId === user?.id) && (
                              <p className="text-xs mt-1">Click "Add" to create</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                <IconButton
                  icon={<FaSave />}
                  label={isLoading ? 'Saving...' : 'Save Changes'}
                  variant="primary"
                  onClick={handleSave}
                  disabled={isLoading}
                  loading={isLoading}
                  className="w-full"
                />
              </div>
            )}
          </div>

        {/* RIGHT COLUMN - Comments */}
        <div 
          className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin transition-colors duration-200"
          style={{
            scrollbarThumbColor: 'var(--color-scrollbar-thumb)',
            scrollbarTrackColor: 'var(--color-scrollbar-track)',
          }}
        >
          <h4 
            className="text-lg font-semibold mb-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Comments
          </h4>
          <div className="overflow-y-auto pr-2">
            <CommentSection 
              taskId={viewedTask.id} 
              task={viewedTask}
              extensionUpdateData={extensionUpdateData}
              onTaskSwitch={(newTask) => {
                setViewedTask(newTask);
                setIsEditing(false);
              }}
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


      {/* Task Updates Modal */}
      <TaskUpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        task={viewedTask}
      />

      {/* Task Summary Modal */}
      {isSummaryModalOpen && summaryData && (
        <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 60 }}>
          <div
            className="modal-box max-w-6xl max-h-[95vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <h3
                className="text-2xl font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Task Summary
              </h3>
              <IconButton
                icon={<FaTimes />}
                label="Close"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSummaryModalOpen(false);
                  setSummaryData(null);
                }}
                className="!p-2 !rounded-full"
              />
            </div>
            
              <div className="space-y-6">
              {/* AI Analysis Section */}
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <h4
                  className="text-lg font-semibold mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Content Summary
                </h4>
                <div
                  className="rounded p-3 leading-relaxed"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                >
                  {summaryData.textSummary}
                </div>
              </div>

              {/* Task Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status & Priority */}
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  <h4
                    className="text-lg font-semibold mb-3"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    📊 Status &amp; Priority
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Status:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{summaryData.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Priority:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{summaryData.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Due Date:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{summaryData.dueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Assignment */}
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  <h4
                    className="text-lg font-semibold mb-3"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    👥 Assignment
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Created By:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{summaryData.createdBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Assigned To:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{summaryData.assignedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Created:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}>{summaryData.createdAt}</span>
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
    </>
  );
};

export default TaskModal; 