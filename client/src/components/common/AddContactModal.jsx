import { useState, useEffect } from 'react';
import useContactStore from '../../stores/contactStore';
import IconButton from './IconButton';
import { FaTimes, FaCheck } from 'react-icons/fa';

const AddContactModal = ({
  isOpen,
  onClose,
  onContactAdded,
  initialEmail = '',
  message = 'This person is not in your contact list. Please add them as a contact.'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: initialEmail,
    company: '',
    phone: '',
    isPersonal: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createContact } = useContactStore();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: initialEmail,
        company: '',
        phone: '',
        isPersonal: true
      });
      setErrors({});
    }
  }, [isOpen, initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    // Validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createContact(formData);
      if (result.success) {
        onContactAdded && onContactAdded(result.data);
        onClose();
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Failed to create contact' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
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
            onClick={handleClose}
            disabled={isSubmitting}
            icon={<FaTimes />}
            label="Close"
            iconOnly={true}
            variant="ghost"
            size="sm"
            className="!p-2 !rounded-full"
          />
        </div>

        {message && (
          <div className="alert alert-info mb-4">
            <span>{message}</span>
          </div>
        )}

        {errors.general && (
          <div className="alert alert-error mb-4">
            <span>{errors.general}</span>
          </div>
        )}

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
              disabled={isSubmitting}
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
              placeholder="Enter contact email"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPersonal}
                onChange={(e) => setFormData({ ...formData, isPersonal: e.target.checked })}
                className="checkbox checkbox-primary mr-2"
                disabled={isSubmitting}
              />
              <span
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Personal contact
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <IconButton
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              icon={<FaTimes />}
              label="Cancel"
              variant="secondary"
              size="sm"
            />
            <IconButton
              type="submit"
              disabled={isSubmitting}
              icon={<FaCheck />}
              label={isSubmitting ? 'Adding...' : 'Add Contact'}
              variant="primary"
              size="sm"
              loading={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;
