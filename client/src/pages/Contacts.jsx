import { useState, useEffect } from 'react';
import useContactStore from '../stores/contactStore';

const Contacts = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'personal', 'business'
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const {
    contacts,
    isLoading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
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
    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      const result = await deleteContact(contact.id);
      if (result.success) {
        setSuccessMessage('Contact deleted successfully!');
      } else {
        setErrorMessage(result.error);
      }
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
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              // Clear any existing messages when opening add modal
              setSuccessMessage('');
              setErrorMessage('');
            }}
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Contact
          </button>
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
                    <div className="avatar placeholder">
                      <div className={`rounded-full w-12 ${contact.isPersonal ? 'bg-green-600' : 'bg-blue-600'}`}>
                        <span className="text-white text-lg">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
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
      <div className="modal-box bg-gray-800 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Add Contact</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="Enter contact name"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full ${
                errors.email ? 'border-red-500' : ''
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full"
              placeholder="Enter company name (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full"
              placeholder="Enter phone number (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPersonal"
                  checked={formData.isPersonal}
                  onChange={() => setFormData({ ...formData, isPersonal: true })}
                  className="radio radio-primary"
                />
                <span className="ml-2 text-white">Personal</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPersonal"
                  checked={!formData.isPersonal}
                  onChange={() => setFormData({ ...formData, isPersonal: false })}
                  className="radio radio-primary"
                />
                <span className="ml-2 text-white">Business</span>
              </label>
            </div>
          </div>

          <div className="modal-action">
            <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              Add Contact
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost text-gray-400 hover:text-white">
              Cancel
            </button>
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
      <div className="modal-box bg-gray-800 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Edit Contact</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="Enter contact name"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full ${
                errors.email ? 'border-red-500' : ''
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full"
              placeholder="Enter company name (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input input-bordered bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-full"
              placeholder="Enter phone number (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPersonal"
                  checked={formData.isPersonal}
                  onChange={() => setFormData({ ...formData, isPersonal: true })}
                  className="radio radio-primary"
                />
                <span className="ml-2 text-white">Personal</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPersonal"
                  checked={!formData.isPersonal}
                  onChange={() => setFormData({ ...formData, isPersonal: false })}
                  className="radio radio-primary"
                />
                <span className="ml-2 text-white">Business</span>
              </label>
            </div>
          </div>

          <div className="modal-action">
            <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              Update Contact
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost text-gray-400 hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contacts;
