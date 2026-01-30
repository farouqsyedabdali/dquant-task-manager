import { useState, useEffect } from 'react';
import { usersAPI, contactsAPI, aiAPI } from '../../services/api';
import DatePicker from '../common/DatePicker';
import { formatDateForInput, convertLocalDateTimeToUTC } from '../../utils/dateUtils';
import IconButton from '../common/IconButton';
import SearchableDropdown from '../common/SearchableDropdown';
import { FaTimes, FaCheck, FaMagic, FaUser, FaUserFriends, FaInfoCircle } from 'react-icons/fa';
import AIWarning from '../common/AIWarning';

const AddProjectTaskModal = ({ isOpen, onClose, onTaskAdded, projectId }) => {
  const [employees, setEmployees] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignmentType: 'internal', // 'internal' or 'external'
    assigneeId: '',
    externalContactId: '',
    customMessage: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchContacts();
    }
  }, [isOpen]);

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

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      assignmentType: 'internal',
      assigneeId: '',
      externalContactId: '',
      customMessage: ''
    });
    setError(null);
    onClose();
  };

  const handleAiHelp = async () => {
    if (!formData.title.trim() && !formData.description.trim()) {
      setError('Please enter a title or description for the AI to help you.');
      return;
    }

    setIsAiLoading(true);
    setError(null);
    try {
      const response = await aiAPI.extractTasks({
        text: `Based on this: Title: ${formData.title}, Description: ${formData.description}. Provide one detailed task with title, description, and suggested priority.`
      });

      if (response.data && response.data.tasks && response.data.tasks.length > 0) {
        const aiTask = response.data.tasks[0];
        setFormData(prev => ({
          ...prev,
          title: aiTask.title || prev.title,
          description: aiTask.description || prev.description,
          priority: aiTask.priority || prev.priority
        }));
      }
    } catch (err) {
      console.error('AI Help error:', err);
      setError('Failed to get AI help. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    // Validate due date is required and in the future
    if (!formData.dueDate || !formData.dueDate.trim()) {
      setError('Due date is required');
      return;
    }

    // If only date is provided (no time), set default time to 11:59 PM for validation
    let dateToCheck = formData.dueDate;
    if (!dateToCheck.includes('T') || (dateToCheck.includes('T') && !dateToCheck.includes(':'))) {
      const datePart = dateToCheck.split('T')[0];
      dateToCheck = `${datePart}T23:59:00`;
    }

    const selectedDate = new Date(dateToCheck);
    const now = new Date();
    if (isNaN(selectedDate.getTime())) {
      setError('Invalid due date format');
      return;
    }
    if (selectedDate <= now) {
      setError('Due date must be in the future');
      return;
    }

    if (formData.assignmentType === 'internal' && !formData.assigneeId) {
      setError('Please select an employee');
      return;
    }

    if (formData.assignmentType === 'external' && !formData.externalContactId) {
      setError('Please select an external contact');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        dueDate: convertLocalDateTimeToUTC(formData.dueDate),
        assigneeId: formData.assignmentType === 'internal' ? parseInt(formData.assigneeId) : null,
        externalContactId: formData.assignmentType === 'external' ? parseInt(formData.externalContactId) : null,
        customMessage: formData.customMessage || null
      };

      await onTaskAdded(taskData);
      handleClose();
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err.response?.data?.error || 'Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div
        className="modal-box max-w-2xl border"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Add Task to Project
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Fill in the details to add a new task draft to this project.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            ✕
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error mb-4 py-2 min-h-0 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side: Task Info */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Task Title *
                </label>
                <button
                  type="button"
                  onClick={handleAiHelp}
                  disabled={isAiLoading || (!formData.title && !formData.description)}
                  className="btn btn-xs btn-ghost text-indigo-400 hover:text-indigo-300 gap-1"
                >
                  {isAiLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FaMagic className="text-xs" />
                  )}
                  {isAiLoading ? 'Improving...' : 'AI Help'}
                </button>
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input input-bordered w-full"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="Enter task title"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="textarea textarea-bordered w-full h-32"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="What needs to be done?"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Due Date *
                </label>
                <DatePicker
                  value={formData.dueDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  placeholder="Select due date"
                  showTime={false}
                  timeOptional={true}
                  minDate={formatDateForInput(new Date())}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Priority
                </label>
                <div className="flex gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${formData.priority === p
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-transparent bg-var(--color-bg-tertiary) text-var(--color-text-tertiary)'
                        }`}
                      style={{
                        backgroundColor: formData.priority === p ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-bg-tertiary)',
                        borderColor: formData.priority === p ? '#6366f1' : 'var(--color-border-default)',
                        color: formData.priority === p ? '#818cf8' : 'var(--color-text-secondary)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Assignment */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Who will work on this? *
              </label>

              <div className="flex bg-var(--color-bg-tertiary) rounded-lg p-1 mb-4" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, assignmentType: 'internal', externalContactId: '' }))}
                  className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 text-xs font-medium transition-all ${formData.assignmentType === 'internal'
                    ? 'bg-var(--color-bg-secondary) shadow-sm text-indigo-400'
                    : 'text-var(--color-text-tertiary)'
                    }`}
                  style={{
                    backgroundColor: formData.assignmentType === 'internal' ? 'var(--color-bg-secondary)' : 'transparent',
                    color: formData.assignmentType === 'internal' ? '#818cf8' : 'var(--color-text-secondary)'
                  }}
                >
                  <FaUser className="text-xs" /> Internal
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, assignmentType: 'external', assigneeId: '' }))}
                  className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 text-xs font-medium transition-all ${formData.assignmentType === 'external'
                    ? 'bg-var(--color-bg-secondary) shadow-sm text-emerald-400'
                    : 'text-var(--color-text-tertiary)'
                    }`}
                  style={{
                    backgroundColor: formData.assignmentType === 'external' ? 'var(--color-bg-secondary)' : 'transparent',
                    color: formData.assignmentType === 'external' ? '#34d399' : 'var(--color-text-secondary)'
                  }}
                >
                  <FaUserFriends className="text-xs" /> External
                </button>
              </div>

              <div>
                <SearchableDropdown
                  options={formData.assignmentType === 'internal'
                    ? employees.map(e => ({ id: e.id, name: e.name, email: e.email }))
                    : contacts.map(c => ({ id: c.id, name: c.name, email: c.email, company: c.company }))
                  }
                  value={formData.assignmentType === 'internal' ? formData.assigneeId : formData.externalContactId}
                  onChange={(val) => setFormData(prev => ({
                    ...prev,
                    [formData.assignmentType === 'internal' ? 'assigneeId' : 'externalContactId']: val
                  }))}
                  placeholder={formData.assignmentType === 'internal' ? "Select employee..." : "Select contact..."}
                  label=""
                />
              </div>
            </div>

            {formData.assignmentType === 'external' && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Optional message to include
                </label>
                <textarea
                  value={formData.customMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                  className="textarea textarea-bordered w-full h-24 text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Add a personal note (optional)"
                />
              </div>
            )}

            <AIWarning
              message="AI suggestions are based on title and description. Always review before saving."
              className="mt-auto"
            />

            <div
              className="p-3 rounded-lg border mt-4"
              style={{
                backgroundColor: 'var(--color-bg-quaternary)',
                borderColor: 'var(--color-border-light)'
              }}
            >
              <div className="flex gap-2">
                <FaInfoCircle className="text-indigo-400 mt-1 shrink-0" />
                <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                  This task will be saved as a <span className="text-indigo-400 font-bold">draft</span>.
                  You'll need to send it from the project dashboard for the assignee to receive it.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <IconButton
            onClick={handleClose}
            icon={<FaTimes />}
            label="Cancel"
            variant="secondary"
            size="sm"
            disabled={isLoading}
          />

          <IconButton
            onClick={handleSubmit}
            icon={<FaCheck />}
            label={isLoading ? 'Saving...' : 'Add Task Draft'}
            variant="primary"
            size="sm"
            disabled={isLoading || isAiLoading}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default AddProjectTaskModal;
