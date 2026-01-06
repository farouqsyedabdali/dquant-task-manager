import React from 'react';
import IconButton from './IconButton';
import { FaTimes, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

/**
 * ConfirmModal - Replaces window.confirm() with a styled, theme-aware modal
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback when modal is closed
 * @param {Function} onConfirm - Callback when user confirms
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} variant - Modal variant: 'danger', 'warning', 'info', 'success' (default: 'warning')
 * @param {boolean} isLoading - Whether action is in progress
 * @param {ReactNode} children - Optional additional content
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
  children
}) => {
  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      icon: <FaExclamationTriangle className="w-6 h-6" />,
      iconBg: 'rgba(239, 68, 68, 0.1)',
      iconColor: '#ef4444',
      confirmVariant: 'danger'
    },
    warning: {
      icon: <FaExclamationTriangle className="w-6 h-6" />,
      iconBg: 'rgba(202, 138, 4, 0.1)',
      iconColor: '#ca8a04',
      confirmVariant: 'warning'
    },
    info: {
      icon: <FaInfoCircle className="w-6 h-6" />,
      iconBg: 'rgba(99, 102, 241, 0.1)',
      iconColor: 'var(--color-primary)',
      confirmVariant: 'primary'
    },
    success: {
      icon: <FaCheckCircle className="w-6 h-6" />,
      iconBg: 'rgba(16, 185, 129, 0.1)',
      iconColor: '#10b981',
      confirmVariant: 'success'
    }
  };

  const config = variantConfig[variant] || variantConfig.warning;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative border rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transition-all duration-300"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200"
            style={{ backgroundColor: config.iconBg }}
          >
            <div style={{ color: config.iconColor }}>
              {config.icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3
              className="text-lg font-semibold mb-2 transition-colors duration-200"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {title}
            </h3>

            {/* Message */}
            {message && (
              <p
                className="text-sm mb-4 transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {message}
              </p>
            )}

            {/* Additional content */}
            {children}

            {/* Buttons */}
            <div className="flex gap-3 justify-end mt-6">
              <IconButton
                icon={<FaTimes />}
                label={cancelText}
                variant="ghost"
                onClick={handleClose}
                disabled={isLoading}
                size="sm"
              />
              <IconButton
                icon={variant === 'success' ? <FaCheckCircle /> : config.icon}
                label={confirmText}
                variant={config.confirmVariant}
                onClick={handleConfirm}
                disabled={isLoading}
                loading={isLoading}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
