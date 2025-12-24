import { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

/**
 * Toast - A toast notification component
 * 
 * @param {Object} props
 * @param {string} props.type - Type: 'success', 'error', 'info', 'warning'
 * @param {string} props.message - Message to display
 * @param {number} props.duration - Auto-dismiss duration in ms (default: 5000, 0 = no auto-dismiss)
 * @param {Function} props.onClose - Callback when toast is closed
 * @param {boolean} props.show - Whether to show the toast
 */
const Toast = ({ type = 'info', message = '', duration = 5000, onClose, show = true }) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for animation
    }
  };

  if (!isVisible) return null;

  const typeConfig = {
    success: {
      icon: <FaCheckCircle className="w-5 h-5" />,
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      iconColor: '#10b981',
      textColor: 'var(--color-text-primary)'
    },
    error: {
      icon: <FaExclamationCircle className="w-5 h-5" />,
      bgColor: 'rgba(220, 38, 38, 0.1)',
      borderColor: 'rgba(220, 38, 38, 0.3)',
      iconColor: '#dc2626',
      textColor: 'var(--color-text-primary)'
    },
    info: {
      icon: <FaInfoCircle className="w-5 h-5" />,
      bgColor: 'rgba(99, 102, 241, 0.1)',
      borderColor: 'rgba(99, 102, 241, 0.3)',
      iconColor: 'var(--color-primary)',
      textColor: 'var(--color-text-primary)'
    },
    warning: {
      icon: <FaExclamationCircle className="w-5 h-5" />,
      bgColor: 'rgba(202, 138, 4, 0.1)',
      borderColor: 'rgba(202, 138, 4, 0.3)',
      iconColor: '#ca8a04',
      textColor: 'var(--color-text-primary)'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div 
      className="w-full animate-[slideUp_0.3s_ease-out]"
      style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      <div 
        className="flex items-start space-x-3 p-4 rounded-lg border shadow-lg transition-all duration-300"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        }}
      >
        <div style={{ color: config.iconColor }} className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p 
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: config.textColor }}
          >
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 transition-colors duration-200 hover:opacity-70"
          style={{ color: config.textColor }}
          aria-label="Close"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

