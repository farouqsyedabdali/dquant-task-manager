import { useState, useEffect } from 'react';
import IconButton from '../common/IconButton';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaTimes, FaGoogle, FaSearch, FaCheck, FaUserFriends, FaEnvelope } from 'react-icons/fa';
import useGoogleContactsStore from '../../stores/googleContactsStore';
import { useToast } from '../../hooks/useToast';

const GoogleContactsModal = ({ isOpen, onClose, taskId, onInvitationsSent }) => {
  const [currentView, setCurrentView] = useState('connect'); // 'connect', 'contacts', 'select', 'sending', 'success'
  const [customMessage, setCustomMessage] = useState('');
  const { showToast } = useToast();

  const {
    contacts,
    isLoading,
    error,
    accessStatus,
    searchTerm,
    selectedContacts,
    pagination,
    fetchAccessStatus,
    fetchContacts,
    searchContacts,
    loadMoreContacts,
    connectGoogleAccount,
    toggleContactSelection,
    selectAllContacts,
    deselectAllContacts,
    getSelectedContacts,
    getSelectedCount,
    clearState
  } = useGoogleContactsStore();

  useEffect(() => {
    if (isOpen) {
      initializeModal();
    } else {
      clearState();
      setCurrentView('connect');
    }
  }, [isOpen]);

  // Check for successful Google auth return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('googleAuth') === 'success') {
      // Clear the URL parameter and reinitialize
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      initializeModal();
    }
  }, []);

  const initializeModal = async () => {
    const status = await fetchAccessStatus();
    console.log('Modal initialize - access status:', status);

    if (status?.hasAccess) {
      console.log('User has full access, showing contacts');
      setCurrentView('contacts');
      await fetchContacts({ limit: 50 });
    } else if (status?.needsContactsPermission) {
      console.log('User needs contacts permission, showing connect view');
      // User has basic Google auth but needs contacts permission
      setCurrentView('connect');
    } else {
      console.log('User needs basic Google auth, showing connect view');
      // User doesn't have Google auth at all
      setCurrentView('connect');
    }
  };

  const handleConnectGoogle = async () => {
    // Determine what type of connection is needed
    let forContacts = false;

    if (accessStatus.needsContactsPermission) {
      // User has basic Google auth but needs contacts permission
      forContacts = true;
    } else if (!accessStatus.isGoogleUser) {
      // User has no Google auth at all
      forContacts = false;
    } else {
      // User has Google auth but we're not sure about contacts
      forContacts = false;
    }

    console.log('Modal handleConnectGoogle:', {
      accessStatus,
      forContacts,
      isGoogleUser: accessStatus.isGoogleUser,
      needsContactsPermission: accessStatus.needsContactsPermission
    });

    const result = await connectGoogleAccount(forContacts);

    if (result.needsBasicAuth) {
      // User needs to authenticate with Google first
      // They'll be redirected to /auth/google
      return;
    }

    if (result.needsRedirect) {
      // User will be redirected to Google OAuth
      return;
    }

    if (result.alreadyConnected) {
      setCurrentView('contacts');
      await fetchContacts({ limit: 50 });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await searchContacts(searchTerm);
  };

  const handleSendInvitations = async () => {
    if (getSelectedCount() === 0) {
      showToast('Please select at least one contact', 'error');
      return;
    }

    if (getSelectedCount() > 20) {
      showToast('You can only send invitations to 20 contacts at a time', 'error');
      return;
    }

    setCurrentView('sending');

    try {
      const selectedIds = Array.from(selectedContacts);
      const response = await fetch(`/api/google-contacts/tasks/${taskId}/send-google-invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          googleContactIds: selectedIds,
          message: customMessage.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitations');
      }

      setCurrentView('success');

      if (onInvitationsSent) {
        onInvitationsSent(data.results);
      }

      showToast(`Successfully sent ${data.results.successful.length} invitation${data.results.successful.length !== 1 ? 's' : ''}!`, 'success');

    } catch (error) {
      console.error('Error sending invitations:', error);
      showToast(error.message || 'Failed to send invitations', 'error');
      setCurrentView('contacts');
    }
  };

  const renderConnectView = () => (
    <div className="text-center py-8">
      <div className="mb-6">
        <FaGoogle className="text-6xl text-blue-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Connect Google Contacts
        </h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {accessStatus.needsContactsPermission
            ? "Grant access to your Google contacts to send invitations"
            : "Import your Google contacts and send task invitations instantly"
          }
        </p>
      </div>

      {accessStatus.needsReconnect && (
        <div className="alert alert-warning mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Your Google account needs to be reconnected to access contacts.</span>
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleConnectGoogle}
          className="btn btn-primary btn-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              {accessStatus.needsContactsPermission ? 'Requesting Access...' : 'Connecting...'}
            </>
          ) : (
            <>
              <FaGoogle className="mr-2" />
              {accessStatus.needsContactsPermission ? 'Grant Contacts Access' : 'Connect Google Account'}
            </>
          )}
        </button>

        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          {accessStatus.needsContactsPermission
            ? "This will request additional permission to access your Google contacts"
            : "This will request permission to read your Google contacts"
          }
        </p>
      </div>
    </div>
  );

  const renderContactsView = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Select Contacts
        </h3>
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {getSelectedCount()} selected
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => searchContacts(e.target.value)}
            className="input input-bordered w-full pr-10"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FaSearch />
          </button>
        </div>
      </form>

      {/* Selection Controls */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={selectAllContacts}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Select All
        </button>
        <button
          onClick={deselectAllContacts}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Deselect All
        </button>
      </div>

      {/* Contacts List */}
      <div className="max-h-96 overflow-y-auto">
        {contacts.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <FaUserFriends className="text-4xl mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {searchTerm ? 'No contacts match your search' : 'No contacts found'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.googleId}
                onClick={() => toggleContactSelection(contact.googleId)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedContacts.has(contact.googleId) ? 'bg-blue-100 dark:bg-blue-900' : ''
                }`}
                style={{
                  backgroundColor: selectedContacts.has(contact.googleId)
                    ? 'var(--color-bg-accent)'
                    : 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-default)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {contact.photoUrl ? (
                      <img
                        src={contact.photoUrl}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                      >
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {contact.name}
                    </p>
                    <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {contact.email}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {selectedContacts.has(contact.googleId) ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 rounded" style={{ borderColor: 'var(--color-border-default)' }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {pagination.hasMore && !isLoading && (
          <div className="text-center mt-4">
            <button
              onClick={loadMoreContacts}
              className="btn btn-outline btn-sm"
            >
              Load More Contacts
            </button>
          </div>
        )}
      </div>

      {/* Custom Message */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Custom Message (Optional)
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Add a personal message to your invitation..."
          className="textarea textarea-bordered w-full"
          rows={3}
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
    </div>
  );

  const renderSendingView = () => (
    <div className="text-center py-8">
      <LoadingSpinner size="lg" />
      <h3 className="text-xl font-bold mt-4 mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Sending Invitations...
      </h3>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Please wait while we send {getSelectedCount()} invitation{getSelectedCount() !== 1 ? 's' : ''}
      </p>
    </div>
  );

  const renderSuccessView = () => (
    <div className="text-center py-8">
      <FaCheck className="text-6xl text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Invitations Sent!
      </h3>
      <p style={{ color: 'var(--color-text-secondary)' }} className="mb-6">
        Your task invitations have been sent successfully.
      </p>
      <button
        onClick={onClose}
        className="btn btn-primary"
      >
        Done
      </button>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'connect':
        return renderConnectView();
      case 'contacts':
        return renderContactsView();
      case 'sending':
        return renderSendingView();
      case 'success':
        return renderSuccessView();
      default:
        return renderConnectView();
    }
  };

  const canSendInvitations = currentView === 'contacts' && getSelectedCount() > 0 && getSelectedCount() <= 20;

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div
        className="modal-box max-w-2xl border transition-colors duration-200"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-2xl font-bold transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <FaEnvelope className="inline mr-2" />
            Invite Google Contacts
          </h2>
          <IconButton
            onClick={onClose}
            icon={<FaTimes />}
            label="Close"
            variant="ghost"
            size="sm"
          />
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

        {/* Content */}
        <div className="mb-6">
          {renderContent()}
        </div>

        {/* Actions */}
        {currentView === 'contacts' && (
          <div className="modal-action">
            <button
              onClick={onClose}
              className="btn"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border-default)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvitations}
              disabled={!canSendInvitations || isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Sending...
                </>
              ) : (
                <>
                  <FaEnvelope className="mr-2" />
                  Send {getSelectedCount()} Invitation{getSelectedCount() !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleContactsModal;