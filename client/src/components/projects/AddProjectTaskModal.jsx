import { useState, useEffect } from 'react';
import { usersAPI, contactsAPI } from '../../services/api';
import DatePicker from '../common/DatePicker';
import { formatDateForInput, convertLocalDateTimeToUTC } from '../../utils/dateUtils';
import IconButton from '../common/IconButton';
import { FaArrowLeft, FaArrowRight, FaTimes, FaCheck } from 'react-icons/fa';

const AddProjectTaskModal = ({ isOpen, onClose, onTaskAdded, projectId }) => {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
    setStep(1);
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

  const handleNext = () => {
    if (step === 1) {
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
        // Date only, add 11:59 PM
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
    }

    if (step === 2) {
      // Validate assignment before moving to review
      if (formData.assignmentType === 'internal' && !formData.assigneeId) {
        setError('Please select an employee');
        return;
      }

      if (formData.assignmentType === 'external' && !formData.externalContactId) {
        setError('Please select an external contact');
        return;
      }
    }

    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
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
      // Date only, add 11:59 PM
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
        dueDate: convertLocalDateTimeToUTC(formData.dueDate), // Convert to UTC for server
        assigneeId: formData.assignmentType === 'internal' ? parseInt(formData.assigneeId) : null,
        externalContactId: formData.assignmentType === 'external' ? parseInt(formData.externalContactId) : null
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
              Step {step} of 3
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
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Task Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Task Title *
              </label>
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
                className="textarea textarea-bordered w-full h-24"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="What needs to be done?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="select select-bordered w-full"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

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
            </div>
          </div>
        )}

        {/* Step 2: Assignment */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Who will work on this task? *
              </label>

              <div className="space-y-4">
                {/* Internal Employee Option */}
                <label
                  className="flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all"
                  style={{
                    backgroundColor: formData.assignmentType === 'internal' ? 'var(--color-bg-tertiary)' : 'transparent',
                    borderColor: formData.assignmentType === 'internal' ? '#6366f1' : 'var(--color-border-default)'
                  }}
                >
                  <input
                    type="radio"
                    name="assignmentType"
                    value="internal"
                    checked={formData.assignmentType === 'internal'}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignmentType: e.target.value }))}
                    className="radio radio-primary mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Internal Employee
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Assign to someone in your company
                    </p>

                    {formData.assignmentType === 'internal' && (
                      <div className="mt-3">
                        <select
                          value={formData.assigneeId}
                          onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                          className="select select-bordered w-full"
                          style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                          required
                        >
                          <option value="">Select employee... *</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} - {emp.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </label>

                {/* External Contact Option */}
                <label
                  className="flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all"
                  style={{
                    backgroundColor: formData.assignmentType === 'external' ? 'var(--color-bg-tertiary)' : 'transparent',
                    borderColor: formData.assignmentType === 'external' ? '#6366f1' : 'var(--color-border-default)'
                  }}
                >
                  <input
                    type="radio"
                    name="assignmentType"
                    value="external"
                    checked={formData.assignmentType === 'external'}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignmentType: e.target.value }))}
                    className="radio radio-primary mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      External Contact
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Send to an external collaborator (they can accept or decline)
                    </p>

                    {formData.assignmentType === 'external' && (
                      <div className="mt-3 space-y-3">
                        <select
                          value={formData.externalContactId}
                          onChange={(e) => setFormData(prev => ({ ...prev, externalContactId: e.target.value }))}
                          className="select select-bordered w-full"
                          style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)',
                          }}
                          required
                        >
                          <option value="">Select contact... *</option>
                          {contacts.map(contact => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name} - {contact.email}
                              {contact.company ? ` (${contact.company})` : ''}
                            </option>
                          ))}
                        </select>

                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                            Optional message to include
                          </label>
                          <textarea
                            value={formData.customMessage}
                            onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                            className="textarea textarea-bordered w-full h-20 text-sm"
                            style={{
                              backgroundColor: 'var(--color-bg-secondary)',
                              borderColor: 'var(--color-border-default)',
                              color: 'var(--color-text-primary)',
                            }}
                            placeholder="Add a personal note (optional)"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Review Task
              </h4>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Title:</span>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{formData.title}</span>
                </div>

                {formData.description && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Description:</span>
                    <span className="font-medium max-w-xs text-right" style={{ color: 'var(--color-text-primary)' }}>
                      {formData.description.length > 100
                        ? formData.description.substring(0, 100) + '...'
                        : formData.description}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Priority:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${formData.priority === 'LOW' ? 'bg-gray-500/20 text-gray-400' :
                    formData.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                      formData.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                    }`}>
                    {formData.priority}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Due Date:</span>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {formData.dueDate
                      ? new Date(formData.dueDate).toLocaleDateString()
                      : <span className="text-error">Required</span>}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Assigned To:</span>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {formData.assignmentType === 'internal' && formData.assigneeId
                      ? employees.find(e => e.id === parseInt(formData.assigneeId))?.name
                      : formData.assignmentType === 'external' && formData.externalContactId
                        ? contacts.find(c => c.id === parseInt(formData.externalContactId))?.name
                        : <span className="text-error">Required</span>}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Type:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${formData.assignmentType === 'internal'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                    {formData.assignmentType === 'internal' ? 'Internal Employee' : 'External Contact'}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-bg-quaternary)',
                borderColor: 'var(--color-border-light)'
              }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-medium">Note:</span> This task will be saved as a <strong>draft</strong>.
                You'll need to send it from the project dashboard for the assignee to receive it.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between mt-8 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <IconButton
            onClick={step === 1 ? handleClose : handleBack}
            icon={step === 1 ? <FaTimes /> : <FaArrowLeft />}
            label={step === 1 ? 'Cancel' : 'Back'}
            variant="secondary"
            size="sm"
            disabled={isLoading}
          />

          <IconButton
            onClick={step === 3 ? handleSubmit : handleNext}
            icon={step === 3 ? <FaCheck /> : <FaArrowRight />}
            label={isLoading ? 'Adding...' : step === 3 ? 'Add Task as Draft' : 'Next'}
            variant="primary"
            size="sm"
            disabled={isLoading}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default AddProjectTaskModal;




