import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import useTaskStore from '../../stores/taskStore';
import useAuthStore from '../../context/authStore';
import useUserStore from '../../stores/userStore';
import { STATUS_LABELS, PRIORITY_LABELS, TASK_RECURRENCE, RECURRENCE_LABELS, RECURRENCE_OPTIONS } from '../../utils/constants';
import { convertLocalDateTimeToUTC, formatDateForInput } from '../../utils/dateUtils';
import CommentSection from '../comments/CommentSection';
import AddSubtaskModal from './AddSubtaskModal';
import AddTeamMemberModal from './AddTeamMemberModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import TaskShareModal from './TaskShareModal';
import TaskUpdatesModal from './TaskUpdatesModal';
import SearchableDropdown from '../common/SearchableDropdown';
import { usersAPI, tasksAPI, taskShareAPI } from '../../services/api';
import useContactStore from '../../stores/contactStore';
import AddContactModal from '../common/AddContactModal';
import DatePicker from '../common/DatePicker';
import IconButton from '../common/IconButton';
import ConfirmModal from '../common/ConfirmModal';
import AIWarning from '../common/AIWarning';
import { useToastContext } from '../../context/ToastContext';
import {
  FaTimes, FaEdit, FaTrash, FaArchive, FaShareAlt, FaChartBar,
  FaSave, FaPlus, FaUserPlus, FaCheck,
  FaCircle, FaSpinner, FaCheckCircle, FaPauseCircle, FaTimesCircle,
  FaArrowDown, FaMinus, FaArrowUp, FaExclamationTriangle, FaUsers, FaSitemap, FaClock
} from 'react-icons/fa';

