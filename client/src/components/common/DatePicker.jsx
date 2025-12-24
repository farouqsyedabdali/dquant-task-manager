import { useState, useRef, useEffect } from 'react';
import { FaCalendar } from 'react-icons/fa';

/**
 * DatePicker - A better date and time picker component
 * 
 * @param {Object} props
 * @param {string} props.value - Current value (ISO string or datetime-local format)
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.showTime - Show time picker (default: true)
 * @param {string} props.min - Minimum date (ISO string)
 * @param {string} props.max - Maximum date (ISO string)
 * @param {string} props.className - Additional CSS classes
 */
const DatePicker = ({
  value = '',
  onChange,
  placeholder = 'Select date and time',
  disabled = false,
  showTime = true,
  min = null,
  max = null,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      if (showTime) {
        const timeStr = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        return `${dateStr} at ${timeStr}`;
      }
      
      return dateStr;
    } catch (e) {
      return dateString;
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  const handleCalendarClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.showPicker?.(), 0);
      }
    }
  };

  const formatForInput = (dateString) => {
    if (!dateString) return '';
    
    // If already in datetime-local format, return as is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateString)) {
      return dateString.slice(0, 16); // Ensure it's exactly YYYY-MM-DDTHH:mm
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format as datetime-local (YYYY-MM-DDTHH:mm)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const inputValue = formatForInput(localValue);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type={showTime ? 'datetime-local' : 'date'}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min ? formatForInput(min) : undefined}
          max={max ? formatForInput(max) : undefined}
          className="input w-full transition-colors duration-200 pr-10"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-default)';
          }}
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors duration-200 hover:opacity-70 disabled:opacity-50"
          style={{ color: 'var(--color-text-tertiary)' }}
          aria-label="Open calendar"
        >
          <FaCalendar className="w-4 h-4" />
        </button>
      </div>
      
      {/* Display formatted value below input */}
      {localValue && (
        <p 
          className="text-xs mt-1 transition-colors duration-200"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {formatDateForDisplay(localValue)}
        </p>
      )}
    </div>
  );
};

export default DatePicker;

