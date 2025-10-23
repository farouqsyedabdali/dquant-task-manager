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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Share Task</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            "{task.title}"
          </h3>
          <p className="text-gray-400 text-sm">
            Share this task with team members or external contacts
          </p>
        </div>

        {error && (
          <div className="alert alert-error text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Recipient Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Share with
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setRecipientType('internal')}
                className={`btn btn-sm ${recipientType === 'internal' ? 'btn-primary' : 'btn-outline'}`}
                disabled={isPersonalAccount}
              >
                Internal Employee
              </button>
              <button
                onClick={() => setRecipientType('external')}
                className={`btn btn-sm ${recipientType === 'external' ? 'btn-primary' : 'btn-outline'}`}
              >
                External Contact
              </button>
            </div>
            {isPersonalAccount && (
              <p className="text-xs text-gray-400 mt-1">
                Personal accounts can only share with external contacts
              </p>
            )}
          </div>

          {/* Permission Level Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Permission Level
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setPermissionLevel('VIEWER')}
                className={`btn btn-sm ${permissionLevel === 'VIEWER' ? 'btn-primary' : 'btn-outline'}`}
              >
                Viewer
              </button>
              <button
                onClick={() => setPermissionLevel('COMMENTER')}
                className={`btn btn-sm ${permissionLevel === 'COMMENTER' ? 'btn-primary' : 'btn-outline'}`}
              >
                Commenter
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {permissionLevel === 'VIEWER' 
                ? 'Can only view the task' 
                : 'Can view and comment on the task'
              }
            </p>
          </div>

          {/* Recipient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      <span className="text-gray-400">({contact.email})</span>
                    </div>
                  )}
                />
                <div className="text-center text-gray-400 text-sm">OR</div>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="input input-bordered w-full bg-gray-700 border-gray-600 text-white"
                />
              </div>
            )}
          </div>

          {/* Share Button */}
          <div className="flex justify-end">
            <button
              onClick={handleShare}
              disabled={isLoading || (recipientType === 'internal' && !selectedUserId) || (recipientType === 'external' && !selectedContactId && !recipientEmail.trim())}
              className="btn btn-primary"
            >
              {isLoading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>

        {/* Currently Shared With */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Currently Shared With
          </h4>
          {isLoadingShares ? (
            <div className="text-gray-400 text-sm">Loading...</div>
          ) : sharedWith.length === 0 ? (
            <div className="text-gray-400 text-sm">No one yet</div>
          ) : (
            <div className="space-y-2">
              {sharedWith.map((share) => (
                <div key={share.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                  <div className="flex items-center space-x-2">
                    <div className="avatar placeholder">
                      <div className="bg-indigo-600 text-white rounded-full w-6">
                        <span className="text-xs">{share.user?.name?.charAt(0) || share.contact?.name?.charAt(0) || '?'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-white text-sm">
                        {share.user?.name || share.contact?.name || share.email}
                      </span>
                      <span className="text-gray-400 text-xs ml-2">
                        ({share.permissionLevel || 'VIEWER'})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnshare(share.userId || share.contactId)}
                    disabled={isLoading}
                    className="btn btn-ghost btn-xs text-red-400 hover:text-red-300"
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
            className="btn btn-ghost"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskShareModal;

