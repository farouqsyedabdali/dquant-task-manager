import { useState, useEffect } from 'react';
import useTaskStore from '../../stores/taskStore';
import useUserStore from '../../stores/userStore';
import useAuthStore from '../../context/authStore';
import useContactStore from '../../stores/contactStore';
import { PRIORITY_OPTIONS, getDefaultDueDate } from '../../utils/constants';
import { usersAPI } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';
import IconButton from '../common/IconButton';
import DatePicker from '../common/DatePicker';
import { FaTimes, FaPlus, FaSave } from 'react-icons/fa';

const AddTaskModal = ({ isOpen, onClose, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    externalContactId: '',
    dueDate: getDefaultDueDate()
  });
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
   const [assignmentType, setAssignmentType] = useState('internal'); // 'internal', 'external', or 'self'

  const { createTask, isLoading } = useTaskStore();
  const { recentEmployees, addToRecentEmployees } = useUserStore();
  const { user } = useAuthStore();
  const { fetchContacts } = useContactStore();
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

   useEffect(() => {
     if (isOpen && !isPersonalAccount) {
       fetchUsers();
       fetchContactsForAssignment();
       setAssignmentType('internal');
     } else if (isOpen && isPersonalAccount) {
       // For personal accounts, just fetch contacts
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
    
     if (!isPersonalAccount) {
       if (assignmentType === 'internal' && !formData.assigneeId) {
         newErrors.assigneeId = 'Internal assignee is required';
       } else if (assignmentType === 'external' && !formData.externalContactId) {
         newErrors.externalContactId = 'External contact is required';
       }
     }
     // Personal accounts: contact assignment is optional (no validation needed)
    
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
       assigneeId: isPersonalAccount 
         ? (formData.externalContactId ? null : user.id) // If contact selected, assign to contact, otherwise self
         : (assignmentType === 'internal' ? parseInt(formData.assigneeId) : null),
       externalContactId: isPersonalAccount 
         ? (formData.externalContactId ? parseInt(formData.externalContactId) : null)
         : (assignmentType === 'external' ? parseInt(formData.externalContactId) : null),
       dueDate: formData.dueDate || null
     };


    const result = await createTask(createData);
    if (result.success) {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: user ? user.id.toString() : '',
        externalContactId: '',
        dueDate: getDefaultDueDate()
      });
      setAssignmentType('internal');
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
      externalContactId: '',
      dueDate: getDefaultDueDate()
    });
    setAssignmentType('internal');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div 
        className="modal-box max-w-2xl border transition-all duration-300"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
          <h3 
            className="text-2xl font-bold transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Create New Task
          </h3>
            {initialData && (
              <p 
                className="text-sm mt-1 transition-colors duration-200"
                style={{ color: 'var(--color-primary-light)' }}
              >
                ✨ Task details extracted from browser extension
              </p>
            )}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
              Due Date (Optional)
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
              }}
              placeholder="Select due date and time"
              showTime={true}
            />
          </div>

           {/* Assignment Type - Only show for company accounts */}
           {!isPersonalAccount && (
             <div>
               <label 
                 className="block text-sm font-medium mb-2 transition-colors duration-200"
                 style={{ color: 'var(--color-text-secondary)' }}
               >
                 Assignment Type *
               </label>
               <div className="flex space-x-4 mb-4">
                 <label className="flex items-center">
                   <input
                     type="radio"
                     name="assignmentType"
                     value="internal"
                     checked={assignmentType === 'internal'}
                     onChange={(e) => {
                       setAssignmentType(e.target.value);
                       setFormData(prev => ({ ...prev, externalContactId: '' }));
                     }}
                     className="radio radio-primary mr-2"
                   />
                   <span 
                     className="transition-colors duration-200"
                     style={{ color: 'var(--color-text-secondary)' }}
                   >
                     Internal Employee
                   </span>
                 </label>
                 <label className="flex items-center">
                   <input
                     type="radio"
                     name="assignmentType"
                     value="external"
                     checked={assignmentType === 'external'}
                     onChange={(e) => {
                       setAssignmentType(e.target.value);
                       setFormData(prev => ({ ...prev, assigneeId: '' }));
                     }}
                     className="radio radio-primary mr-2"
                   />
                   <span 
                     className="transition-colors duration-200"
                     style={{ color: 'var(--color-text-secondary)' }}
                   >
                     External Contact
                   </span>
                 </label>
               </div>

               {/* Internal Employee Assignment */}
               {assignmentType === 'internal' && (
                <div>
                  <label 
                    className="block text-sm font-medium mb-2 transition-colors duration-200"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Select Employee *
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
                    <p 
                      className="text-sm mt-1 transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      Loading employees...
                    </p>
                  )}
                </div>
              )}

              {/* External Contact Assignment */}
              {assignmentType === 'external' && (
                <div>
                  <label 
                    className="block text-sm font-medium mb-2 transition-colors duration-200"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Select Contact *
                  </label>
                  <SearchableDropdown
                    options={contacts}
                    value={formData.externalContactId}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, externalContactId: value }));
                    }}
                    placeholder="Select a contact"
                    disabled={isLoadingContacts}
                    error={!!errors.externalContactId}
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
                  {errors.externalContactId && (
                    <p className="text-red-400 text-sm mt-1">{errors.externalContactId}</p>
                  )}
                  {isLoadingContacts && (
                    <p 
                      className="text-sm mt-1 transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      Loading contacts...
                    </p>
                  )}
                  {contacts.length === 0 && !isLoadingContacts && (
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
                      </a> to assign tasks externally.
                    </p>
                  )}
                </div>
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
                   options={contacts}
                   value={formData.externalContactId}
                   onChange={(value) => {
                     setFormData(prev => ({ ...prev, externalContactId: value }));
                   }}
                   placeholder="Select a contact (optional)"
                   disabled={isLoadingContacts}
                   error={!!errors.externalContactId}
                   renderOption={(contact) => (
                     <div className="flex items-center space-x-2">
                       <div className={`w-2 h-2 rounded-full ${contact.isPersonal ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                       <span>{contact.name}</span>
                       <span className="text-gray-400">({contact.email})</span>
                       {contact.company && <span className="text-gray-500">- {contact.company}</span>}
                     </div>
                   )}
                 />
                 {errors.externalContactId && (
                   <p className="text-red-400 text-sm mt-1">{errors.externalContactId}</p>
                 )}
                 {isLoadingContacts && (
                   <p 
                     className="text-sm mt-1 transition-colors duration-200"
                     style={{ color: 'var(--color-text-tertiary)' }}
                   >
                     Loading contacts...
                   </p>
                 )}
                 {contacts.length === 0 && !isLoadingContacts && (
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

           {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
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
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal; 