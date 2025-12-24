import { useState, useRef, useEffect } from 'react';

const SearchableDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option",
  disabled = false,
  error = false,
  className = "",
  renderOption = (option) => `${option.name} (${option.email})`,
  recentEmployees = [] // New prop for recent employees
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Show recent employees first, then all others
    const recentIds = recentEmployees.map(emp => emp.id);
    const recentOptions = options.filter(option => recentIds.includes(option.id));
    const otherOptions = options.filter(option => !recentIds.includes(option.id));
    setFilteredOptions([...recentOptions, ...otherOptions]);
  }, [options, recentEmployees]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      // Show recent employees first, then all others
      const recentIds = recentEmployees.map(emp => emp.id);
      const recentOptions = options.filter(option => recentIds.includes(option.id));
      const otherOptions = options.filter(option => !recentIds.includes(option.id));
      setFilteredOptions([...recentOptions, ...otherOptions]);
    } else {
      const filtered = options.filter(option => 
        option.name.toLowerCase().includes(term.toLowerCase()) ||
        option.email.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  };

  const handleSelect = (option) => {
    onChange(option.id.toString());
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedOption = options.find(opt => opt.id.toString() === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-hidden transition-all duration-200"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
            borderWidth: '1px',
            borderStyle: 'solid',
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
              placeholder="Search employees..."
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
                No employees found
              </div>
            ) : (
              (() => {
                const recentIds = recentEmployees.map(emp => emp.id);
                const recentOptions = filteredOptions.filter(option => recentIds.includes(option.id));
                const otherOptions = filteredOptions.filter(option => !recentIds.includes(option.id));
                
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
                            All Employees
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
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
