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
 * @param {boolean} props.timeOptional - Make time optional with checkbox (default: false)
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
  timeOptional = false,
  min = null,
  max = null,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const [includeTime, setIncludeTime] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
    // Keep includeTime as false by default (unchecked)
    // Don't auto-detect time from existing values
  }, [value, timeOptional]);

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


  const handleCalendarClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.showPicker?.(), 0);
      }
    }
  };

  const formatForInput = (dateString, showTimeInput = true) => {
    if (!dateString) return '';

    // If already in datetime-local format, return as is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateString)) {
      if (showTimeInput) {
        return dateString.slice(0, 16); // Ensure it's exactly YYYY-MM-DDTHH:mm
      } else {
        return dateString.slice(0, 10); // Just date YYYY-MM-DD
      }
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      if (showTimeInput) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } else {
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      return '';
    }
  };

  const handleDateChange = (e) => {
    const newValue = e.target.value;
    let finalValue = newValue;

    // If timeOptional and includeTime is false, set time to 11:59 PM
    if (timeOptional && !includeTime && newValue) {
      // Convert date-only to datetime with 11:59 PM
      finalValue = `${newValue}T23:59`;
    }

    setLocalValue(finalValue);
    if (onChange) {
      onChange({
        target: {
          name: e.target.name,
          value: finalValue
        }
      });
    }
  };

  const handleTimeToggle = (e) => {
    const checked = e.target.checked;
    setIncludeTime(checked);

    if (localValue) {
      let newValue = localValue;
      const date = new Date(localValue);

      if (!checked) {
        // Set to 11:59 PM
        date.setHours(23, 59, 0, 0);
        newValue = date.toISOString();
      } else {
        // Keep current time or set to current time if it was 11:59 PM
        if (date.getHours() === 23 && date.getMinutes() === 59) {
          const now = new Date();
          date.setHours(now.getHours(), now.getMinutes(), 0, 0);
          newValue = date.toISOString();
        }
      }

      setLocalValue(newValue);
      if (onChange) {
        onChange({
          target: {
            name: 'dueDate',
            value: newValue
          }
        });
      }
    }
  };

  const inputValue = formatForInput(localValue, timeOptional ? includeTime : showTime);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type={timeOptional ? (includeTime ? 'datetime-local' : 'date') : (showTime ? 'datetime-local' : 'date')}
          value={inputValue}
          onChange={handleDateChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min ? (timeOptional && !includeTime ? min.split('T')[0] : formatForInput(min, timeOptional ? includeTime : showTime)) : undefined}
          max={max ? (timeOptional && !includeTime ? max.split('T')[0] : formatForInput(max, timeOptional ? includeTime : showTime)) : undefined}
          className="input w-full transition-colors duration-200 pr-10"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-primary)',
            // Hide native calendar icon
            colorScheme: 'dark',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-default)';
          }}
        />
        {/* Hide native calendar icon and add custom theme-aware one */}
        <style>{`
          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            display: none;
            -webkit-appearance: none;
          }
        `}</style>
        <button
          type="button"
          onClick={handleCalendarClick}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors duration-200 hover:opacity-70 disabled:opacity-50 cursor-pointer"
          style={{
            color: 'var(--color-text-tertiary)',
            pointerEvents: disabled ? 'none' : 'auto'
          }}
          aria-label="Open calendar"
        >
          <FaCalendar className="w-4 h-4" />
        </button>
      </div>

      {/* Time Optional Checkbox */}
      {timeOptional && (
        <label className="flex items-center mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeTime}
            onChange={handleTimeToggle}
            disabled={disabled}
            className="checkbox checkbox-sm mr-2"
            style={{
              border: '2px solid var(--color-text-tertiary)',
              backgroundColor: includeTime ? 'var(--color-accent)' : 'transparent',
              '--chkbg': 'var(--color-accent)'
            }}
          />
          <span
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Set time
          </span>
        </label>
      )}
    </div>
  );
};

export default DatePicker;

