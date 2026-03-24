import { useState, useEffect, useMemo } from 'react';
import useTaskStore from '../../stores/taskStore';
import useUserStore from '../../stores/userStore';
import useAuthStore from '../../context/authStore';
import useContactStore from '../../stores/contactStore';
import { PRIORITY_OPTIONS, getDefaultDueDate } from '../../utils/constants';
import { convertLocalDateTimeToUTC } from '../../utils/dateUtils';
import { usersAPI } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';
import AddContactModal from '../common/AddContactModal';
import IconButton from '../common/IconButton';
import DatePicker from '../common/DatePicker';
import AIWarning from '../common/AIWarning';
import { FaTimes, FaPlus, FaSave } from 'react-icons/fa';
import { tialzFavicon } from '../../hooks/useThemeLogo';
import { aiAPI, projectsAPI } from '../../services/api';
import { useToastContext } from '../../context/ToastContext';

const AddTaskModal = ({ isOpen, onClose, initialData = null, projectId = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignee: '', // Will store as "type_id" format (e.g., "user_123" or "contact_456")
    dueDate: getDefaultDueDate()
  });
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [isPreFilling, setIsPreFilling] = useState(false);
  const [showAIWarning, setShowAIWarning] = useState(false);

  const { createTask, isLoading } = useTaskStore();
  const { recentEmployees, addToRecentEmployees } = useUserStore();
  const { user } = useAuthStore();
  const { fetchContacts } = useContactStore();
  const toast = useToastContext();

  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  useEffect(() => {
    if (isOpen) {
      if (!isPersonalAccount) {
        fetchUsers();
      }
      fetchContactsForAssignment();
    }
  }, [isOpen, isPersonalAccount, user?.id]); // Only depend on user.id, not the whole user object

  const fetchContactsForAssignment = async () => {
    setIsLoadingContacts(true);
    try {
      const result = await fetchContacts();
      if (result.success) {
        setContacts(result.data.contacts || []);
      }
    } catch (error) {
      console.error('❌ Error fetching contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

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
          assignee: `user_${matchingUser.id.toString()}`
        }));
      }
    }
  }, [initialData, users, isOpen]);

  // Set default assignee to current user when users are loaded and no assignee is set (company accounts only)
  useEffect(() => {
    if (!isPersonalAccount && users.length > 0 && user && isOpen && !formData.assignee) {
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          assignee: `user_${currentUser.id.toString()}`
        }));
      }
    }
  }, [users, user, isOpen, formData.assignee, isPersonalAccount]);

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

  // Create unified assignee list combining users and contacts
  const allAssignees = useMemo(() => {
    const assignees = [];

    // Add employees (for company accounts)
    if (!isPersonalAccount) {
      users.forEach(user => {
        assignees.push({
          id: `user_${user.id}`,
          name: user.name,
          email: user.email,
          type: 'user',
          displayName: user.name,
          originalId: user.id
        });
      });
    }

    // Add contacts (for both account types)
    contacts.forEach(contact => {
      assignees.push({
        id: `contact_${contact.id}`,
        name: contact.name,
        email: contact.email,
        type: 'contact',
        displayName: contact.name,
        originalId: contact.id,
        company: contact.company,
        isPersonal: contact.isPersonal
      });
    });

    return assignees;
  }, [users, contacts, isPersonalAccount]);

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

    if (!isPersonalAccount && !formData.assignee) {
      newErrors.assignee = 'Assignee is required';
    }
    // Personal accounts: contact assignment is optional (no validation needed)

    if (formData.description && formData.description.length > 300) {
      newErrors.description = 'Description must be 300 characters or less';
    }

    // Validate due date is required and in the future
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
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.dueDate = 'Due date must be in the future';
      }
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
    let assigneeId = null;
    let externalContactId = null;

    if (formData.assignee) {
      const [type, id] = formData.assignee.split('_');
      if (type === 'user') {
        assigneeId = parseInt(id);
      } else if (type === 'contact') {
        externalContactId = parseInt(id);
      }
    } else if (isPersonalAccount) {
      // For personal accounts, if no assignee selected, assign to self
      assigneeId = user.id;
    }



    // If projectId is provided, use projectsAPI.addTask instead of createTask
    if (projectId) {
      // Prepare data for project task creation (API expects specific fields)
      const projectTaskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigneeId,
        externalContactId,
        dueDate: convertLocalDateTimeToUTC(formData.dueDate)
      };
      
      try {
        await projectsAPI.addTask(projectId, projectTaskData);
        setFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          assignee: !isPersonalAccount && user ? `user_${user.id.toString()}` : '',
          dueDate: getDefaultDueDate()
        });
        setErrors({});
        toast.success('Task added to project as draft!');
        onClose();
      } catch (err) {
        console.error('Error adding task to project:', err);
        toast.error(err.response?.data?.error || 'Failed to add task to project');
      }
    } else {
      // Regular task creation (not in a project)
      const createData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigneeId,
        externalContactId,
        dueDate: convertLocalDateTimeToUTC(formData.dueDate)
      };
      
      const result = await createTask(createData);
      if (result.success) {
        setFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          assignee: !isPersonalAccount && user ? `user_${user.id.toString()}` : '',
          dueDate: getDefaultDueDate()
        });
        setErrors({});
        onClose();
      }
    }
  };

  const handleAddNewContact = (email) => {
    setPendingEmail(email);
    setIsAddContactModalOpen(true);
  };

  const handleContactAdded = (newContact) => {
    // Refresh contacts to include the new one
    fetchContactsForAssignment();
    // Set the assignee to the new contact
    setFormData(prev => ({ ...prev, assignee: `contact_${newContact.id}` }));
    setIsAddContactModalOpen(false);
    setPendingEmail('');
  };

  const handleAIPreFill = async () => {
    setIsPreFilling(true);
    setErrors({});
    
    try {
      // 1. Read clipboard
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText || clipboardText.trim().length === 0) {
        toast.warning('📋 Please copy some text first, then click Smart Pre-fill');
        return;
      }
      
      // 2. Call AI extraction API
      const response = await aiAPI.extractTask(clipboardText);
      
      // 3. Pre-fill form
      if (response.data.success && response.data.taskData) {
        const taskData = response.data.taskData;
        
        // Find matching assignee if AI provided one
        let assigneeValue = formData.assignee;
        if (taskData.assignee && allAssignees.length > 0) {
          const assigneeName = taskData.assignee.toLowerCase();
          const matchingAssignee = allAssignees.find(a => 
            a.name.toLowerCase().includes(assigneeName) || 
            assigneeName.includes(a.name.toLowerCase())
          );
          if (matchingAssignee) {
            assigneeValue = matchingAssignee.id;
          }
        }
        
        setFormData({
          title: taskData.title || formData.title,
          description: taskData.description || formData.description,
          priority: taskData.priority || formData.priority,
          assignee: assigneeValue,
          dueDate: taskData.dueDate || formData.dueDate
        });
        
        toast.success('✨ Task details pre-filled from clipboard!');
        setShowAIWarning(true);
      } else {
        toast.warning('⚠️ Could not extract task details. Please fill manually.');
      }
    } catch (err) {
      console.error('AI Pre-fill error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('📋 Clipboard access denied. Please paste the text manually.');
      } else {
        toast.error('❌ Failed to pre-fill: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setIsPreFilling(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      assignee: !isPersonalAccount && user ? `user_${user.id.toString()}` : '',
      dueDate: getDefaultDueDate()
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div
        className="modal-box max-w-2xl border transition-all duration-300 max-h-[min(92dvh,900px)] flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div>
            <h3
              className="text-2xl font-bold transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Create New Task
            </h3>
          </div>
          <IconButton
            icon={<FaTimes />}
            label="Close"
            iconOnly={true}
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="!p-2 !rounded-full"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable fields — keeps modal height bounded; assign dropdown uses viewport positioning */}
          <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-1 pb-2 scrollbar-thin">
          {/* Title */}
          <div>
            <label
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Title * ({formData.title.length}/50)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={50}
              className={`input w-full transition-colors duration-200 ${errors.title ? 'border-red-500' : ''}`}
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: errors.title ? '#ef4444' : 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                if (!errors.title) {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }
              }}
              onBlur={(e) => {
                if (!errors.title) {
                  e.currentTarget.style.borderColor = 'var(--color-border-default)';
                }
              }}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Description ({formData.description.length}/300)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={300}
              rows={4}
              className="textarea w-full transition-colors duration-200"
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
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Priority and Due Date - Same Line */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Priority
              </label>
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
                {PRIORITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Due Date *
              </label>
              <DatePicker
                value={formData.dueDate || ''}
                onChange={(e) => {
                  handleChange({
                    target: {
                      name: 'dueDate',
                      value: e.target.value
                    }
                  });
                  // Clear error when user selects a date
                  if (errors.dueDate) {
                    setErrors(prev => ({ ...prev, dueDate: '' }));
                  }
                }}
                placeholder="Select due date"
                showTime={false}
                timeOptional={true}
                className={errors.dueDate ? 'border-red-500' : ''}
                style={errors.dueDate ? { borderColor: '#ef4444' } : {}}
              />
              {errors.dueDate && (
                <p className="text-red-400 text-sm mt-1">{errors.dueDate}</p>
              )}
            </div>
          </div>

          {/* Assignee Selection - Show for company accounts */}
          {!isPersonalAccount && (
            <div>
              <label
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Assign To *
              </label>
              <SearchableDropdown
                options={allAssignees}
                value={formData.assignee}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, assignee: value }));
                  // Track the selected employee as recent (only for users)
                  if (value && value.startsWith('user_')) {
                    const userId = value.split('_')[1];
                    const selectedEmployee = users.find(user => user.id.toString() === userId);
                    if (selectedEmployee) {
                      addToRecentEmployees(selectedEmployee);
                    }
                  }
                }}
                placeholder="Select an employee or contact"
                disabled={isLoadingUsers || isLoadingContacts}
                error={!!errors.assignee}
                recentEmployees={recentEmployees}
                getOptionValue={(option) => option.id}
                allowAddNew={!isPersonalAccount}
                onAddNew={handleAddNewContact}
                renderOption={(assignee) => (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${assignee.type === 'contact' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <span>{assignee.displayName}</span>
                    <span
                      className="transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      ({assignee.email})
                    </span>
                    {assignee.company && (
                      <span
                        className="transition-colors duration-200"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        - {assignee.company}
                      </span>
                    )}
                    {assignee.type === 'contact' && (
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
                )}
              />
              {errors.assignee && (
                <p className="text-red-400 text-sm mt-1">{errors.assignee}</p>
              )}
              {(isLoadingUsers || isLoadingContacts) && (
                <p
                  className="text-sm mt-1 transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Loading assignees...
                </p>
              )}
              {allAssignees.length === 0 && !isLoadingUsers && !isLoadingContacts && (
                <p
                  className="text-sm mt-1 transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  No assignees available. <a
                    href="/contacts"
                    className="transition-colors duration-200"
                    style={{ color: 'var(--color-primary-light)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary-light)';
                    }}
                  >
                    Add contacts
                  </a> to assign tasks externally.
                </p>
              )}
            </div>
          )}

          {/* Optional Contact Assignment - Only for personal accounts */}
          {isPersonalAccount && (
            <div>
              <label
                className="block text-sm font-medium mb-2 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Assign to Contact (Optional)
              </label>
              <div className="mb-2">
                <p
                  className="text-sm mb-3 transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Leave blank to assign to yourself, or select a contact to assign to them.
                </p>
                <SearchableDropdown
                  options={allAssignees}
                  value={formData.assignee}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, assignee: value }));
                  }}
                  placeholder="Select a contact (optional)"
                  disabled={isLoadingContacts}
                  error={!!errors.assignee}
                  getOptionValue={(option) => option.id}
                  allowAddNew={true}
                  onAddNew={handleAddNewContact}
                  renderOption={(assignee) => (
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${assignee.type === 'contact' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <span>{assignee.displayName}</span>
                      <span
                        className="transition-colors duration-200"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        ({assignee.email})
                      </span>
                      {assignee.company && (
                        <span
                          className="transition-colors duration-200"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          - {assignee.company}
                        </span>
                      )}
                      {assignee.type === 'contact' && (
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
                  )}
                />
                {errors.assignee && (
                  <p className="text-red-400 text-sm mt-1">{errors.assignee}</p>
                )}
                {isLoadingContacts && (
                  <p
                    className="text-sm mt-1 transition-colors duration-200"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Loading contacts...
                  </p>
                )}
                {allAssignees.length === 0 && !isLoadingContacts && (
                  <p
                    className="text-sm mt-1 transition-colors duration-200"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    No contacts available. <a
                      href="/contacts"
                      className="transition-colors duration-200"
                      style={{ color: 'var(--color-primary-light)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary-light)';
                      }}
                    >
                      Add contacts
                    </a> to assign tasks to them.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* AI Warning Banner */}
          {showAIWarning && (
            <AIWarning className="mb-4" />
          )}
          </div>

          {/* Submit Buttons — sticky at bottom of modal */}
          <div
            className="flex justify-between items-center pt-4 flex-shrink-0 border-t mt-2"
            style={{ borderColor: 'var(--color-border-default)' }}
          >
            <IconButton
              icon={<img src={tialzFavicon} alt="" />}
              label="Smart Pre-fill"
              variant="primary"
              onClick={handleAIPreFill}
              disabled={isLoading || isPreFilling}
              loading={isPreFilling}
              title="Extract task details from clipboard"
            />
            <div className="flex space-x-3">
              <IconButton
                icon={<FaTimes />}
                label="Cancel"
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
              />
              <IconButton
                icon={<FaPlus />}
                label={isLoading ? 'Creating...' : 'Create Task'}
                variant="primary"
                type="submit"
                disabled={isLoading}
                loading={isLoading}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => {
          setIsAddContactModalOpen(false);
          setPendingEmail('');
        }}
        onContactAdded={handleContactAdded}
        initialEmail={pendingEmail}
        message="This person is not in your contact list. Please add them as a contact."
      />
    </div>
  );
};

export default AddTaskModal; 