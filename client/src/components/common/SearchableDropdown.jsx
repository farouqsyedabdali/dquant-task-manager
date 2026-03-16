import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  className = "",
  renderOption = (option) => `${option.name} (${option.email})`,
  recentEmployees = [], // New prop for recent employees
  getOptionValue = (option) => option.id?.toString(), // Custom value getter
  allowAddNew = false, // Whether to allow adding new items
  onAddNew, // Callback when user wants to add a new item
  addNewText = "Add as new contact" // Text for the add new option
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState(null);

  // Update filtered options when options change, but only if there's no active search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Show recent employees first, then all others
      const recentIds = recentEmployees.map(emp => emp.id);
      const recentOptions = options.filter(option => recentIds.includes(option.id));
      const otherOptions = options.filter(option => !recentIds.includes(option.id));
      setFilteredOptions([...recentOptions, ...otherOptions]);
    }
  }, [options, recentEmployees, searchTerm]);

  // Calculate dropdown position - using fixed positioning relative to viewport
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 4, // 4px gap, fixed positioning uses viewport coordinates
        left: buttonRect.left,
        width: buttonRect.width
      });
    }
  };

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (!isOpen) {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideButton = buttonRef.current && buttonRef.current.contains(event.target);
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

      if (!clickedInsideButton && !clickedInsideDropdown) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      // Show recent employees first, then all others
      const recentIds = recentEmployees.map(emp => emp.id);
      const recentOptions = options.filter(option => recentIds.includes(option.id));
      const otherOptions = options.filter(option => !recentIds.includes(option.id));
      setFilteredOptions([...recentOptions, ...otherOptions]);
    } else {
      const filtered = options.filter(option => {
        const name = option.displayName || option.name || '';
        const email = option.email || '';
        return name.toLowerCase().includes(term.toLowerCase()) ||
          email.toLowerCase().includes(term.toLowerCase());
      });

      // Check if search term looks like an email and no matches found
      const isEmail = /\S+@\S+\.\S+/.test(term.trim());
      const hasExactEmailMatch = options.some(option => option.email?.toLowerCase() === term.toLowerCase());

      if (allowAddNew && isEmail && filtered.length === 0 && !hasExactEmailMatch) {
        // Add the "Add as new contact" option
        filtered.push({
          id: '__add_new__',
          name: addNewText,
          email: term.trim(),
          isAddNewOption: true
        });
      }

      setFilteredOptions(filtered);
    }
  };

  const handleSelect = (option) => {
    if (option.isAddNewOption) {
      // Handle "Add as new contact" option
      onAddNew && onAddNew(option.email);
      setIsOpen(false);
      setSearchTerm('');
      return;
    }

    onChange(getOptionValue(option));
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedOption = useMemo(() => {
    return options.find(opt => getOptionValue(opt) === value);
  }, [options, value, getOptionValue]);

  return (
    <>
      <div className={`relative ${className}`} ref={containerRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!disabled) {
              if (!isOpen && buttonRef.current) {
                // Calculate position synchronously before opening
                const buttonRect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({
                  top: buttonRect.bottom + 4,
                  left: buttonRect.left,
                  width: buttonRect.width
                });
              }
              setIsOpen(!isOpen);
            }
          }}
          disabled={disabled}
          className="w-full text-left px-3 py-2 rounded-lg focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border-default)',
            color: 'var(--color-text-primary)',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-primary)';
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border-default)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {selectedOption ? (
            <span>{renderOption(selectedOption)}</span>
          ) : (
            <span style={{ color: 'var(--color-text-tertiary)' }}>{placeholder}</span>
          )}
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>
      </div>

      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed rounded-lg shadow-lg max-h-60 overflow-hidden"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: '1px',
            borderStyle: 'solid',
            zIndex: 10000, // Very high z-index to appear above modals
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {/* Search Input */}
          <div
            className="p-2"
            style={{
              borderBottomColor: 'var(--color-border-default)',
              borderBottomWidth: '1px',
              borderBottomStyle: 'solid',
            }}
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-1 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              autoFocus
            />
            <style>{`
              input::placeholder {
                color: var(--color-text-tertiary) !important;
              }
            `}</style>
          </div>

          {/* Options List */}
          <div
            className="max-h-48 overflow-y-auto"
            style={{
              scrollbarThumbColor: 'var(--color-scrollbar-thumb)',
              scrollbarTrackColor: 'var(--color-scrollbar-track)',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                className="px-3 py-2 text-sm transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                No results found
              </div>
            ) : (
              (() => {
                const recentIds = recentEmployees.map(emp => emp.id);
                const recentOptions = filteredOptions.filter(option => recentIds.includes(option.id) && !option.isAddNewOption);
                const otherOptions = filteredOptions.filter(option => !recentIds.includes(option.id) && !option.isAddNewOption);
                const addNewOption = filteredOptions.find(option => option.isAddNewOption);

                return (
                  <>
                    {/* Recent Employees Section */}
                    {recentOptions.length > 0 && searchTerm.trim() === '' && (
                      <>
                        <div
                          className="px-3 py-2 text-xs font-semibold transition-colors duration-200"
                          style={{
                            color: 'var(--color-primary)',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderBottomColor: 'var(--color-border-default)',
                            borderBottomWidth: '1px',
                            borderBottomStyle: 'solid',
                          }}
                        >
                          Recent
                        </div>
                        {recentOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                            style={{
                              color: 'var(--color-text-primary)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                            }}
                          >
                            {renderOption(option)}
                          </button>
                        ))}
                        {otherOptions.length > 0 && (
                          <div
                            className="px-3 py-2 text-xs font-semibold transition-colors duration-200"
                            style={{
                              color: 'var(--color-text-tertiary)',
                              backgroundColor: 'var(--color-bg-tertiary)',
                              borderBottomColor: 'var(--color-border-default)',
                              borderBottomWidth: '1px',
                              borderBottomStyle: 'solid',
                            }}
                          >
                            All
                          </div>
                        )}
                      </>
                    )}

                    {/* Other Employees */}
                    {otherOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelect(option)}
                        className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200"
                        style={{
                          color: 'var(--color-text-primary)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                        }}
                      >
                        {renderOption(option)}
                      </button>
                    ))}

                    {/* Add New Contact Option */}
                    {addNewOption && (
                      <button
                        key={addNewOption.id}
                        type="button"
                        onClick={() => handleSelect(addNewOption)}
                        className="w-full text-left px-3 py-2 focus:outline-none transition-colors duration-200 border-t"
                        style={{
                          color: 'var(--color-primary)',
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderTopColor: 'var(--color-border-default)',
                          borderTopWidth: '1px',
                          borderTopStyle: 'solid',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <span>+</span>
                          <span>{addNewOption.name}</span>
                        </div>
                      </button>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
        , document.body)}
    </>
  );
};

export default SearchableDropdown;
