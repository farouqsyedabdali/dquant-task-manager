import { useState, useEffect, useMemo } from 'react';
import { taskShareAPI, usersAPI } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';
import AddContactModal from '../common/AddContactModal';
import IconButton from '../common/IconButton';
import useAuthStore from '../../context/authStore';
import useContactStore from '../../stores/contactStore';
import { FaShare, FaTimes } from 'react-icons/fa';

const TaskShareModal = ({ isOpen, onClose, task, onShareUpdate }) => {
  const { user } = useAuthStore();
  const { contacts, fetchContacts } = useContactStore();
  const [users, setUsers] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(''); // Unified field for user_id or contact_id
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState(null);
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  useEffect(() => {
    if (isOpen && task) {
      if (!isPersonalAccount) {
        fetchUsers();
      }
      fetchContacts(); // Now uses the store's fetchContacts
      fetchTaskShares();
    }
  }, [isOpen, task, isPersonalAccount, fetchContacts]);

  // Unified list of all available recipients (employees + contacts)
  const allRecipients = useMemo(() => {
    const recipientOptions = [];

    // Add employees (if not personal account)
    if (!isPersonalAccount) {
      const employeeOptions = users
        .filter(user => {
          const isAssignee = user.id === task?.assigneeId;
          const isCoAssignee = task?.coAssignees?.some(co => co.userId === user.id);
          const isShared = sharedWith.some(share => share.userId === user.id);

          return !isAssignee && !isCoAssignee && !isShared;
        })
        .map(user => ({
          id: `user_${user.id}`,
          name: user.name,
          email: user.email,
          displayName: user.name,
          type: 'user'
        }));

      recipientOptions.push(...employeeOptions);
    }

    // Add contacts
    const contactOptions = contacts
      .filter(contact => {
        const isAlreadyShared = sharedWith.some(share => share.contactId === contact.id);
        return !isAlreadyShared;
      })
      .map(contact => ({
        id: `contact_${contact.id}`,
        name: contact.name,
        email: contact.email,
        displayName: contact.name,
        type: 'contact',
        isPersonal: contact.isPersonal
      }));

    recipientOptions.push(...contactOptions);

    return recipientOptions;
  }, [
    JSON.stringify(users.map(u => ({id: u.id, name: u.name}))),
    JSON.stringify(contacts.map(c => ({id: c.id, name: c.name}))),
    JSON.stringify(sharedWith.map(s => ({userId: s.userId, contactId: s.contactId}))),
    task?.assigneeId,
    JSON.stringify(task?.coAssignees?.map(c => c.userId) || []),
    isPersonalAccount
  ]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await usersAPI.getEmployees();
      setUsers(response.data);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
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

  const handleAddNewContact = (email) => {
    setPendingEmail(email);
    setIsAddContactModalOpen(true);
  };

  const handleContactAdded = async (newContact) => {
    await fetchContacts();
    setSelectedRecipient(`contact_${newContact.id}`);
    setIsAddContactModalOpen(false);
    setPendingEmail('');
  };

  const handleShare = async () => {
    if (!task) return;

    // Validate selection
    if (!selectedRecipient) {
      setError('Please select a recipient');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (selectedRecipient) {
        // Share with selected user/contact
        if (selectedRecipient.startsWith('user_')) {
          // Share with internal employee
          const userId = selectedRecipient.split('_')[1];
          await taskShareAPI.shareTask(task.id, userId, 'COMMENTER');
        } else if (selectedRecipient.startsWith('contact_')) {
          // Share with existing contact
          const contactId = selectedRecipient.split('_')[1];
          await taskShareAPI.shareTaskWithContact(task.id, contactId, 'COMMENTER');
        }
      }

      // Refresh the shared users list
      await fetchTaskShares();

      // Notify parent component
      if (onShareUpdate) {
        onShareUpdate();
      }

      // Reset form
      setSelectedRecipient('');
    } catch (error) {
      console.error('Error sharing task:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to share task';
      console.error('Error details:', {
        status: error.response?.status,
        error: errorMessage,
        taskId: task.id,
        selectedRecipient
      });
      setError(errorMessage);
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
    setSelectedRecipient('');
    setError(null);
    onClose();
  };

  if (!isOpen || !task) return null;

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200" 
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

          {/* Recipient Selection */}
          <div>
            <label
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Share with
            </label>

            <div className="space-y-2">
              <SearchableDropdown
                options={allRecipients}
                value={selectedRecipient}
                onChange={setSelectedRecipient}
                placeholder="Select an employee or contact..."
                className="w-full"
                disabled={isLoadingUsers}
                allowAddNew={!isPersonalAccount}
                onAddNew={handleAddNewContact}
                renderOption={(recipient) => (
                  <div className="flex items-center space-x-2 w-full overflow-hidden">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full ${recipient.type === 'contact' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <span className="truncate font-medium">{recipient.displayName || recipient.name}</span>
                    <span className="truncate flex-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>({recipient.email})</span>
                    {recipient.type === 'contact' && (
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded" style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        External
                      </span>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Share Button */}
          <div className="flex justify-end">
            <IconButton
              icon={<FaShare />}
              label={isLoading ? 'Sharing...' : 'Share'}
              variant="primary"
              size="sm"
              onClick={handleShare}
              disabled={isLoading || !selectedRecipient}
              loading={isLoading}
            />
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
              {sharedWith.filter(share => share.user?.name || share.contact?.name || share.email).map((share) => (
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
                        <span className="text-xs">{(share.user?.name || share.contact?.name || share.email).charAt(0)}</span>
                      </div>
                    </div>
                    <div>
                      <span 
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {share.user?.name || share.contact?.name || share.email}
                      </span>
                    </div>
                  </div>
                  <IconButton
                    label="Remove"
                    variant="danger"
                    size="sm"
                    iconOnly={true}
                    onClick={() => handleUnshare(share.userId || share.contactId)}
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <IconButton
            label="Close"
            variant="ghost"
            size="sm"
            onClick={handleClose}
          />
        </div>
      </div>
    </div>

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
  </>
);
};

export default TaskShareModal;

