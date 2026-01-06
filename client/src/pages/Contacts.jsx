import { useState, useEffect } from 'react';
import useContactStore from '../stores/contactStore';
import IconButton from '../components/common/IconButton';
import { FaPlus, FaTimes, FaCheck } from 'react-icons/fa';

const Contacts = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'personal', 'business'
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    contacts,
    isLoading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    getContactDeletionPreview,
    clearError
  } = useContactStore();

  useEffect(() => {
    fetchContacts({ type: filterType, search: searchTerm });
  }, [filterType, searchTerm]);

  // Auto-clear success and error messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleCreateContact = async (contactData) => {
    const result = await createContact(contactData);
    if (result.success) {
      setSuccessMessage('Contact created successfully!');
      setIsAddModalOpen(false);
    } else {
      setErrorMessage(result.error);
    }
  };

  const handleUpdateContact = async (contactData) => {
    const result = await updateContact(editingContact.id, contactData);
    if (result.success) {
      setSuccessMessage('Contact updated successfully!');
      setIsEditModalOpen(false);
      setEditingContact(null);
    } else {
      setErrorMessage(result.error);
    }
  };

  const handleDeleteContact = async (contact) => {
    // Fetch deletion preview
    const previewResult = await getContactDeletionPreview(contact.id);
    if (!previewResult.success) {
      setErrorMessage(previewResult.error);
      return;
    }
    
    // Show warning dialog with affected tasks
    setDeletionPreview(previewResult.data);
    setIsDeleteWarningOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletionPreview) return;
    
    setIsDeleting(true);
    const result = await deleteContact(deletionPreview.contact.id);
    setIsDeleting(false);
    
    if (result.success) {
      const withdrawnCount = result.data?.withdrawnFromTaskCount || 0;
      const unassignedCount = result.data?.unassignedTaskCount || 0;
      const totalCount = withdrawnCount + unassignedCount;
      
      if (totalCount > 0) {
        const parts = [];
        if (withdrawnCount > 0) {
          parts.push(`withdrawn from ${withdrawnCount} task${withdrawnCount !== 1 ? 's' : ''}`);
        }
        if (unassignedCount > 0) {
          parts.push(`unassigned ${unassignedCount} task${unassignedCount !== 1 ? 's' : ''}`);
        }
        setSuccessMessage(`Contact deleted and ${parts.join(' and ')}`);
      } else {
        setSuccessMessage('Contact deleted successfully!');
      }
      setIsDeleteWarningOpen(false);
      setDeletionPreview(null);
    } else {
      setErrorMessage(result.error);
    }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
    // Clear any existing messages when opening edit modal
    setSuccessMessage('');
    setErrorMessage('');
  };

  const filteredContacts = contacts.filter(contact => {
    if (filterType === 'personal') return contact.isPersonal;
    if (filterType === 'business') return !contact.isPersonal;
    return true;
  });

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Contacts
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Manage your personal and business contacts
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select select-bordered"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="all">All Contacts</option>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </select>

          {/* Add Contact Button */}
          <IconButton
            onClick={() => {
              setIsAddModalOpen(true);
              // Clear any existing messages when opening add modal
              setSuccessMessage('');
              setErrorMessage('');
            }}
            icon={<FaPlus />}
            label="Add Contact"
            variant="primary"
            size="sm"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={clearError} className="btn btn-sm btn-ghost">✕</button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="btn btn-sm btn-ghost">✕</button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="btn btn-sm btn-ghost">✕</button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Contacts Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-lg p-6 transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                  borderWidth: 1,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className={`rounded-full flex items-center justify-center flex-shrink-0 ${contact.isPersonal ? 'bg-green-600' : 'bg-blue-600'}`}
                      style={{
                        width: '48px',
                        height: '48px',
                        minWidth: '48px',
                        minHeight: '48px',
                        maxWidth: '48px',
                        maxHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1'
                      }}
                    >
                      <span 
                        className="text-white text-lg"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}
                      >
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {contact.name}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {contact.email}
                      </p>
                      {contact.company && (
                        <p
                          className="text-xs"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {contact.company}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu p-2 shadow rounded-box w-32"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                    >
                      <li>
                        <button
                          onClick={() => handleEditContact(contact)}
                          className="text-white hover:bg-gray-600"
                        >
                          Edit
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleDeleteContact(contact)}
                          className="text-red-400 hover:bg-gray-600"
                        >
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  {contact.phone && (
                    <div
                      className="flex items-center space-x-2 text-sm"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contact.isPersonal 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-blue-900 text-blue-300'
                    }`}>
                      {contact.isPersonal ? 'Personal' : 'Business'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              No contacts found
            </h3>
            <p
              className="mb-4"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first contact'}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              Add Contact
            </button>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <AddContactModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateContact}
        />
      )}

      {/* Edit Contact Modal */}
      {isEditModalOpen && editingContact && (
        <EditContactModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingContact(null);
          }}
          contact={editingContact}
          onSubmit={handleUpdateContact}
        />
      )}

      {/* Delete Warning Dialog */}
      {isDeleteWarningOpen && deletionPreview && (
        <div className="modal modal-open backdrop-blur-sm">
          <div 
            className="modal-box max-w-2xl border transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div className="flex items-start space-x-3 mb-6">
              <div className="flex-shrink-0">
                <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Delete Contact: {deletionPreview.contact.name}?
                </h3>
                <p 
                  className="text-sm mb-4"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {deletionPreview.contact.email}
                </p>
              </div>
            </div>

            {deletionPreview.totalTaskCount > 0 ? (
              <>
                <div 
                  className="rounded-lg p-4 mb-6"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-warning)',
                    borderWidth: '1px',
                  }}
                >
                  {/* Tasks you're assigned to by them */}
                  {deletionPreview.tasksYouAreAssignedTo.length > 0 && (
                    <div className="mb-6">
                      <p 
                        className="font-semibold mb-3 text-blue-400"
                        style={{ fontSize: '0.95rem' }}
                      >
                        📥 You are assigned to {deletionPreview.tasksYouAreAssignedTo.length} task{deletionPreview.tasksYouAreAssignedTo.length !== 1 ? 's' : ''} FROM this contact:
                      </p>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                        {deletionPreview.tasksYouAreAssignedTo.slice(0, 10).map((task) => (
                          <div 
                            key={task.id}
                            className="flex items-center space-x-2 p-2 rounded"
                            style={{
                              backgroundColor: 'var(--color-bg-secondary)',
                            }}
                          >
                            <div className="flex-shrink-0">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                task.status === 'IN_PROGRESS' ? 'bg-blue-900 text-blue-300' :
                                task.status === 'TODO' ? 'bg-gray-700 text-gray-300' :
                                'bg-gray-800 text-gray-400'
                              }`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                            <span 
                              className="flex-1 text-sm"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {task.title}
                            </span>
                            {task.priority && task.priority !== 'MEDIUM' && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                task.priority === 'URGENT' ? 'bg-red-900 text-red-300' :
                                task.priority === 'HIGH' ? 'bg-orange-900 text-orange-300' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                        ))}
                        {deletionPreview.tasksYouAreAssignedTo.length > 10 && (
                          <p 
                            className="text-sm italic text-center"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            ... and {deletionPreview.tasksYouAreAssignedTo.length - 10} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tasks you assigned to them */}
                  {deletionPreview.tasksYouAssignedToThem.length > 0 && (
                    <div className="mb-4">
                      <p 
                        className="font-semibold mb-3 text-purple-400"
                        style={{ fontSize: '0.95rem' }}
                      >
                        📤 You have assigned {deletionPreview.tasksYouAssignedToThem.length} task{deletionPreview.tasksYouAssignedToThem.length !== 1 ? 's' : ''} TO this contact:
                      </p>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                        {deletionPreview.tasksYouAssignedToThem.slice(0, 10).map((task) => (
                          <div 
                            key={task.id}
                            className="flex items-center space-x-2 p-2 rounded"
                            style={{
                              backgroundColor: 'var(--color-bg-secondary)',
                            }}
                          >
                            <div className="flex-shrink-0">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                task.status === 'IN_PROGRESS' ? 'bg-blue-900 text-blue-300' :
                                task.status === 'TODO' ? 'bg-gray-700 text-gray-300' :
                                'bg-gray-800 text-gray-400'
                              }`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                            <span 
                              className="flex-1 text-sm"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {task.title}
                            </span>
                            {task.priority && task.priority !== 'MEDIUM' && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                task.priority === 'URGENT' ? 'bg-red-900 text-red-300' :
                                task.priority === 'HIGH' ? 'bg-orange-900 text-orange-300' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                        ))}
                        {deletionPreview.tasksYouAssignedToThem.length > 10 && (
                          <p 
                            className="text-sm italic text-center"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            ... and {deletionPreview.tasksYouAssignedToThem.length - 10} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div 
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                    }}
                  >
                    <p 
                      className="font-semibold mb-2 text-yellow-500"
                      style={{ fontSize: '0.95rem' }}
                    >
                      If you delete this contact:
                    </p>
                    <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {deletionPreview.tasksYouAreAssignedTo.length > 0 && (
                        <li className="flex items-start space-x-2">
                          <span className="text-red-500 font-bold">✗</span>
                          <span>You will be withdrawn from {deletionPreview.tasksYouAreAssignedTo.length} task{deletionPreview.tasksYouAreAssignedTo.length !== 1 ? 's' : ''} (they assigned you)</span>
                        </li>
                      )}
                      {deletionPreview.tasksYouAssignedToThem.length > 0 && (
                        <li className="flex items-start space-x-2">
                          <span className="text-red-500 font-bold">✗</span>
                          <span>Contact will be unassigned from {deletionPreview.tasksYouAssignedToThem.length} task{deletionPreview.tasksYouAssignedToThem.length !== 1 ? 's' : ''} (you assigned them)</span>
                        </li>
                      )}
                      <li className="flex items-start space-x-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>{deletionPreview.contact.name} will be notified for each affected task</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>All affected tasks will reset to "TODO" status</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span>This action cannot be undone</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div 
                className="rounded-lg p-4 mb-6"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                }}
              >
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  No active tasks will be affected by deleting this contact.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteWarningOpen(false);
                  setDeletionPreview(null);
                }}
                disabled={isDeleting}
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
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="btn border-0"
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                }}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    {deletionPreview.totalTaskCount > 0 ? (
                      deletionPreview.tasksYouAreAssignedTo.length > 0 && deletionPreview.tasksYouAssignedToThem.length > 0 
                        ? 'Yes, Delete & Process All Tasks'
                        : deletionPreview.tasksYouAreAssignedTo.length > 0
                        ? 'Yes, Delete & Withdraw'
                        : 'Yes, Delete & Unassign'
                    ) : (
                      'Yes, Delete Contact'
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Contact Modal Component
const AddContactModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    isPersonal: true
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData);
    setFormData({ name: '', email: '', company: '', phone: '', isPersonal: true });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div 
        className="modal-box border transition-colors duration-200"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 
            className="text-2xl font-bold transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Add Contact
          </h3>
          <IconButton
            onClick={onClose}
            icon={<FaTimes />}
            label="Close"
            iconOnly={true}
            variant="ghost"
            size="sm"
            className="!p-2 !rounded-full"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input input-bordered w-full transition-colors duration-200 ${
                errors.name ? 'border-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: errors.name ? undefined : 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter contact name"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input input-bordered w-full transition-colors duration-200 ${
                errors.email ? 'border-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: errors.email ? undefined : 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="input input-bordered w-full transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter company name (optional)"
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input input-bordered w-full transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter phone number (optional)"
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPersonal"
                  checked={formData.isPersonal}
                  onChange={() => setFormData({ ...formData, isPersonal: true })}
                  className="radio radio-primary"
                />
                <span 
                  className="ml-2 transition-colors duration-200"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Personal
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPersonal"
                  checked={!formData.isPersonal}
                  onChange={() => setFormData({ ...formData, isPersonal: false })}
                  className="radio radio-primary"
                />
                <span 
                  className="ml-2 transition-colors duration-200"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Business
                </span>
              </label>
            </div>
          </div>

          <div className="modal-action">
            <IconButton
              type="submit"
              icon={<FaCheck />}
              label="Add Contact"
              variant="primary"
              size="sm"
            />
            <IconButton
              type="button"
              onClick={onClose}
              icon={<FaTimes />}
              label="Cancel"
              variant="secondary"
              size="sm"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Contact Modal Component
const EditContactModal = ({ isOpen, onClose, contact, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    company: contact?.company || '',
    phone: contact?.phone || '',
    isPersonal: contact?.isPersonal ?? true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email,
        company: contact.company || '',
        phone: contact.phone || '',
        isPersonal: contact.isPersonal
      });
    }
  }, [contact]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div 
        className="modal-box border transition-colors duration-200"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 
            className="text-2xl font-bold transition-colors duration-200"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Edit Contact
          </h3>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-sm btn-circle transition-colors duration-200"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-tertiary)';
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input input-bordered w-full transition-colors duration-200 ${
                errors.name ? 'border-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: errors.name ? undefined : 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter contact name"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input input-bordered w-full transition-colors duration-200 ${
                errors.email ? 'border-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: errors.email ? undefined : 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="input input-bordered w-full transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter company name (optional)"
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input input-bordered w-full transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Enter phone number (optional)"
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPersonal"
                  checked={formData.isPersonal}
                  onChange={() => setFormData({ ...formData, isPersonal: true })}
                  className="radio radio-primary"
                />
                <span 
                  className="ml-2 transition-colors duration-200"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Personal
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPersonal"
                  checked={!formData.isPersonal}
                  onChange={() => setFormData({ ...formData, isPersonal: false })}
                  className="radio radio-primary"
                />
                <span 
                  className="ml-2 transition-colors duration-200"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Business
                </span>
              </label>
            </div>
          </div>

          <div className="modal-action">
            <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              Update Contact
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-ghost transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contacts;
