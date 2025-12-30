import { useState, useEffect } from 'react';
import { projectsAPI, usersAPI, tasksAPI, contactsAPI, templatesAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import AddProjectTaskModal from './AddProjectTaskModal';
import TaskModal from '../tasks/TaskModal';
import SaveAsTemplateModal from './SaveAsTemplateModal';
import EditProjectModal from './EditProjectModal';

const ProjectDetailModal = ({ isOpen, onClose, projectId, onProjectUpdated, onProjectDeleted }) => {
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
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [reassignForm, setReassignForm] = useState({
    assignmentType: 'internal',
    assigneeId: '',
    externalContactId: ''
  });

  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProject();
      fetchEmployees();
      fetchContacts();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await projectsAPI.getById(projectId);
      setProject(response.data);
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
      await projectsAPI.sendTask(projectId, taskId);
      await fetchProject();
      setSuccessMessage('Task sent successfully!');
    } catch (err) {
      console.error('Error sending task:', err);
      setError(err.response?.data?.error || 'Failed to send task');
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
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await projectsAPI.removeTask(projectId, taskId);
      await fetchProject();
      setSuccessMessage('Task deleted successfully!');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.error || 'Failed to delete task');
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
      const updateData = {
        [assignmentType === 'internal' ? 'assigneeId' : 'externalContactId']: parseInt(assigneeId)
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
      await tasksAPI.update(taskId, { dueDate: newDueDate || null });
      
      // Update the task in local state without full reload
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === taskId ? { ...task, dueDate: newDueDate || null } : task
        )
      }));
    } catch (err) {
      console.error('Error updating due date:', err);
      setError(err.response?.data?.error || 'Failed to update due date');
    }
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
    if (task.externalContactId) {
      // External contact task
      const invitation = task.invitations?.[0];
      if (!invitation || invitation.status === 'PENDING') return '📧';
      if (invitation.status === 'ACCEPTED') return '✅';
      if (invitation.status === 'DECLINED') return '❌';
    }
    // Internal task
    if (task.status === 'IN_PROGRESS') return '⏳';
    return '○';
  };

  const getTaskStatusText = (task) => {
    if (task.isDraft) return 'Draft';
    if (task.status === 'COMPLETED') return 'Completed';
    if (task.externalContactId) {
      const invitation = task.invitations?.[0];
      if (!invitation || invitation.status === 'PENDING') return 'Pending Response';
      if (invitation.status === 'ACCEPTED') return 'Accepted';
      if (invitation.status === 'DECLINED') return 'Declined';
    }
    return task.status.replace('_', ' ');
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

              <button 
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle ml-4"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                ✕
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="alert alert-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMessage}</span>
                <button onClick={() => setSuccessMessage('')} className="btn btn-sm btn-ghost">✕</button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
                <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">✕</button>
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
              <div className="flex items-center space-x-3">
                {project.canManage && (
                  <>
                    <button
                      onClick={() => setIsAddingTask(true)}
                      className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 btn-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Task
                    </button>

                    {draftCount > 0 && (
                      <button
                        onClick={handleSendAllDrafts}
                        disabled={sendingAll}
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-sm"
                      >
                        {sendingAll ? (
                          <>
                            <span className="loading loading-spinner loading-sm mr-2"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send All Drafts ({draftCount})
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setShowSaveTemplateModal(true)}
                      className="btn btn-outline btn-sm"
                      style={{ 
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-secondary)'
                      }}
                      title="Save project as a reusable template"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save as Template
                    </button>
                  </>
                )}

                {project.canManage && (
                  <>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="btn btn-outline btn-sm"
                      style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Project
                    </button>
                    {project.status !== 'COMPLETED' && (
                      <button
                        onClick={handleMarkComplete}
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                      >
                        Mark Complete
                      </button>
                    )}
                    {project.status === 'COMPLETED' && (
                      <button
                        onClick={handleUncomplete}
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                      >
                        Uncomplete
                      </button>
                    )}
                  </>
                )}
              </div>

              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
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
                <div className="col-span-5">Task Name</div>
                <div className="col-span-3">Assigned To</div>
                <div className="col-span-2">Due Date</div>
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
                      <div className="col-span-5 flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                          <p 
                            className={`font-medium truncate ${task.status === 'COMPLETED' ? 'line-through opacity-60' : ''}`}
                            style={{ color: 'var(--color-text-primary)' }}
                            title={task.title}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              task.priority === 'LOW' ? 'bg-gray-500/20 text-gray-400' :
                              task.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                              task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                              {getTaskStatusText(task)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Assigned To Column */}
                      <div
                        className="col-span-3"
                        onClick={(e) => {
                          // Stop propagation if clicking on dropdown
                          if (e.target.tagName === 'SELECT' || e.target.closest('select')) {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {/* Show dropdown for all tasks (draft or sent) */}
                        <select
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const [type, id] = e.target.value.split(':');
                            if (id) {
                              handleQuickAssign(task.id, id, type);
                            }
                          }}
                          className="select select-sm select-bordered w-full"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                          value={
                            task.assigneeId
                              ? `internal:${task.assigneeId}`
                              : task.externalContactId
                                ? `external:${task.externalContactId}`
                                : ''
                          }
                        >
                          <option value="">Assign to...</option>
                          <optgroup label="Internal Team">
                            {employees.map(emp => (
                              <option key={emp.id} value={`internal:${emp.id}`}>
                                {emp.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="External Contacts">
                            {contacts.map(contact => (
                              <option key={contact.id} value={`external:${contact.id}`}>
                                {contact.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Due Date Column */}
                      <div
                        className="col-span-2"
                        onClick={(e) => {
                          // Stop propagation if clicking on date input
                          if (e.target.tagName === 'INPUT' || e.target.closest('input')) {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {/* Show date input for all tasks */}
                        <input
                          type="date"
                          onClick={(e) => e.stopPropagation()}
                          value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleQuickDueDateChange(task.id, e.target.value)}
                          className="input input-sm input-bordered w-full"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
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
                      <button
                        onClick={() => setIsAddingTask(true)}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 btn-sm"
                      >
                        Add Task
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            {project.canManage && (
              <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
                <h4 className="text-sm font-medium mb-3 text-red-400">Danger Zone</h4>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="btn btn-outline btn-error btn-sm"
                  >
                    Delete Project
                  </button>
                ) : (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Are you sure? Tasks will be unlinked from the project but not deleted.
                    </p>
                    <div className="space-x-2">
                      <button
                        onClick={handleDeleteProject}
                        className="btn btn-error btn-sm"
                      >
                        Yes, Delete Project
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
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

            <div className="modal-action">
              <button
                onClick={handleReassignSubmit}
                disabled={
                  (reassignForm.assignmentType === 'internal' && !reassignForm.assigneeId) ||
                  (reassignForm.assignmentType === 'external' && !reassignForm.externalContactId)
                }
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
              >
                Reassign Task
              </button>
              <button
                onClick={() => {
                  setIsReassigning(false);
                  setReassignTask(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
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
    </div>
  );
};

export default ProjectDetailModal;
