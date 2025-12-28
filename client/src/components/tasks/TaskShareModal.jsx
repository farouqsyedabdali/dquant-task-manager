import { useState, useEffect } from 'react';
import { taskShareAPI, usersAPI, contactsAPI } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';
import useAuthStore from '../../context/authStore';

const TaskShareModal = ({ isOpen, onClose, task, onShareUpdate }) => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientType, setRecipientType] = useState('internal'); // 'internal' or 'external'
  const [permissionLevel, setPermissionLevel] = useState('VIEWER'); // 'VIEWER' or 'COMMENTER'
  const [error, setError] = useState(null);
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  useEffect(() => {
    if (isOpen && task) {
      if (!isPersonalAccount) {
        fetchUsers();
      }
      fetchContacts();
      fetchTaskShares();
    }
  }, [isOpen, task, isPersonalAccount]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getEmployees();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getContacts();
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchTaskShares = async () => {
    if (!task) return;
    
    try {
      setIsLoadingShares(true);
      const response = await taskShareAPI.getTaskShares(task.id);
      setSharedWith(response.data);
    } catch (error) {
      console.error('Error fetching task shares:', error);
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleShare = async () => {
    if (!task) return;
    
    // Validate selection based on recipient type
    if (recipientType === 'internal' && !selectedUserId) {
      setError('Please select an internal employee');
      return;
    }
    
    if (recipientType === 'external' && !selectedContactId && !recipientEmail.trim()) {
      setError('Please select a contact or enter an email address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (recipientType === 'internal') {
        // Share with internal employee
        await taskShareAPI.shareTask(task.id, selectedUserId, permissionLevel);
      } else {
        // Share with external contact/email
        if (selectedContactId) {
          // Share with existing contact
          await taskShareAPI.shareTaskWithContact(task.id, selectedContactId, permissionLevel);
        } else {
          // Share with email address
          await taskShareAPI.shareTaskWithEmail(task.id, recipientEmail, permissionLevel);
        }
      }
      
      // Refresh the shared users list
      await fetchTaskShares();
      
      // Notify parent component
      if (onShareUpdate) {
        onShareUpdate();
      }
      
      // Reset form
      setSelectedUserId('');
      setSelectedContactId('');
      setRecipientEmail('');
      setRecipientType('internal');
      setPermissionLevel('VIEWER');
    } catch (error) {
      console.error('Error sharing task:', error);
      setError(error.response?.data?.error || 'Failed to share task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnshare = async (userId) => {
    if (!task) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await taskShareAPI.unshareTask(task.id, userId);
      
      // Refresh the shared users list
      await fetchTaskShares();
      
      // Notify parent component
      if (onShareUpdate) {
        onShareUpdate();
      }
    } catch (error) {
      console.error('Error unsharing task:', error);
      setError(error.response?.data?.error || 'Failed to unshare task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setSelectedContactId('');
    setRecipientEmail('');
    setRecipientType('internal');
    setPermissionLevel('VIEWER');
    setError(null);
    onClose();
  };

  if (!isOpen || !task) return null;

  // Filter out users who are already shared with, co-assignees, or the lead assignee
  const availableUsers = users.filter(user => 
    user.id !== task.assigneeId && // Not the lead assignee
    !task.coAssignees?.some(co => co.userId === user.id) && // Not a co-assignee
    !sharedWith.some(share => share.userId === user.id) // Not already shared
  );

  // Filter out contacts who are already shared with
  const availableContacts = contacts.filter(contact => 
    !sharedWith.some(share => share.contactId === contact.id)
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200" 
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div 
          className="relative border rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 transition-all duration-300 animate-fadeIn"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 
              className="text-xl font-bold transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Share Task
            </h2>
            <button
              onClick={handleClose}
              className="transition-colors duration-200 hover:opacity-70"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              ✕
            </button>
          </div>

        <div className="mb-4">
          <h3 
            className="text-lg font-semibold mb-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            "{task.title}"
          </h3>
          <p 
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Share this task with team members or external contacts
          </p>
        </div>

        {error && (
          <div 
            className="alert text-sm mb-4 transition-colors duration-200"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#fca5a5'
            }}
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Recipient Type Selection */}
          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Share with
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setRecipientType('internal')}
                className={`btn btn-sm transition-colors duration-200 ${
                  recipientType === 'internal' 
                    ? '!bg-blue-600 hover:!bg-blue-700 !text-white' 
                    : '!bg-transparent !border !text-white'
                }`}
                style={recipientType === 'internal' ? {} : {
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
                disabled={isPersonalAccount}
              >
                Internal Employee
              </button>
              <button
                onClick={() => setRecipientType('external')}
                className={`btn btn-sm transition-colors duration-200 ${
                  recipientType === 'external' 
                    ? '!bg-blue-600 hover:!bg-blue-700 !text-white' 
                    : '!bg-transparent !border !text-white'
                }`}
                style={recipientType === 'external' ? {} : {
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                External Contact
              </button>
            </div>
            {isPersonalAccount && (
              <p 
                className="text-xs mt-1 transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Personal accounts can only share with external contacts
              </p>
            )}
          </div>

          {/* Permission Level Selection */}
          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Permission Level
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setPermissionLevel('VIEWER')}
                className={`btn btn-sm transition-colors duration-200 ${
                  permissionLevel === 'VIEWER' 
                    ? '!bg-blue-600 hover:!bg-blue-700 !text-white' 
                    : '!bg-transparent !border !text-white'
                }`}
                style={permissionLevel === 'VIEWER' ? {} : {
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Viewer
              </button>
              <button
                onClick={() => setPermissionLevel('COMMENTER')}
                className={`btn btn-sm transition-colors duration-200 ${
                  permissionLevel === 'COMMENTER' 
                    ? '!bg-blue-600 hover:!bg-blue-700 !text-white' 
                    : '!bg-transparent !border !text-white'
                }`}
                style={permissionLevel === 'COMMENTER' ? {} : {
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Commenter
              </button>
            </div>
            <p 
              className="text-xs mt-1 transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {permissionLevel === 'VIEWER' 
                ? 'Can only view the task' 
                : 'Can view and comment on the task'
              }
            </p>
          </div>

          {/* Recipient Selection */}
          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {recipientType === 'internal' ? 'Select Employee' : 'Select Contact or Enter Email'}
            </label>
            
            {recipientType === 'internal' ? (
              <SearchableDropdown
                options={availableUsers}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Select an employee..."
                className="w-full"
              />
            ) : (
              <div className="space-y-2">
                <SearchableDropdown
                  options={availableContacts}
                  value={selectedContactId}
                  onChange={setSelectedContactId}
                  placeholder="Select a contact..."
                  className="w-full"
                  renderOption={(contact) => (
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${contact.isPersonal ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <span>{contact.name}</span>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>({contact.email})</span>
                    </div>
                  )}
                />
                <div 
                  className="text-center text-sm transition-colors duration-200"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  OR
                </div>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="input input-bordered w-full transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-default)';
                  }}
                />
              </div>
            )}
          </div>

          {/* Share Button */}
          <div className="flex justify-end">
            <button
              onClick={handleShare}
              disabled={isLoading || (recipientType === 'internal' && !selectedUserId) || (recipientType === 'external' && !selectedContactId && !recipientEmail.trim())}
              className="btn btn-sm transition-colors duration-200 !bg-blue-600 hover:!bg-blue-700 !text-white disabled:!opacity-50"
            >
              {isLoading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>

        {/* Currently Shared With */}
        <div 
          className="mt-6 pt-4 border-t transition-colors duration-200"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <h4 
            className="text-sm font-medium mb-2 transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Currently Shared With
          </h4>
          {isLoadingShares ? (
            <div 
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Loading...
            </div>
          ) : sharedWith.length === 0 ? (
            <div 
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              No one yet
            </div>
          ) : (
            <div className="space-y-2">
              {sharedWith.map((share) => (
                <div 
                  key={share.id} 
                  className="flex items-center justify-between rounded p-2 transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="avatar placeholder">
                      <div 
                        className="text-white rounded-full w-6 transition-colors duration-200"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        <span className="text-xs">{share.user?.name?.charAt(0) || share.contact?.name?.charAt(0) || '?'}</span>
                      </div>
                    </div>
                    <div>
                      <span 
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {share.user?.name || share.contact?.name || share.email}
                      </span>
                      <span 
                        className="text-xs ml-2 transition-colors duration-200"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        ({share.permissionLevel || 'VIEWER'})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnshare(share.userId || share.contactId)}
                    disabled={isLoading}
                    className="btn btn-ghost btn-xs transition-colors duration-200 !text-red-400 hover:!text-red-300 disabled:!opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={handleClose}
            className="btn btn-sm btn-ghost transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default TaskShareModal;

