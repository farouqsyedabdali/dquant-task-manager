import { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import useUserStore from '../../stores/userStore';
import SearchableDropdown from '../common/SearchableDropdown';
import IconButton from '../common/IconButton';
import { FaTimes, FaUserPlus } from 'react-icons/fa';

const AddTeamMemberModal = ({ isOpen, onClose, onAdd, excludeUserIds = [], taskId }) => {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { recentEmployees } = useUserStore();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSelectedUserId('');
    }
  }, [isOpen]);

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

  const handleAdd = async () => {
    if (!selectedUserId || !taskId) return;

    setIsAdding(true);
    try {
      await onAdd(selectedUserId);
      setSelectedUserId('');
      onClose();
    } catch (error) {
      console.error('Error adding team member:', error);
      // Don't close modal on error so user can try again
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  const availableUsers = users.filter(u => 
    !excludeUserIds.some(excludedId => 
      excludedId?.toString() === u.id?.toString()
    )
  );

  return (
    <div className="modal modal-open backdrop-blur-sm" onClick={onClose}>
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
              Select Team Member
            </label>
            <div className="min-h-[300px]">
              <SearchableDropdown
                options={availableUsers}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Search for a team member..."
                disabled={isLoadingUsers}
                recentEmployees={recentEmployees}
              />
              {availableUsers.length === 0 && !isLoadingUsers && (
                <p 
                  className="text-sm mt-4 transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  No available team members to add
                </p>
              )}
            </div>
          </div>
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
            disabled={!selectedUserId || isAdding}
            loading={isAdding}
          />
        </div>
      </div>
    </div>
  );
};

export default AddTeamMemberModal;

