import { useState, useEffect, useMemo, useCallback } from 'react';
import { projectsAPI, usersAPI, tasksAPI, contactsAPI, templatesAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import useContactStore from '../../stores/contactStore';
import { useToastContext } from '../../context/ToastContext';
import AddProjectTaskModal from './AddProjectTaskModal';
import TaskModal from '../tasks/TaskModal';
import SaveAsTemplateModal from './SaveAsTemplateModal';
import EditProjectModal from './EditProjectModal';
import SearchableDropdown from '../common/SearchableDropdown';
import AddContactModal from '../common/AddContactModal';
import { FaTrash, FaPlus, FaPaperPlane, FaSave, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import IconButton from '../common/IconButton';
import { formatDateForInput, convertLocalDateTimeToUTC } from '../../utils/dateUtils';

const ProjectDetailModal = ({ isOpen, onClose, projectId, onProjectUpdated, onProjectDeleted, initialSuccessMessage }) => {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignTask, setReassignTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sendingTaskId, setSendingTaskId] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingSelected, setSendingSelected] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set()); // Renamed from selectedDraftTasks - now works for ALL tasks

  const [reassignForm, setReassignForm] = useState({
    assignmentType: 'internal',
    assigneeId: '',
    externalContactId: ''
  });
  const [taskTimeSettings, setTaskTimeSettings] = useState({}); // Track which tasks have time enabled
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState(null); // Track which task the contact is being added for
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const { user } = useAuthStore();
  const { fetchContacts: fetchContactsFromStore } = useContactStore();
  const toast = useToastContext();

  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProject();
      fetchEmployees();
      fetchContacts();
      // Set initial success message if provided
      if (initialSuccessMessage) {
        setSuccessMessage(initialSuccessMessage);
      }
    }
  }, [isOpen, projectId, initialSuccessMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTasks(new Set());
    }
  }, [isOpen]);

  // Computed selection analysis
  const selectedTaskObjects = project?.tasks?.filter(t => selectedTasks.has(t.id)) || [];
  const selectedCount = selectedTasks.size;

  // Analyze what's selected
  const allDrafts = selectedTaskObjects.length > 0 && selectedTaskObjects.every(t => t.isDraft);
  const allActive = selectedTaskObjects.length > 0 && selectedTaskObjects.every(t => !t.isDraft && t.status !== 'COMPLETED');
  const allCompleted = selectedTaskObjects.length > 0 && selectedTaskObjects.every(t => t.status === 'COMPLETED');
  const allTodo = selectedTaskObjects.length > 0 && selectedTaskObjects.every(t => t.status === 'TODO' && !t.isDraft);
  const allInProgress = selectedTaskObjects.length > 0 && selectedTaskObjects.every(t => t.status === 'IN_PROGRESS');
  const allOnHold = selectedTaskObjects.length > 0 && selectedTaskObjects.every(t => t.status === 'ON_HOLD');

  // Get counts by type
  const draftTasks = selectedTaskObjects.filter(t => t.isDraft);
  const activeTasks = selectedTaskObjects.filter(t => !t.isDraft && (t.status === 'TODO' || t.status === 'IN_PROGRESS'));
  const completedTasks = selectedTaskObjects.filter(t => t.status === 'COMPLETED');
  const onHoldTasks = selectedTaskObjects.filter(t => t.status === 'ON_HOLD');

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await projectsAPI.getById(projectId);
      setProject(response.data);

      // Initialize taskTimeSettings based on existing task times
      // Preserve existing settings to prevent checkbox from auto-ticking on refresh
      setTaskTimeSettings(prev => {
        const newTimeSettings = {};
        response.data.tasks?.forEach(task => {
          // First priority: preserve existing setting if task already tracked
          if (prev[task.id] !== undefined) {
            newTimeSettings[task.id] = prev[task.id];
          } else if (task.dueDate) {
            // Second priority: for NEW tasks with dates, detect from the date
            const date = new Date(task.dueDate);
            const isDateOnly = date.getHours() === 23 && date.getMinutes() === 59;
            newTimeSettings[task.id] = !isDateOnly;
          }
          // If no previous setting and no date, leave undefined (unchecked)
        });
        return newTimeSettings;
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await usersAPI.getEmployees();
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  // Create combined options for SearchableDropdown
  const getAllAssignees = useCallback(() => {
    return [
      ...employees.map(emp => ({
        ...emp,
        type: 'internal',
        displayName: emp.name,
        email: emp.email,
        id: emp.id
      })),
      ...contacts.map(contact => ({
        ...contact,
        type: 'external',
        displayName: contact.name,
        email: contact.email,
        id: contact.id
      }))
    ];
  }, [employees, contacts]);

  const getOptionValue = useCallback((option) => `${option.type}:${option.id}`, []);

  const renderOption = useCallback((option) => (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${option.type === 'external' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
      <span>{option.displayName || option.name}</span>
      <span
        className="transition-colors duration-200"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        ({option.email})
      </span>
      {option.type === 'external' && (
        <span
          className="text-xs px-2 py-0.5 rounded transition-colors duration-200"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-secondary)'
          }}
        >
          External
        </span>
      )}
    </div>
  ), []);

  const handleAddNewContact = (email, taskId) => {
    setPendingEmail(email);
    setPendingTaskId(taskId);
    setIsAddContactModalOpen(true);
  };

  const handleContactAdded = async (newContact) => {
    // Refresh contacts
    await fetchContacts();
    // If there's a pending task, assign the new contact to it
    if (pendingTaskId) {
      await handleQuickAssign(pendingTaskId, newContact.id.toString(), 'external');
    }
    setIsAddContactModalOpen(false);
    setPendingEmail('');
    setPendingTaskId(null);
  };

  const handleAddTask = async (taskData) => {
    try {
      await projectsAPI.addTask(projectId, taskData);
      await fetchProject();
      setSuccessMessage('Task added as draft!');
    } catch (err) {
      console.error('Error adding task:', err);
      throw err;
    }
  };

  const handleSendTask = async (taskId) => {
    try {
      setSendingTaskId(taskId);

      // Find the task in the project to validate before sending
      const taskToSend = project?.tasks?.find(t => t.id === taskId);
      if (taskToSend) {
        // Frontend validation
        if (!taskToSend.assigneeId && !taskToSend.externalContactId) {
          setError('Task must have an assignee before it can be sent. Please assign the task to someone first.');
          setSendingTaskId(null);
          return;
        }

        if (!taskToSend.dueDate) {
          setError('Task must have a due date before it can be sent. Please set a due date first.');
          setSendingTaskId(null);
          return;
        }

        const dueDateObj = new Date(taskToSend.dueDate);
        const now = new Date();
        if (dueDateObj <= now) {
          setError('Task due date must be in the future before it can be sent. Please update the due date.');
          setSendingTaskId(null);
          return;
        }
      }

      await projectsAPI.sendTask(projectId, taskId);
      await fetchProject();
      setSuccessMessage('Task sent successfully!');
    } catch (err) {
      console.error(`Error sending task ${taskId}:`, err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send task';
      console.error('Error details:', {
        status: err.response?.status,
        error: errorMessage,
        taskId,
        projectId,
        responseData: err.response?.data
      });
      setError(errorMessage);
    } finally {
      setSendingTaskId(null);
    }
  };

  const handleSendAllDrafts = async () => {
    try {
      setSendingAll(true);
      const response = await projectsAPI.sendAllDraftTasks(projectId);
      await fetchProject();
      setSuccessMessage(response.data.message);
    } catch (err) {
      console.error('Error sending all drafts:', err);
      setError(err.response?.data?.error || 'Failed to send tasks');
    } finally {
      setSendingAll(false);
    }
  };

  const handleSendSelectedDrafts = async () => {
    if (draftTasks.length === 0) return;

    try {
      setSendingSelected(true);
      let successCount = 0;
      let errorCount = 0;

      // Send only draft tasks from selection
      for (const task of draftTasks) {
        try {
          // Frontend validation before sending
          if (!task.assigneeId && !task.externalContactId) {
            console.warn(`Task ${task.id} cannot be sent: missing assignee`);
            errorCount++;
            continue;
          }

          if (!task.dueDate) {
            console.warn(`Task ${task.id} cannot be sent: missing due date`);
            errorCount++;
            continue;
          }

          const dueDateObj = new Date(task.dueDate);
          const now = new Date();
          if (dueDateObj <= now) {
            console.warn(`Task ${task.id} cannot be sent: due date is in the past`);
            errorCount++;
            continue;
          }

          await projectsAPI.sendTask(projectId, task.id);
          successCount++;
        } catch (err) {
          console.error(`Error sending task ${task.id}:`, err);
          const errorMessage = err.response?.data?.error || err.message || 'Failed to send task';
          console.error('Error details:', {
            status: err.response?.status,
            error: errorMessage,
            taskId: task.id,
            projectId,
            responseData: err.response?.data
          });
          errorCount++;
        }
      }

      await fetchProject();
      setSelectedTasks(new Set()); // Clear selection after sending

      // Show appropriate message
      if (errorCount === 0) {
        setSuccessMessage(`${successCount} draft task${successCount > 1 ? 's' : ''} sent successfully!`);
      } else if (successCount === 0) {
        setError(`Failed to send ${errorCount} task${errorCount > 1 ? 's' : ''}`);
      } else {
        setSuccessMessage(`${successCount} task${successCount > 1 ? 's' : ''} sent successfully, ${errorCount} failed`);
      }
    } catch (err) {
      console.error('Error sending selected drafts:', err);
      setError('Failed to send selected tasks');
    } finally {
      setSendingSelected(false);
    }
  };

  const handleBulkStatusChange = async (newStatus, taskList, statusName) => {
    if (taskList.length === 0) return;

    const count = taskList.length;
    if (!window.confirm(`Mark ${count} task${count > 1 ? 's' : ''} as ${statusName}?`)) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      // Update status for each task
      for (const task of taskList) {
        try {
          await tasksAPI.updateStatus(task.id, newStatus);
          successCount++;
        } catch (err) {
          console.error(`Error updating task ${task.id}:`, err);
          errorCount++;
        }
      }

      await fetchProject();
      setSelectedTasks(new Set());

      if (errorCount === 0) {
        setSuccessMessage(`${successCount} task${successCount > 1 ? 's' : ''} marked as ${statusName}!`);
      } else if (successCount === 0) {
        setError(`Failed to update ${errorCount} task${errorCount > 1 ? 's' : ''}`);
      } else {
        setSuccessMessage(`${successCount} task${successCount > 1 ? 's' : ''} updated, ${errorCount} failed`);
      }
    } catch (err) {
      console.error('Error bulk updating status:', err);
      setError('Failed to update task status');
    }
  };

  const handleBulkComplete = () => handleBulkStatusChange('COMPLETED', activeTasks, 'completed');
  const handleBulkTodo = () => handleBulkStatusChange('TODO', [...completedTasks, ...onHoldTasks], 'to do');

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      }));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setPendingDeleteTaskId(taskId);
    setIsDeleteTaskConfirmOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!pendingDeleteTaskId) return;

    setIsDeleteTaskConfirmOpen(false);
    const taskId = pendingDeleteTaskId;
    setPendingDeleteTaskId(null);

    try {
      await projectsAPI.removeTask(projectId, taskId);
      await fetchProject();
      toast.success('Task deleted successfully!');
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleTaskSelect = (taskId, isSelected) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allTasks = project?.tasks || [];
    const allSelected = allTasks.every(task => selectedTasks.has(task.id));

    if (allSelected) {
      // Deselect all
      setSelectedTasks(new Set());
    } else {
      // Select all
      setSelectedTasks(new Set(allTasks.map(task => task.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;

    setIsBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleteConfirmOpen(false);

    const selectedTaskObjects = Array.from(selectedTasks)
      .map(id => project.tasks.find(t => t.id === id))
      .filter(Boolean);

    const count = selectedTaskObjects.length;
    if (count === 0) return;

    try {
      // Delete tasks sequentially
      for (const task of selectedTaskObjects) {
        await projectsAPI.removeTask(projectId, task.id);
      }

      await fetchProject();
      setSelectedTasks(new Set());
      toast.success(`${count} task${count > 1 ? 's' : ''} deleted successfully!`);
    } catch (err) {
      console.error('Error bulk deleting tasks:', err);
      toast.error(err.response?.data?.error || 'Failed to delete some tasks');
    }
  };

  const handleOpenReassign = (task) => {
    setReassignTask(task);
    setReassignForm({
      assignmentType: task.assigneeId ? 'internal' : 'external',
      assigneeId: task.assigneeId || '',
      externalContactId: task.externalContactId || ''
    });
    setIsReassigning(true);
  };

  const handleTaskClick = async (task) => {
    try {
      // Fetch full task details before opening modal
      const response = await tasksAPI.getById(task.id);
      setSelectedTask(response.data);
      setIsTaskModalOpen(true);
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError('Failed to load task details');
    }
  };

  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    fetchProject(); // Refresh project to show any updates
  };

  const handleQuickAssign = async (taskId, assigneeId, assignmentType) => {
    try {
      // Always send both fields to ensure mutual exclusivity
      const updateData = {
        assigneeId: assignmentType === 'internal' ? parseInt(assigneeId) : null,
        externalContactId: assignmentType === 'external' ? parseInt(assigneeId) : null
      };

      await tasksAPI.update(taskId, updateData);

      // Update the task in local state without full reload
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => {
          if (task.id === taskId) {
            // Find the assignee info
            const assignee = assignmentType === 'internal'
              ? employees.find(e => e.id === parseInt(assigneeId))
              : null;
            const externalContact = assignmentType === 'external'
              ? contacts.find(c => c.id === parseInt(assigneeId))
              : null;

            return {
              ...task,
              assigneeId: assignmentType === 'internal' ? parseInt(assigneeId) : null,
              externalContactId: assignmentType === 'external' ? parseInt(assigneeId) : null,
              assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
              externalContact: externalContact ? { id: externalContact.id, name: externalContact.name, email: externalContact.email } : null
            };
          }
          return task;
        })
      }));
    } catch (err) {
      console.error('Error assigning task:', err);
      setError(err.response?.data?.error || 'Failed to assign task');
    }
  };

  const handleQuickDueDateChange = async (taskId, newDueDate) => {
    try {
      // If time is not enabled for this task, append T23:59
      const includeTime = taskTimeSettings[taskId] || false;
      let finalDate = newDueDate;

      if (newDueDate && !includeTime) {
        // Set to 11:59 PM for date-only
        finalDate = `${newDueDate}T23:59`;
      }

      // Convert local datetime to UTC ISO string for server
      const utcDate = convertLocalDateTimeToUTC(finalDate);
      await tasksAPI.update(taskId, { dueDate: utcDate });

      // Update the task in local state without full reload
      // Convert the date string to a Date object for consistent local state
      const dateObject = finalDate ? new Date(finalDate) : null;
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId ? { ...task, dueDate: dateObject } : task
        )
      }));
    } catch (err) {
      console.error('Error updating due date:', err);
      setError(err.response?.data?.error || 'Failed to update due date');
    }
  };

  const handleTimeToggle = async (taskId, checked) => {
    // Update local state immediately for UI responsiveness
    setTaskTimeSettings(prev => ({ ...prev, [taskId]: checked }));

    // If task has a due date, update it with or without time
    const task = project?.tasks?.find(t => t.id === taskId);
    if (task?.dueDate) {
      const date = new Date(task.dueDate);
      let newValue;

      if (!checked) {
        // Set to 11:59 PM
        date.setHours(23, 59, 0, 0);
        newValue = date.toISOString();
      } else {
        // Keep current time or set to current time if it was 11:59 PM
        if (date.getHours() === 23 && date.getMinutes() === 59) {
          const now = new Date();
          date.setHours(now.getHours(), now.getMinutes(), 0, 0);
          newValue = date.toISOString();
        } else {
          newValue = date.toISOString();
        }
      }

      try {
        await tasksAPI.update(taskId, { dueDate: newValue });
        setProject(prev => ({
          ...prev,
          tasks: prev.tasks.map(t =>
            t.id === taskId ? { ...t, dueDate: new Date(newValue) } : t
          )
        }));
      } catch (err) {
        console.error('Error updating due date:', err);
        setError(err.response?.data?.error || 'Failed to update due date');
      }
    }
    // If task doesn't have a date yet, just keep the checkbox state in local state
    // It will be applied when the user sets a date
  };

  const handleReassignSubmit = async () => {
    try {
      const data = {
        assigneeId: reassignForm.assignmentType === 'internal' ? parseInt(reassignForm.assigneeId) : null,
        externalContactId: reassignForm.assignmentType === 'external' ? parseInt(reassignForm.externalContactId) : null
      };

      await projectsAPI.reassignTask(projectId, reassignTask.id, data);
      await fetchProject();
      setSuccessMessage('Task reassigned successfully! Remember to send it.');
      setIsReassigning(false);
      setReassignTask(null);
    } catch (err) {
      console.error('Error reassigning task:', err);
      setError(err.response?.data?.error || 'Failed to reassign task');
    }
  };

  const handleSaveAsTemplate = async (templateData) => {
    try {
      await templatesAPI.createFromProject(projectId, templateData);
      setSuccessMessage('Template created successfully!');
      setShowSaveTemplateModal(false);
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err.response?.data?.error || 'Failed to create template');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectsAPI.delete(projectId);
      onProjectDeleted(projectId);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleMarkComplete = async () => {
    try {
      await projectsAPI.update(projectId, { status: 'COMPLETED' });
      await fetchProject();
      setSuccessMessage('Project marked as complete!');
      if (onProjectUpdated) {
        const response = await projectsAPI.getById(projectId);
        onProjectUpdated(response.data);
      }
    } catch (err) {
      console.error('Error marking project complete:', err);
      setError(err.response?.data?.error || 'Failed to mark project complete');
    }
  };

  const handleUncomplete = async () => {
    try {
      await projectsAPI.update(projectId, { status: 'ACTIVE' });
      await fetchProject();
      setSuccessMessage('Project uncompleted!');
      if (onProjectUpdated) {
        const response = await projectsAPI.getById(projectId);
        onProjectUpdated(response.data);
      }
    } catch (err) {
      console.error('Error uncompleting project:', err);
      setError(err.response?.data?.error || 'Failed to uncomplete project');
    }
  };

  const handleProjectEdited = async (updatedProject) => {
    await fetchProject();
    setSuccessMessage('Project updated successfully!');
    if (onProjectUpdated) {
      onProjectUpdated(updatedProject);
    }
    setIsEditModalOpen(false);
  };

  const getTaskStatusIcon = (task) => {
    if (task.isDraft) return '📝';
    if (task.status === 'COMPLETED') return '✓';

    // Check if this is an external contact invitation that hasn't been accepted yet
    // If assigneeId is set, external contact has accepted (we keep both fields)
    if (task.externalContactId && !task.assigneeId) {
      // External contact task that hasn't been accepted
      const invitation = task.invitations?.[0];
      if (!invitation || invitation.status === 'PENDING') return '📧';
      if (invitation.status === 'ACCEPTED') return '✅';
      if (invitation.status === 'DECLINED') return '❌';
    }

    // Internal task or accepted external contact
    if (task.status === 'IN_PROGRESS') return '⏳';
    return '○';
  };

  const getTaskStatusText = (task) => {
    if (task.isDraft) return 'Draft';
    if (task.status === 'COMPLETED') return 'Completed';

    // Check if this is an external contact invitation that hasn't been accepted yet
    // If assigneeId is set, external contact has accepted (we keep both fields)
    if (task.externalContactId && !task.assigneeId) {
      const invitation = task.invitations?.[0];
      if (!invitation || invitation.status === 'PENDING') return 'Pending Response';
      if (invitation.status === 'ACCEPTED') return 'Accepted';
      if (invitation.status === 'DECLINED') return 'Declined';
    }

    return task.status.replace('_', ' ');
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

  const draftCount = project?.tasks?.filter(t => t.isDraft).length || 0;

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 50 }}>
      <div
        className="modal-box max-w-6xl max-h-[90vh] border"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Content */}
        {project && !isLoading && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4 flex-1">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: project.color + '20' }}
                >
                  {project.icon}
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {project.name}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    Owned by {project.owner?.name}
                    {project.isOwner && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">
                        You
                      </span>
                    )}
                  </p>
                </div>

                {/* Due Date - Top Right */}
                {project.dueDate && (
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Project Due</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {new Date(project.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              <IconButton
                icon={<FaTimes />}
                label="Close"
                iconOnly={true}
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="!ml-4 !p-2 !rounded-full"
              />
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="alert alert-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMessage}</span>
                <IconButton
                  onClick={() => setSuccessMessage('')}
                  icon={<FaTimes />}
                  label="Close"
                  iconOnly={true}
                  variant="ghost"
                  size="sm"
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
                <IconButton
                  onClick={() => setError(null)}
                  icon={<FaTimes />}
                  label="Close"
                  iconOnly={true}
                  variant="ghost"
                  size="sm"
                />
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {project.completedTasks} of {project.totalTasks} tasks completed
                </span>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {project.progress}%
                </span>
              </div>
              <div
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${project.progress}%`,
                    backgroundColor: project.color
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                {project.canManage && (
                  <>
                    <IconButton
                      icon={<FaPlus />}
                      label="Add Task"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddingTask(true)}
                      className="!bg-indigo-600 hover:!bg-indigo-700"
                    />

                    {/* Send Tasks Button - Shows when no selection OR drafts are selected */}
                    {(draftCount > 0 && selectedCount === 0) && (
                      <IconButton
                        icon={<FaPaperPlane />}
                        label={sendingAll ? "Sending..." : `Send All Tasks (${draftCount})`}
                        variant="primary"
                        size="sm"
                        onClick={handleSendAllDrafts}
                        disabled={sendingAll}
                        loading={sendingAll}
                        className="!bg-emerald-600 hover:!bg-emerald-700"
                      />
                    )}

                    {/* SMART ACTION BUTTONS - Based on Selection */}
                    {selectedCount > 0 && (
                      <>
                        {/* Send Tasks (if any drafts selected) */}
                        {draftTasks.length > 0 && (
                          <IconButton
                            icon={<FaPaperPlane />}
                            label={sendingSelected ? "Sending..." : `Send Tasks (${draftTasks.length})`}
                            variant="primary"
                            size="sm"
                            onClick={handleSendSelectedDrafts}
                            disabled={sendingSelected}
                            loading={sendingSelected}
                            className="!bg-emerald-600 hover:!bg-emerald-700"
                          />
                        )}

                        {/* Mark Complete (if any active tasks selected) */}
                        {activeTasks.length > 0 && (
                          <IconButton
                            icon={<FaCheck />}
                            label={`Complete (${activeTasks.length})`}
                            variant="success"
                            size="sm"
                            onClick={handleBulkComplete}
                            className="!bg-green-600 hover:!bg-green-700"
                          />
                        )}

                        {/* Reopen (if completed or on-hold tasks selected) */}
                        {(completedTasks.length > 0 || onHoldTasks.length > 0) && (
                          <IconButton
                            icon={<FaCheck />}
                            label={`Reopen (${completedTasks.length + onHoldTasks.length})`}
                            variant="primary"
                            size="sm"
                            onClick={handleBulkTodo}
                            className="!bg-blue-600 hover:!bg-blue-700"
                          />
                        )}

                        {/* Delete Selected */}
                        <IconButton
                          icon={<FaTrash />}
                          label={`Delete (${selectedCount})`}
                          variant="danger"
                          size="sm"
                          onClick={handleBulkDelete}
                        />
                      </>
                    )}

                    <IconButton
                      icon={<FaSave />}
                      label="Save as Template"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowSaveTemplateModal(true)}
                      title="Save project as a reusable template"
                      className="!bg-purple-600 hover:!bg-purple-700 !text-white"
                    />
                  </>
                )}

                {project.canManage && (
                  <>
                    <IconButton
                      icon={<FaEdit />}
                      label="Edit Project"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                    />
                    {project.status !== 'COMPLETED' && (
                      <IconButton
                        icon={<FaCheck />}
                        label="Mark Complete"
                        variant="success"
                        size="sm"
                        onClick={handleMarkComplete}
                      />
                    )}
                    {project.status === 'COMPLETED' && (
                      <IconButton
                        icon={<FaTimes />}
                        label="Uncomplete"
                        variant="warning"
                        size="sm"
                        onClick={handleUncomplete}
                      />
                    )}
                  </>
                )}
              </div>

              <span className={`px-3 py-1 rounded-full text-sm font-medium ${project.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                  project.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                }`}>
                {project.status}
              </span>
            </div>

            {/* 3-Column Task Table */}
            <div
              className="rounded-lg border overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)'
              }}
            >
              {/* Table Header */}
              <div
                className="grid grid-cols-10 gap-4 p-4 font-semibold text-sm border-b"
                style={{
                  backgroundColor: 'var(--color-bg-quaternary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <div className="col-span-4 flex items-center">
                  <div className="w-6 flex justify-center">
                    {project.tasks && project.tasks.length > 0 && project.canManage && (
                      <input
                        type="checkbox"
                        checked={project.tasks.length > 0 && project.tasks.every(task => selectedTasks.has(task.id))}
                        onChange={handleSelectAll}
                        className="checkbox checkbox-sm"
                        style={{
                          border: '2px solid var(--color-text-tertiary)',
                          backgroundColor: (project.tasks.length > 0 && project.tasks.every(task => selectedTasks.has(task.id))) ? 'var(--color-accent)' : 'transparent',
                          '--chkbg': 'var(--color-accent)'
                        }}
                      />
                    )}
                  </div>
                  <span className="ml-2">Task Name</span>
                </div>
                <div className="col-span-4">Assigned To</div>
                <div className="col-span-2 flex flex-col">
                  <span>Due Date</span>
                  <label className="flex items-center mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={project.tasks?.length > 0 && project.tasks.every(t => taskTimeSettings[t.id])}
                      onChange={async (e) => {
                        const checked = e.target.checked;

                        // Update all task time settings immediately
                        const newSettings = {};
                        project.tasks?.forEach(task => {
                          newSettings[task.id] = checked;
                        });
                        setTaskTimeSettings(newSettings);

                        // Only update tasks that have dates
                        const tasksWithDates = project.tasks?.filter(task => task.dueDate) || [];

                        if (tasksWithDates.length === 0) {
                          // No tasks with dates, just update local state
                          return;
                        }

                        // Update all tasks with dates
                        const updatePromises = tasksWithDates.map(async (task) => {
                          const date = new Date(task.dueDate);
                          let newValue;

                          if (!checked) {
                            date.setHours(23, 59, 0, 0);
                            newValue = date.toISOString();
                          } else {
                            if (date.getHours() === 23 && date.getMinutes() === 59) {
                              const now = new Date();
                              date.setHours(now.getHours(), now.getMinutes(), 0, 0);
                              newValue = date.toISOString();
                            } else {
                              newValue = date.toISOString();
                            }
                          }

                          try {
                            await tasksAPI.update(task.id, { dueDate: newValue });
                            return { id: task.id, dueDate: new Date(newValue) };
                          } catch (err) {
                            console.error('Error updating task time:', err);
                            return null;
                          }
                        });

                        // Wait for all updates to complete
                        const results = await Promise.all(updatePromises);

                        // Update local state with new dates
                        setProject(prev => ({
                          ...prev,
                          tasks: prev.tasks.map(t => {
                            const result = results.find(r => r && r.id === t.id);
                            return result ? { ...t, dueDate: result.dueDate } : t;
                          })
                        }));
                      }}
                      className="checkbox checkbox-xs mr-1"
                      style={{
                        accentColor: 'var(--color-primary)',
                        border: '2px solid var(--color-text-tertiary)',
                        backgroundColor: (project.tasks?.length > 0 && project.tasks.every(t => taskTimeSettings[t.id])) ? 'var(--color-accent)' : 'transparent'
                      }}
                    />
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      Set time for all
                    </span>
                  </label>
                </div>
              </div>

              {/* Task Rows */}
              <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                {project.tasks && project.tasks.length > 0 ? (
                  project.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="grid grid-cols-10 gap-4 p-4 cursor-pointer transition-all items-center hover:bg-indigo-500/10"
                      style={{
                        backgroundColor: task.isDraft ? 'var(--color-bg-secondary)' : 'transparent'
                      }}
                    >
                      {/* Task Name Column */}
                      <div className="col-span-4 flex items-center">
                        <div className="w-6 flex justify-center">
                          {/* Checkbox for ALL tasks (if can manage) */}
                          {project.canManage && (
                            <input
                              type="checkbox"
                              checked={selectedTasks.has(task.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleTaskSelect(task.id, e.target.checked);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="checkbox checkbox-sm"
                              style={{
                                border: '2px solid var(--color-text-tertiary)',
                                backgroundColor: selectedTasks.has(task.id) ? 'var(--color-accent)' : 'transparent',
                                '--chkbg': 'var(--color-accent)'
                              }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 ml-2">
                          <p
                            className="font-medium truncate"
                            style={{ color: 'var(--color-text-primary)' }}
                            title={task.title}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {/* Priority Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {/* Status Badge */}
                            {task.isDraft ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                Draft
                              </span>
                            ) : task.externalContactId && !task.assigneeId ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-purple-200">
                                {getTaskStatusText(task)}
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Assigned To Column */}
                      <div
                        className="col-span-4"
                        onClick={(e) => {
                          // Stop propagation if clicking on dropdown
                          if (e.target.closest('.searchable-dropdown-container')) {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {/* Show SearchableDropdown for all tasks (draft or sent) */}
                        <div className="searchable-dropdown-container w-full">
                          <SearchableDropdown
                            options={getAllAssignees()}
                            value={
                              // Prioritize externalContactId for display (handles accepted external users)
                              task.externalContactId
                                ? `external:${task.externalContactId}`
                                : task.assigneeId
                                  ? `internal:${task.assigneeId}`
                                  : ''
                            }
                            onChange={(compositeValue) => {
                              const [type, id] = compositeValue.split(':');
                              if (id) {
                                handleQuickAssign(task.id, id, type);
                              }
                            }}
                            placeholder="Assign to..."
                            renderOption={renderOption}
                            getOptionValue={getOptionValue}
                            allowAddNew={!isPersonalAccount}
                            onAddNew={(email) => handleAddNewContact(email, task.id)}
                            className="!text-sm w-full"
                          />
                        </div>
                      </div>

                      {/* Due Date Column */}
                      <div
                        className="col-span-2"
                        onClick={(e) => {
                          // Stop propagation if clicking on date input
                          if (e.target.tagName === 'INPUT' || e.target.closest('input') || e.target.tagName === 'LABEL') {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {/* Show date input for all tasks */}
                        <input
                          type={taskTimeSettings[task.id] ? 'datetime-local' : 'date'}
                          onClick={(e) => e.stopPropagation()}
                          value={task.dueDate ? (
                            taskTimeSettings[task.id]
                              ? (() => {
                                const date = new Date(task.dueDate);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                return `${year}-${month}-${day}T${hours}:${minutes}`;
                              })()
                              : formatDateForInput(task.dueDate)
                          ) : ''}
                          onChange={(e) => handleQuickDueDateChange(task.id, e.target.value)}
                          className="input input-sm input-bordered w-full"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                        />

                        {/* Time checkbox */}
                        <label
                          className="flex items-center mt-1 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={taskTimeSettings[task.id] || false}
                            onChange={(e) => handleTimeToggle(task.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="checkbox checkbox-xs mr-1"
                            style={{
                              accentColor: 'var(--color-primary)',
                              border: '2px solid var(--color-text-tertiary)',
                              backgroundColor: taskTimeSettings[task.id] ? 'var(--color-accent)' : 'transparent'
                            }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            Set time
                          </span>
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      No tasks yet
                    </p>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                      Add your first task to get started
                    </p>
                    {project.canManage && (
                      <IconButton
                        icon={<FaPlus />}
                        label="Add Task"
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAddingTask(true)}
                        className="!bg-indigo-600 hover:!bg-indigo-700"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {project.canManage && (
              <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
                {!confirmDelete ? (
                  <IconButton
                    icon={<FaTrash />}
                    label="Delete Project"
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                  />
                ) : (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Are you sure? Tasks will be unlinked from the project but not deleted.
                    </p>
                    <div className="flex gap-2">
                      <IconButton
                        icon={<FaTrash />}
                        label="Yes, Delete Project"
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteProject}
                      />
                      <IconButton
                        icon={<FaTimes />}
                        label="Cancel"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete(false)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Task Modal */}
      {isAddingTask && (
        <AddProjectTaskModal
          isOpen={isAddingTask}
          onClose={() => setIsAddingTask(false)}
          onTaskAdded={handleAddTask}
          projectId={projectId}
        />
      )}

      {/* Reassign Modal */}
      {isReassigning && reassignTask && (
        <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 55 }}>
          <div
            className="modal-box border"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Reassign Task
            </h3>

            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Task: <strong>{reassignTask.title}</strong>
            </p>

            {reassignTask.declinedReason && (
              <div
                className="p-3 rounded-lg mb-4"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Decline Reason:
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {reassignTask.declinedReason}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Reassign to:
                </label>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reassignType"
                      value="internal"
                      checked={reassignForm.assignmentType === 'internal'}
                      onChange={(e) => setReassignForm(prev => ({ ...prev, assignmentType: e.target.value }))}
                      className="radio radio-primary"
                    />
                    <span className="ml-2" style={{ color: 'var(--color-text-primary)' }}>Internal Employee</span>
                  </label>

                  {reassignForm.assignmentType === 'internal' && (
                    <select
                      value={reassignForm.assigneeId}
                      onChange={(e) => setReassignForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                      className="select select-bordered w-full"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <option value="">Select employee...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  )}

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reassignType"
                      value="external"
                      checked={reassignForm.assignmentType === 'external'}
                      onChange={(e) => setReassignForm(prev => ({ ...prev, assignmentType: e.target.value }))}
                      className="radio radio-primary"
                    />
                    <span className="ml-2" style={{ color: 'var(--color-text-primary)' }}>External Contact</span>
                  </label>

                  {reassignForm.assignmentType === 'external' && (
                    <select
                      value={reassignForm.externalContactId}
                      onChange={(e) => setReassignForm(prev => ({ ...prev, externalContactId: e.target.value }))}
                      className="select select-bordered w-full"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <option value="">Select contact...</option>
                      {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>{contact.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
              >
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <strong>Note:</strong> Task will be reset to draft. You'll need to send it again.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <IconButton
                icon={<FaPaperPlane />}
                label="Reassign Task"
                variant="primary"
                onClick={handleReassignSubmit}
                disabled={
                  (reassignForm.assignmentType === 'internal' && !reassignForm.assigneeId) ||
                  (reassignForm.assignmentType === 'external' && !reassignForm.externalContactId)
                }
                className="!bg-indigo-600 hover:!bg-indigo-700"
              />
              <IconButton
                icon={<FaTimes />}
                label="Cancel"
                variant="ghost"
                onClick={() => {
                  setIsReassigning(false);
                  setReassignTask(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Task Modal - Using existing TaskModal component */}
      {isTaskModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={handleTaskModalClose}
          onTaskChange={(newTask) => {
            setSelectedTask(newTask);
          }}
        />
      )}

      {/* Save as Template Modal */}
      {showSaveTemplateModal && (
        <SaveAsTemplateModal
          isOpen={showSaveTemplateModal}
          onClose={() => setShowSaveTemplateModal(false)}
          projectName={project?.name}
          onSave={handleSaveAsTemplate}
        />
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && project && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={project}
          onProjectUpdated={handleProjectEdited}
        />
      )}

      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <AddContactModal
          isOpen={isAddContactModalOpen}
          onClose={() => {
            setIsAddContactModalOpen(false);
            setPendingEmail('');
            setPendingTaskId(null);
          }}
          onContactAdded={handleContactAdded}
          initialEmail={pendingEmail}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="modal modal-open backdrop-blur-sm" style={{ zIndex: 55 }}>
          <div
            className="modal-box border"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Confirm Bulk Delete
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete {selectedCount} task{selectedCount > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <IconButton
                icon={<FaTimes />}
                label="Cancel"
                variant="ghost"
                size="sm"
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
              />
              <IconButton
                icon={<FaTrash />}
                label={`Delete ${selectedCount} Task${selectedCount > 1 ? 's' : ''}`}
                variant="danger"
                size="sm"
                onClick={confirmBulkDelete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailModal;
