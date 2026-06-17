import { useState, useEffect, useMemo, useCallback } from 'react';
import { usersAPI } from '../../services/api';
import useUserStore from '../../stores/userStore';
import useAuthStore from '../../context/authStore';
import useContactStore from '../../stores/contactStore';
import SearchableDropdown from '../common/SearchableDropdown';
import AddContactModal from '../common/AddContactModal';
import IconButton from '../common/IconButton';
import { FaTimes, FaUserPlus } from 'react-icons/fa';

const AddTeamMemberModal = ({ isOpen, onClose, onAdd, excludeUserIds = [], excludeContactIds = [], taskId, contacts = [] }) => {

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [selectedType, setSelectedType] = useState(''); // 'user' or 'contact'
  const [selectedRole, setSelectedRole] = useState('co-assignee'); // 'co-assignee', 'lead-assignee', 'viewer'
  const [isAdding, setIsAdding] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const { recentEmployees } = useUserStore();
  const { user } = useAuthStore();
  const { fetchContacts } = useContactStore();
  const [allContacts, setAllContacts] = useState([]);
  const [hasInitializedContacts, setHasInitializedContacts] = useState(false);
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  useEffect(() => {
    if (isOpen && !hasInitializedContacts) {
      setHasInitializedContacts(true);
      fetchUsers();
      // Always use the contacts prop if available, otherwise fetch our own
      if (contacts && contacts.length > 0) {
        setAllContacts(contacts);
      } else {
        fetchAllContacts();
      }
      setSelectedId('');
      setSelectedType('');
      setSelectedRole('co-assignee');
    } else if (!isOpen) {
      // Reset initialization flag when modal closes
      setHasInitializedContacts(false);
    }
  }, [isOpen, hasInitializedContacts, contacts]); // Include contacts in dependency

  // Memoized values - must be called before any early returns
  const availableUsers = useMemo(() => users.filter(u =>
    !excludeUserIds.some(excludedId =>
      excludedId?.toString() === u.id?.toString()
    )
  ), [users, excludeUserIds]);

  const availableContacts = useMemo(() => allContacts.filter(c =>
    !excludeContactIds.some(excludedId =>
      excludedId?.toString() === c.id?.toString()
    )
  ), [allContacts, excludeContactIds]);

  // Combine users and contacts into a unified list
  const allOptions = useMemo(() => [
    ...availableUsers.map(u => ({
      ...u,
      type: 'user',
      displayName: u.name,
      email: u.email
    })),
    ...availableContacts.map(c => ({
      ...c,
      type: 'contact',
      displayName: c.name,
      email: c.email
    }))
  ], [availableUsers, availableContacts]);

  const getOptionValue = useCallback((option) => `${option.type}_${option.id}`, []);

  const renderOption = useCallback((option) => (
    <div className="flex items-center space-x-2 w-full overflow-hidden">
      <div className={`flex-shrink-0 w-2 h-2 rounded-full ${option.type === 'contact' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
      <span className="truncate font-medium">{option.displayName || option.name}</span>
      <span
        className="truncate flex-1 text-sm transition-colors duration-200"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        ({option.email})
      </span>
      {option.type === 'contact' && (
        <span
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded transition-colors duration-200"
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

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await usersAPI.getEmployees();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchAllContacts = async () => {
    try {
      const result = await fetchContacts();
      if (result.success) {
        setAllContacts(result.data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleAddNewContact = (email) => {
    setPendingEmail(email);
    setIsAddContactModalOpen(true);
  };

  const handleContactAdded = async (newContact) => {
    // Refresh contacts to include the new one
    await fetchAllContacts();
    // Set the selected contact
    setSelectedId(newContact.id.toString());
    setSelectedType('contact');
    setIsAddContactModalOpen(false);
    setPendingEmail('');
  };

  const handleAdd = async () => {
    if (!selectedId || !taskId) return;

    setIsAdding(true);
    try {
      await onAdd(selectedId, selectedType, selectedRole);
      setSelectedId('');
      setSelectedType('');
      setSelectedRole('co-assignee');
      onClose();
    } catch (error) {
      console.error('Error adding team member:', error);
      // Don't close modal on error so user can try again
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div 
        className="modal-box max-w-2xl w-full border transition-all duration-300 animate-fadeIn"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
          minHeight: '500px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 
            className="text-2xl font-bold transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Add Team Member
          </h3>
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

        {/* Content */}
        <div className="space-y-6 py-4">
          <div>
            <label 
              className="block text-base font-medium mb-3 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Select Team Member or Contact
            </label>
            <div className="min-h-[200px]">
              <SearchableDropdown
                options={allOptions}
                value={selectedId ? `${selectedType}_${selectedId}` : ''}
                onChange={(compositeValue) => {
                  // Parse composite value (e.g., "user_123" or "contact_456")
                  const [type, id] = compositeValue.split('_');
                  setSelectedId(id);
                  setSelectedType(type);
                }}
                placeholder="Search for a team member or contact..."
                disabled={isLoadingUsers}
                recentEmployees={recentEmployees}
                renderOption={renderOption}
                getOptionValue={getOptionValue}
                allowAddNew={!isPersonalAccount}
                onAddNew={handleAddNewContact}
              />
              {allOptions.length === 0 && !isLoadingUsers && (
                <p 
                  className="text-sm mt-4 transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  No available team members or contacts to add
                </p>
              )}
            </div>
          </div>

          {/* Role Selection - Only show if someone is selected */}
          {selectedId && (
            <div>
              <label 
                className="block text-base font-medium mb-3 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
              Select Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
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
                <option value="co-assignee">Co-assignee</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="modal-action">
          <IconButton
            icon={<FaTimes />}
            label="Cancel"
            variant="ghost"
            onClick={onClose}
            disabled={isAdding}
          />
          <IconButton
            icon={<FaUserPlus />}
            label={isAdding ? 'Adding...' : 'Add Member'}
            variant="primary"
            onClick={handleAdd}
            disabled={!selectedId || isAdding}
            loading={isAdding}
          />
        </div>
      </div>

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
  );
};

export default AddTeamMemberModal;