const TaskModal = ({ task, isOpen, onClose, onDelete, onArchive, onUnarchive, extensionUpdateData = null, onTaskSwitch = null, onTaskChange = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    externalContactId: '',
    dueDate: '',
    recurrence: TASK_RECURRENCE.NONE,
    recurrenceEndsAt: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [isAddSubtaskOpen, setIsAddSubtaskOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUnaccessConfirmOpen, setIsUnaccessConfirmOpen] = useState(false);
  const [isUnaccepting, setIsUnaccepting] = useState(false);
  const [viewedTask, setViewedTask] = useState(task); // local state for current viewed task
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [coAssignees, setCoAssignees] = useState([]);
  const [isLoadingCoAssignees, setIsLoadingCoAssignees] = useState(false);
  const [isAddingCoAssignee, setIsAddingCoAssignee] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [isAddTeamMemberModalOpen, setIsAddTeamMemberModalOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'hierarchy'
  const { updateTask, fetchTask, isLoading } = useTaskStore();
  const { user, isAdmin } = useAuthStore();
  const { recentEmployees, addToRecentEmployees } = useUserStore();
  const { fetchContacts } = useContactStore();
  const navigate = useNavigate();
  const toast = useToastContext();

  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  // Unified list of all available assignees (employees + contacts)
  const allAssignees = useMemo(() => {
    const assigneeOptions = [];

    // Add employees (if not personal account)
    if (!isPersonalAccount) {
      const employeeOptions = users.map(user => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        displayName: user.name,
        type: 'user'
      }));
      assigneeOptions.push(...employeeOptions);
    }

    // Add contacts
    const contactOptions = contacts.map(contact => ({
      id: `contact_${contact.id}`,
      name: contact.name,
      email: contact.email,
      displayName: contact.name,
      type: 'contact',
      isPersonal: contact.isPersonal
    }));
    assigneeOptions.push(...contactOptions);

    return assigneeOptions;
  }, [users, contacts, isPersonalAccount]);

  // Check if current user is viewing a shared task (view-only access)
  const isSharedTask = viewedTask?.sharedWith?.some(share => share.userId === user?.id);

  // Determine if the user's only access is VIEWER-level (no commenting)
  const userShareRecord = viewedTask?.sharedWith?.find(s => s.userId === user?.id);
  const userCollabRecord = viewedTask?.collaborators?.find(c => c.userId === user?.id);
  const effectivePermission = userCollabRecord?.permissionLevel || userShareRecord?.permissionLevel;
  const isViewerOnly =
    isSharedTask &&
    (effectivePermission === 'VIEWER' || effectivePermission === 'VIEW') &&
    viewedTask?.assigneeId !== user?.id &&
    viewedTask?.assignerId !== user?.id &&
    !viewedTask?.coAssignees?.some(co => co.userId === user?.id);

  // Check if current user can share (lead assignee, assigner, or same-company admin)
  const isSameCompanyAsTask = viewedTask?.companyId != null && viewedTask.companyId === user?.companyId;
  const canShare = viewedTask?.assigneeId === user?.id ||
    viewedTask?.assignerId === user?.id ||
    (isSameCompanyAsTask && (isAdmin || user?.role === 'SYSDMIN' || user?.role === 'SUPER_ADMIN'));

  // Check if user can archive/unarchive this task
  const canArchive = !isSharedTask && (
    isAdmin ||
    user?.role === 'SYSDMIN' ||
    viewedTask?.assignerId === user?.id
  );

  // Withdraw only for cross-organization relationships (assigner company ≠ user company).
  const hasWithdrawCompanyContext =
    viewedTask?.assigner?.companyId != null && user?.companyId != null;
  const isSameCompanyAsAssigner =
    hasWithdrawCompanyContext &&
    Number(viewedTask.assigner.companyId) === Number(user.companyId);

  const isExternalCollaborator =
    viewedTask?.collaborators?.some(c => c.userId === user?.id && c.isExternal);

  // Can withdraw if: cross-org + (lead assignee OR external collaborator) + task not completed
  const canWithdraw =
    viewedTask?.assignerId !== user?.id &&
    viewedTask?.status !== 'COMPLETED' &&
    hasWithdrawCompanyContext &&
    !isSameCompanyAsAssigner &&
    (viewedTask?.assigneeId === user?.id || isExternalCollaborator);

  // Check if current user is an accepted external assignee (for other UI purposes)
  const isAcceptedExternalAssignee =
    viewedTask?.assigneeId === user?.id &&
    viewedTask?.externalContactId !== null &&
    viewedTask?.assignerId !== user?.id;

  // Show creator name ALWAYS (both business and personal accounts need to see who created the task)
  const shouldShowCreator = true;

  const canEditRecurrence =
    !viewedTask?.parentTaskId &&
    ((isAdmin() && viewedTask?.companyId === user?.companyId) || viewedTask?.assignerId === user?.id) &&
    !isSharedTask;

  const showRecurrenceSection =
    !viewedTask?.parentTaskId &&
    (
      (canEditRecurrence && isEditing) ||
      (viewedTask.recurrence && viewedTask.recurrence !== TASK_RECURRENCE.NONE)
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

  const handleAddNewContact = (email) => {
    setPendingEmail(email);
    setIsAddContactModalOpen(true);
  };

  const handleContactAdded = async (newContact) => {
    // Refresh contacts to include the new one
    await fetchContactsForTask();
    // Set the assignee to the new contact
    setFormData(prev => ({
      ...prev,
      assigneeId: '',
      externalContactId: newContact.id.toString()
    }));
    setIsAddContactModalOpen(false);
    setPendingEmail('');
  };

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

  // Track the last task ID we manually set to prevent useEffect from overriding it
  const lastManualTaskIdRef = useRef(null);

  // When the modal opens or the task prop changes, update viewedTask
  // But only if we didn't just manually set it (to avoid resetting when switching tasks internally)
  useEffect(() => {
    if (isOpen && task) {
      // Only update if this isn't a task we just manually switched to
      if (lastManualTaskIdRef.current !== task.id) {
        console.log('useEffect: Updating viewedTask from task prop', task.id, task.title);
        setViewedTask(task);
        lastManualTaskIdRef.current = null; // Reset the ref
        if (isOpen) {
          if (!isPersonalAccount) {
            fetchUsers();
          }
          fetchCoAssignees(task.id);
          fetchContactsForTask(); // Fetch contacts for all account types
        }
      } else {
        console.log('useEffect: Task was manually set, skipping update', task.id);
        lastManualTaskIdRef.current = null; // Reset after skipping
      }
    }
  }, [isOpen, task, fetchCoAssignees, isPersonalAccount]);

  const handleAddCoAssignee = async (selectedId, selectedType, selectedRole) => {
    if (!selectedId || !viewedTask?.id) return;

    try {
      setIsAddingCoAssignee(true);

      if (selectedType === 'user') {
        // Add company user as co-assignee
        // selectedId is in format "user_${userId}", so extract the actual ID
        const userId = selectedId.startsWith('user_') ? selectedId.substring(5) : selectedId;

        await tasksAPI.addCoAssignee(viewedTask.id, userId);

        // Track as recent employee
        const selectedUser = users.find(u => u.id.toString() === userId.toString());
        if (selectedUser) {
          addToRecentEmployees(selectedUser);
        }

        // Refresh co-assignees list and task data
        await fetchCoAssignees(viewedTask.id);
        const result = await fetchTask(viewedTask.id);
        if (result.success && result.data) {
          setViewedTask(result.data);
        }

        toast.success('Co-assignee added successfully!');
      } else if (selectedType === 'contact') {
        // Send invitation to external contact
        // selectedId is already the raw contact ID (e.g., '36')
        const contactId = selectedId;
        const contact = contacts.find(c => c.id.toString() === contactId.toString());

        if (contact) {
          // Validate that contact has a valid email
          if (!contact.email || !contact.email.includes('@')) {
            console.error('Contact has invalid email:', contact.email);
            toast.error('Contact does not have a valid email address');
            return;
          }

          // Use taskShareAPI to properly register the intended role as CO_ASSIGNEE
          // This creates a TaskShare with permissionLevel='CO_ASSIGNEE' and sends the email
          await taskShareAPI.shareTaskWithContact(viewedTask.id, contactId, 'CO_ASSIGNEE');

          // Refresh task data to show invitation status
          const result = await fetchTask(viewedTask.id);
          if (result.success && result.data) {
            setViewedTask(result.data);
          }

          toast.success('Invitation sent successfully!');
        } else {
          console.error('Contact not found:', { contactId, availableContacts: contacts.length });
          toast.error('Contact not found. Please refresh and try again.');
        }
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error(error.response?.data?.error || 'Failed to add team member');
      throw error; // Re-throw so modal can handle it
    } finally {
      setIsAddingCoAssignee(false);
    }
  };

  const handleRemoveCoAssignee = async (userId) => {
    if (!viewedTask?.id) return;

    try {
      await tasksAPI.removeCoAssignee(viewedTask.id, userId);
      setCoAssignees(prev => prev.filter(co => co.userId !== userId));
      toast.success('Co-assignee removed successfully');
    } catch (error) {
      console.error('Error removing co-assignee:', error);
      toast.error(error.response?.data?.error || 'Failed to remove co-assignee');
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
        dueDate: viewedTask.dueDate ? new Date(viewedTask.dueDate).toISOString().slice(0, 16) : '',
        recurrence: viewedTask.recurrence || TASK_RECURRENCE.NONE,
        recurrenceEndsAt: viewedTask.recurrenceEndsAt
          ? formatDateForInput(viewedTask.recurrenceEndsAt)
          : ''
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
    if (!taskId) {
      console.log('handleTaskClick: No taskId provided');
      return;
    }
    console.log('handleTaskClick: Starting to fetch task', taskId);
    try {
      const response = await tasksAPI.getById(taskId);
      const newTask = response.data;
      console.log('handleTaskClick: Fetched new task', newTask.id, newTask.title);
      // Mark this as a manual task switch to prevent useEffect from overriding it
      lastManualTaskIdRef.current = newTask.id;
      setViewedTask(newTask);
      setIsEditing(false);
      setIsAddSubtaskOpen(false);
      setIsDeleteModalOpen(false);
      // Reset active tab to 'team' when switching tasks
      setActiveTab('team');
      // Fetch related data for the new task
      if (!isPersonalAccount) {
        fetchUsers();
      }
      fetchCoAssignees(newTask.id);
      fetchContactsForTask();
      // Notify parent component about task change
      if (onTaskChange) {
        console.log('handleTaskClick: Calling onTaskChange with task', newTask.id, newTask.title);
        onTaskChange(newTask);
      } else {
        console.log('handleTaskClick: onTaskChange is not provided');
      }
    } catch (error) {
      console.error('handleTaskClick: Error loading task:', error);
      toast.error(error.response?.data?.error || 'Failed to load task. Please try again.');
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

    // Validate due date is required (but allow past dates for editing existing tasks)
    if (!formData.dueDate || !formData.dueDate.trim()) {
      newErrors.dueDate = 'Due date is required';
    } else {
      // If only date is provided (no time), set default time to 11:59 PM for validation
      let dateToCheck = formData.dueDate;
      if (!dateToCheck.includes('T') || (dateToCheck.includes('T') && !dateToCheck.includes(':'))) {
        // Date only, add 11:59 PM
        const datePart = dateToCheck.split('T')[0];
        dateToCheck = `${datePart}T23:59:00`;
      }

      const selectedDate = new Date(dateToCheck);
      if (isNaN(selectedDate.getTime())) {
        newErrors.dueDate = 'Invalid due date format';
      }
      // Removed future date check - allow past dates for editing existing tasks
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
      dueDate: convertLocalDateTimeToUTC(formData.dueDate),
      recurrence: formData.recurrence
    };
    delete updateData.recurrenceEndsAt;
    if (formData.recurrence === TASK_RECURRENCE.NONE) {
      updateData.recurrenceEndsAt = null;
    } else if (formData.recurrenceEndsAt) {
      updateData.recurrenceEndsAt = convertLocalDateTimeToUTC(formData.recurrenceEndsAt);
    } else {
      updateData.recurrenceEndsAt = null;
    }

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

  const handleUnaccept = async () => {
    if (!viewedTask?.id) return;

    setIsUnaccepting(true);
    try {
      const response = await tasksAPI.unacceptTask(viewedTask.id);
      if (response.data.success) {
        toast.success('You have successfully withdrawn from this task');
        setIsUnaccessConfirmOpen(false);
        onClose();
        // Refresh the task list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error withdrawing from task:', error);
      toast.error(error.response?.data?.error || 'Failed to withdraw from this task');
    } finally {
      setIsUnaccepting(false);
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
      case 'ON_HOLD':
        return 'bg-yellow-600 text-yellow-200';
      case 'CANCELLED':
        return 'bg-red-600 text-red-200';
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

  const modalContent = (
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
      <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 70 }}>
        <div
          className="modal-box max-w-5xl max-h-[90vh] min-h-[550px] overflow-y-auto scrollbar-thin transition-colors duration-200"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
          onClick={(e) => e.stopPropagation()}
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
                    </div>
                    <div
                      className="flex items-center space-x-4 text-sm transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {viewedTask.assigner?.name && (
                        <>
                          <span>Created by {viewedTask.assigner.name}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{new Date(viewedTask.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                {/* AI Warning when using AI data */}
                {extensionUpdateData && (
                  <AIWarning className="mt-2" />
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

                  {(viewedTask.assignerId === user?.id || viewedTask.assigneeId === user?.id) && (
                    <IconButton
                      icon={<FaPlus />}
                      label="Add subtask"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddSubtaskOpen(true)}
                      className="!bg-purple-600 hover:!bg-purple-700"
                    />
                  )}

                  {canShare && (
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

                  {canWithdraw && (
                    <IconButton
                      icon={<FaTimesCircle />}
                      label="Withdraw"
                      variant="danger"
                      size="sm"
                      onClick={() => setIsUnaccessConfirmOpen(true)}
                      className="!bg-red-600 hover:!bg-red-700"
                    />
                  )}

                  {/* Edit/Save/Cancel Buttons */}
                  {((isAdmin() && viewedTask.companyId === user?.companyId) || viewedTask.assignerId === user?.id) && !isSharedTask && (
                    <>
                      {isEditing ? (
                        <>
                          <IconButton
                            icon={<FaCheck />}
                            label={isLoading ? 'Saving...' : 'Save Changes'}
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                            disabled={isLoading}
                            loading={isLoading}
                          />
                          <IconButton
                            icon={<FaTimes />}
                            label="Cancel"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsEditing(false)}
                            disabled={isLoading}
                          />
                        </>
                      ) : (
                        <>
                          <IconButton
                            icon={<FaEdit />}
                            label="Edit"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                          />
                          <IconButton
                            icon={<FaTrash />}
                            label="Delete"
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                          />
                        </>
                      )}
                    </>
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
                    <span className={`px-3 py-2 rounded-full text-sm font-medium uppercase ${getStatusColor(viewedTask.status)} w-fit`}>
                      {STATUS_LABELS[viewedTask.status].toUpperCase()}
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
                    <span className={`px-3 py-2 rounded-full text-sm font-medium uppercase ${getPriorityColor(viewedTask.priority)} w-fit`}>
                      {PRIORITY_LABELS[viewedTask.priority].toUpperCase()}
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
                    <div>
                      <DatePicker
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        placeholder="Select due date and time"
                        showTime={true}
                        timeOptional={false}
                        min={new Date().toISOString().slice(0, 16)}
                        error={!!errors.dueDate}
                      />
                      {errors.dueDate && (
                        <label className="label">
                          <span className="label-text-alt text-error">{errors.dueDate}</span>
                        </label>
                      )}
                    </div>
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
                          className="text-base transition-colors duration-200 text-error"
                        >
                          No due date set
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Repeat (weekly / monthly) — not for subtasks */}
              {showRecurrenceSection && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4
                      className="text-base font-semibold mb-3 transition-colors duration-200"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Repeat
                    </h4>
                    {canEditRecurrence && isEditing ? (
                      <>
                        <select
                          name="recurrence"
                          value={formData.recurrence}
                          onChange={handleChange}
                          className="select w-full transition-colors duration-200"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {RECURRENCE_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <p className="text-xs mt-2 opacity-80" style={{ color: 'var(--color-text-tertiary)' }}>
                          Completing this task creates the next one with the updated due date.
                        </p>
                      </>
                    ) : (
                      <span className="text-base" style={{ color: 'var(--color-text-primary)' }}>
                        {RECURRENCE_LABELS[viewedTask.recurrence || TASK_RECURRENCE.NONE]}
                      </span>
                    )}
                  </div>
                  {(canEditRecurrence && isEditing
                    ? formData.recurrence !== TASK_RECURRENCE.NONE
                    : viewedTask.recurrence &&
                      viewedTask.recurrence !== TASK_RECURRENCE.NONE) && (
                    <div>
                      <h4
                        className="text-base font-semibold mb-3 transition-colors duration-200"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        Stop repeating after
                      </h4>
                      {canEditRecurrence && isEditing ? (
                        <DatePicker
                          name="recurrenceEndsAt"
                          value={formData.recurrenceEndsAt || ''}
                          onChange={handleChange}
                          placeholder="Optional — pick last repeat date"
                          showTime={false}
                          timeOptional={false}
                        />
                      ) : (
                        <span className="text-base" style={{ color: 'var(--color-text-primary)' }}>
                          {viewedTask.recurrenceEndsAt
                            ? new Date(viewedTask.recurrenceEndsAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : '—'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tabbed Interface for Team & Hierarchy */}
              <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--color-border-default)' }}>
                {/* Tab Headers */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('team')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeTab === 'team'
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeTab === 'hierarchy'
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
                      {/* Unified People List - Show for all accounts, but limit functionality for personal accounts */}
                      {true ? (
                        <div>
                          {/* Unified List */}
                          <div className="space-y-2">
                            {/* Lead Assignee */}
                            {viewedTask.assignee ? (
                              <div className="flex items-center justify-between gap-3 group relative">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <div
                                    className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      backgroundColor: 'var(--color-primary)',
                                      width: '32px',
                                      height: '32px',
                                      minWidth: '32px',
                                      minHeight: '32px',
                                      maxWidth: '32px',
                                      maxHeight: '32px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      lineHeight: '1'
                                    }}
                                  >
                                    <span
                                      className="text-sm"
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      {viewedTask.assignee.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="text-sm block truncate transition-colors duration-200"
                                        style={{ color: 'var(--color-text-primary)' }}
                                      >
                                        {viewedTask.assignee.name}
                                      </span>
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded uppercase font-medium"
                                        style={{
                                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                          color: '#a5b4fc',
                                        }}
                                      >
                                        LEAD
                                      </span>
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
                                    {viewedTask.assignee.email}
                                  </div>
                                </div>
                                {/* Add Person Button - Only show if user is lead assignee */}
                                {viewedTask?.assigneeId === user?.id && !isEditing && (
                                  <button
                                    onClick={async () => {
                                      // Ensure contacts are loaded before opening modal
                                      if (contacts.length === 0 && !isLoadingContacts) {
                                        await fetchContactsForTask();
                                      }
                                      setIsAddTeamMemberModalOpen(true);
                                    }}
                                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
                                    style={{
                                      backgroundColor: 'var(--color-primary)',
                                      color: 'white',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    title="Add person to task"
                                  >
                                    <FaPlus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              /* No assignee - show Add button on its own row */
                              viewedTask?.assigneeId === user?.id && !isEditing && (
                                <div className="flex items-center justify-end">
                                  <button
                                    onClick={async () => {
                                      // Ensure contacts are loaded before opening modal
                                      if (contacts.length === 0 && !isLoadingContacts) {
                                        await fetchContactsForTask();
                                      }
                                      setIsAddTeamMemberModalOpen(true);
                                    }}
                                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
                                    style={{
                                      backgroundColor: 'var(--color-primary)',
                                      color: 'white',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    title="Add person to task"
                                  >
                                    <FaPlus className="w-3 h-3" />
                                  </button>
                                </div>
                              )
                            )}

                            {/* Co-Assignees */}
                            {isLoadingCoAssignees ? (
                              <div className="flex justify-center py-2">
                                <span className="loading loading-spinner loading-sm"></span>
                              </div>
                            ) : (
                              coAssignees.map((coAssignee) => (
                                <div key={coAssignee.id} className="flex items-center justify-between gap-3 group relative">
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div
                                      className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{
                                        backgroundColor: '#10b981',
                                        width: '32px',
                                        height: '32px',
                                        minWidth: '32px',
                                        minHeight: '32px',
                                        maxWidth: '32px',
                                        maxHeight: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      <span
                                        className="text-sm"
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          lineHeight: '1'
                                        }}
                                      >
                                        {coAssignee.user.name.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="text-sm block truncate transition-colors duration-200"
                                          style={{ color: 'var(--color-text-primary)' }}
                                        >
                                          {coAssignee.user.name}
                                        </span>
                                        <span
                                          className="text-xs px-1.5 py-0.5 rounded uppercase font-medium"
                                          style={{
                                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                            color: '#6ee7b7',
                                          }}
                                        >
                                          CO-ASSIGNEE
                                        </span>
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
                                      {coAssignee.user.email}
                                    </div>
                                  </div>
                                  {/* Remove button - only if user is lead assignee or same-company system admin */}
                                  {(viewedTask?.assigneeId === user?.id || (user?.role === 'SYSDMIN' && viewedTask?.companyId === user?.companyId)) && (
                                    <button
                                      onClick={() => handleRemoveCoAssignee(coAssignee.userId)}
                                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                                      style={{
                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                        color: '#ef4444',
                                      }}
                                      title="Remove co-assignee"
                                    >
                                      <FaTimes className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))
                            )}

                            {/* Collaborators */}
                            {viewedTask.collaborators && viewedTask.collaborators.map((collaborator) => (
                              <div key={collaborator.id} className="flex items-center justify-between gap-3 group relative">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <div
                                    className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      backgroundColor: '#3b82f6',
                                      width: '32px',
                                      height: '32px',
                                      minWidth: '32px',
                                      minHeight: '32px',
                                      maxWidth: '32px',
                                      maxHeight: '32px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      lineHeight: '1'
                                    }}
                                  >
                                    <span
                                      className="text-sm"
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      {collaborator.user.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="text-sm block truncate transition-colors duration-200"
                                        style={{ color: 'var(--color-text-primary)' }}
                                      >
                                        {collaborator.user.name}
                                      </span>
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded uppercase font-medium"
                                        style={{
                                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                          color: '#93c5fd',
                                        }}
                                      >
                                        {collaborator.isExternal ? 'EXTERNAL ' : ''}{collaborator.permissionLevel}
                                      </span>
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
                              </div>
                            ))}

                            {/* Shared With Users */}
                            {viewedTask.sharedWith && viewedTask.sharedWith.map((share) => {
                              // Skip ghost records with no identifiable person
                              const shareName = share.user?.name || share.contact?.name || share.email;
                              if (!shareName) return null;

                              // Skip if user is already in the list as assignee, co-assignee, or collaborator
                              if (share.userId === viewedTask.assigneeId ||
                                coAssignees.some(co => co.userId === share.userId) ||
                                viewedTask.collaborators?.some(c => c.userId === share.userId)) {
                                return null;
                              }

                              return (
                                <div key={share.id} className="flex items-center justify-between gap-3 group relative">
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div
                                      className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{
                                        backgroundColor: '#8b5cf6',
                                        width: '32px',
                                        height: '32px',
                                        minWidth: '32px',
                                        minHeight: '32px',
                                        maxWidth: '32px',
                                        maxHeight: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      <span
                                        className="text-sm"
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          lineHeight: '1'
                                        }}
                                      >
                                        {shareName.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="text-sm block truncate transition-colors duration-200"
                                          style={{ color: 'var(--color-text-primary)' }}
                                        >
                                          {shareName}
                                        </span>
                                        <span
                                          className="text-xs px-1.5 py-0.5 rounded uppercase font-medium"
                                          style={{
                                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                            color: '#c4b5fd',
                                          }}
                                        >
                                          {share.isExternal ? 'EXTERNAL ' : ''}{share.permissionLevel || 'VIEWER'}
                                        </span>
                                      </div>
                                    </div>
                                    {/* Email tooltip */}
                                    {(share.user?.email || share.email) && (
                                      <div
                                        className="absolute left-0 top-full mt-2 px-2 py-1 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap"
                                        style={{
                                          backgroundColor: 'var(--color-bg-primary)',
                                          color: 'var(--color-text-primary)',
                                        }}
                                      >
                                        {share.user?.email || share.contact?.email || share.email}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Pending Invitations */}
                            {viewedTask.invitations && viewedTask.invitations.length > 0 && (
                              viewedTask.invitations.map((invitation) => {
                                // Try to find a matching contact name for this email
                                const matchingContact = contacts.find(
                                  c => c.email?.toLowerCase() === invitation.recipientEmail?.toLowerCase()
                                );
                                const displayName = matchingContact?.name || invitation.recipientEmail;
                                const initial = matchingContact?.name?.charAt(0) || invitation.recipientEmail?.charAt(0)?.toUpperCase() || '?';

                                return (
                                  <div key={invitation.id} className="flex items-center justify-between gap-3 group relative">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <div
                                        className="rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{
                                          backgroundColor: 'rgba(234, 179, 8, 0.2)',
                                          border: '2px dashed #eab308',
                                          width: '32px',
                                          height: '32px',
                                          minWidth: '32px',
                                          minHeight: '32px',
                                          maxWidth: '32px',
                                          maxHeight: '32px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          lineHeight: '1'
                                        }}
                                      >
                                        <span
                                          className="text-sm"
                                          style={{
                                            color: '#eab308',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            lineHeight: '1'
                                          }}
                                        >
                                          {initial}
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span
                                            className="text-sm block truncate transition-colors duration-200"
                                            style={{ color: 'var(--color-text-primary)', opacity: 0.7 }}
                                          >
                                            {displayName}
                                          </span>
                                          <span
                                            className="text-xs px-1.5 py-0.5 rounded uppercase font-medium flex items-center gap-1"
                                            style={{
                                              backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                              color: '#eab308',
                                            }}
                                          >
                                            <FaClock className="w-2.5 h-2.5" />
                                            PENDING
                                          </span>
                                        </div>
                                        {matchingContact?.name && (
                                          <span
                                            className="text-xs block truncate"
                                            style={{ color: 'var(--color-text-tertiary)' }}
                                          >
                                            {invitation.recipientEmail}
                                          </span>
                                        )}
                                      </div>
                                      {/* Email tooltip */}
                                      <div
                                        className="absolute left-0 top-full mt-2 px-2 py-1 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap"
                                        style={{
                                          backgroundColor: 'var(--color-bg-primary)',
                                          color: 'var(--color-text-primary)',
                                        }}
                                      >
                                        Invitation sent to {invitation.recipientEmail}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}

                            {/* External Contact — pending lead assignee acceptance */}
                            {!viewedTask.assignee && viewedTask.externalContact && (
                              <div className="flex items-center justify-between gap-3 group relative">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <div
                                    className="rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      backgroundColor: 'rgba(234, 179, 8, 0.2)',
                                      border: '2px dashed #eab308',
                                      width: '32px',
                                      height: '32px',
                                      minWidth: '32px',
                                      minHeight: '32px',
                                      maxWidth: '32px',
                                      maxHeight: '32px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      lineHeight: '1'
                                    }}
                                  >
                                    <span
                                      className="text-sm"
                                      style={{
                                        color: '#eab308',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      {viewedTask.externalContact.name?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className="text-sm block truncate transition-colors duration-200"
                                        style={{ color: 'var(--color-text-primary)', opacity: 0.7 }}
                                      >
                                        {viewedTask.externalContact.name}
                                      </span>
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded uppercase font-medium flex items-center gap-1"
                                        style={{
                                          backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                          color: '#eab308',
                                        }}
                                      >
                                        <FaClock className="w-2.5 h-2.5" />
                                        PENDING ACCEPTANCE
                                      </span>
                                    </div>
                                    <span
                                      className="text-xs block truncate"
                                      style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                      {viewedTask.externalContact.email}
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
                                    Assigned — awaiting acceptance from {viewedTask.externalContact.email}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Empty State */}
                            {!viewedTask.assignee &&
                              !viewedTask.externalContact &&
                              (!coAssignees || coAssignees.length === 0) &&
                              (!viewedTask.collaborators || viewedTask.collaborators.length === 0) &&
                              (!viewedTask.sharedWith || viewedTask.sharedWith.length === 0) &&
                              (!viewedTask.invitations || viewedTask.invitations.length === 0) && (
                                <p
                                  className="text-sm text-center py-4 transition-colors duration-200"
                                  style={{ color: 'var(--color-text-tertiary)' }}
                                >
                                  No people assigned
                                </p>
                              )}
                          </div>

                          {/* Edit Mode - Assignee Selection */}
                          {isEditing && (
                            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
                              <h4
                                className="text-sm font-semibold mb-2 transition-colors duration-200"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                Change Assignee
                              </h4>
                              <SearchableDropdown
                                options={allAssignees}
                                value={formData.assigneeId || (formData.externalContactId ? `contact_${formData.externalContactId}` : '')}
                                onChange={(value) => {
                                  if (value.startsWith('contact_')) {
                                    // Selected a contact
                                    const contactId = value.split('_')[1];
                                    setFormData(prev => ({
                                      ...prev,
                                      assigneeId: '',
                                      externalContactId: contactId
                                    }));
                                  } else {
                                    // Selected an employee
                                    setFormData(prev => ({
                                      ...prev,
                                      assigneeId: value,
                                      externalContactId: ''
                                    }));
                                    const selectedEmployee = users.find(user => user.id.toString() === value);
                                    if (selectedEmployee) {
                                      addToRecentEmployees(selectedEmployee);
                                    }
                                  }
                                }}
                                placeholder="Select an employee or contact"
                                disabled={isLoadingUsers || isLoadingContacts}
                                recentEmployees={recentEmployees}
                                allowAddNew={!isPersonalAccount}
                                onAddNew={handleAddNewContact}
                                renderOption={(assignee) => (
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${assignee.type === 'contact' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                    <span>{assignee.displayName || assignee.name}</span>
                                    <span style={{ color: 'var(--color-text-tertiary)' }}>({assignee.email})</span>
                                    {assignee.type === 'contact' && (
                                      <span className="text-xs px-2 py-0.5 rounded" style={{
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        color: 'var(--color-text-secondary)'
                                      }}>
                                        External
                                      </span>
                                    )}
                                  </div>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Personal Account */
                        <div>
                          {isEditing ? (
                            <div className="space-y-3">
                              <h4
                                className="text-base font-semibold mb-3 transition-colors duration-200"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                Assigned To
                              </h4>
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
                            <div>
                              <div className="space-y-2">
                                {viewedTask.externalContact ? (
                                  <div className="flex items-center space-x-3 group relative">
                                    <div
                                      className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{
                                        backgroundColor: '#3b82f6',
                                        width: '32px',
                                        height: '32px',
                                        minWidth: '32px',
                                        minHeight: '32px',
                                        maxWidth: '32px',
                                        maxHeight: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      <span
                                        className="text-sm"
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          lineHeight: '1'
                                        }}
                                      >
                                        {viewedTask.externalContact.name.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="text-sm transition-colors duration-200"
                                        style={{ color: 'var(--color-text-primary)' }}
                                      >
                                        {viewedTask.externalContact.name}
                                      </span>
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded uppercase font-medium"
                                        style={{
                                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                          color: '#93c5fd',
                                        }}
                                      >
                                        EXTERNAL CONTACT
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
                                      {viewedTask.externalContact.email}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-3 group relative">
                                    <div
                                      className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{
                                        backgroundColor: 'var(--color-primary)',
                                        width: '32px',
                                        height: '32px',
                                        minWidth: '32px',
                                        minHeight: '32px',
                                        maxWidth: '32px',
                                        maxHeight: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      <span
                                        className="text-sm"
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          lineHeight: '1'
                                        }}
                                      >
                                        {user?.name?.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="text-sm transition-colors duration-200"
                                        style={{ color: 'var(--color-text-primary)' }}
                                      >
                                        {user?.name || 'You'}
                                      </span>
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded uppercase font-medium"
                                        style={{
                                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                          color: '#a5b4fc',
                                        }}
                                      >
                                        YOU
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task Hierarchy Tab */}
                  {activeTab === 'hierarchy' && (
                    <div className="animate-fadeIn">
                      {/* Project Information - Only show if no parent task and user is project owner */}
                      {viewedTask.project && !viewedTask.parentTask && viewedTask.project.ownerId === user?.id && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2 h-8">
                            <h4
                              className="text-sm font-semibold transition-colors duration-200"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              Project
                            </h4>
                          </div>
                          <div
                            className="border rounded-lg p-3 cursor-pointer transition text-sm transition-colors duration-200"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              borderColor: 'var(--color-border-default)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                              e.currentTarget.style.borderColor = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                              e.currentTarget.style.borderColor = 'var(--color-border-default)';
                            }}
                            onClick={() => {
                              // Close task modal and navigate to project with state
                              onClose();
                              navigate('/projects', {
                                state: { openProjectId: viewedTask.project.id }
                              });
                            }}
                            title="Open project"
                          >
                            <div className="flex items-center space-x-3">
                              {viewedTask.project.icon && (
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                  style={{ backgroundColor: viewedTask.project.color || '#6366f1' }}
                                >
                                  {viewedTask.project.icon}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <FaSitemap className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                                  <p
                                    className="font-medium transition-colors duration-200 truncate"
                                    style={{ color: 'var(--color-text-primary)' }}
                                  >
                                    {viewedTask.project.name}
                                  </p>
                                </div>
                                <p
                                  className="text-xs mt-1 transition-colors duration-200"
                                  style={{ color: 'var(--color-text-tertiary)' }}
                                >
                                  Click to view project
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleTaskClick(viewedTask.parentTask.id);
                              }}
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
                          <div className="mb-2">
                            <h4
                              className="text-sm font-semibold transition-colors duration-200"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              Subtasks {viewedTask.subtasks && viewedTask.subtasks.length > 0 && `(${viewedTask.subtasks.length})`}
                            </h4>
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
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleTaskClick(subtask.id);
                                  }}
                                  title="Open subtask"
                                >
                                  {/* Title */}
                                  <div className="mb-2">
                                    <span
                                      className="text-sm font-medium transition-colors duration-200"
                                      style={{ color: 'var(--color-text-primary)' }}
                                    >
                                      {subtask.title}
                                    </span>
                                  </div>

                                  {/* Assignee */}
                                  {!isPersonalAccount && subtask.assignee && (
                                    <div
                                      className="text-xs flex items-center gap-1 mb-2 transition-colors duration-200"
                                      style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                      <FaUsers className="w-3 h-3" />
                                      {subtask.assignee.name}
                                    </div>
                                  )}

                                  {/* Status Badge */}
                                  <div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${getStatusColor(subtask.status)} inline-block`}>
                                      {STATUS_LABELS[subtask.status].toUpperCase()}
                                    </span>
                                  </div>
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

              {/* Add Contact Modal */}
              {isAddContactModalOpen && (
                <AddContactModal
                  isOpen={isAddContactModalOpen}
                  onClose={() => {
                    setIsAddContactModalOpen(false);
                    setPendingEmail('');
                  }}
                  onContactAdded={handleContactAdded}
                  initialEmail={pendingEmail}
                />
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
                  onTaskSwitch={onTaskSwitch}
                  readOnly={isViewerOnly}
                />
              </div>
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

        {/* Unaccept Confirmation Modal */}
        {isUnaccessConfirmOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
            <div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="text-3xl text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Withdraw from Task?
                  </h3>
                  <p
                    className="text-sm mb-3"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    You will withdraw from this task and it will no longer appear in your dashboard. The task creator ({viewedTask?.assigner?.name}) will be notified.
                  </p>
                  <div
                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4"
                    style={{
                      backgroundColor: 'var(--color-warning-bg)',
                      borderColor: 'var(--color-warning-border)'
                    }}
                  >
                    <p
                      className="text-xs font-medium"
                      style={{ color: 'var(--color-warning-text)' }}
                    >
                      <strong>Note:</strong> This action will remove you as the assignee and reset the task status to TODO. The task will need to be reassigned.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsUnaccessConfirmOpen(false)}
                  disabled={isUnaccepting}
                  className="px-4 py-2 rounded-md font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnaccept}
                  disabled={isUnaccepting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUnaccepting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    <>
                      <FaTimesCircle />
                      Withdraw
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

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

        {/* Add Team Member Modal */}
        <AddTeamMemberModal
          isOpen={isAddTeamMemberModalOpen}
          onClose={() => setIsAddTeamMemberModalOpen(false)}
          onAdd={handleAddCoAssignee}
          taskId={viewedTask?.id}
          contacts={contacts}
          excludeUserIds={[
            viewedTask?.assigneeId,
            ...(coAssignees.map(co => co.userId) || []),
            ...(viewedTask?.collaborators?.map(c => c.userId) || []),
            ...(viewedTask?.sharedWith?.map(s => s.userId).filter(Boolean) || [])
          ].filter(Boolean)}
          excludeContactIds={[
            ...(viewedTask?.sharedWith?.map(s => s.contactId).filter(Boolean) || [])
          ]}
        />

    </>
  );

  // Render modal using portal to ensure it's outside any parent containers
  return createPortal(modalContent, document.body);
};

export default TaskModal; 