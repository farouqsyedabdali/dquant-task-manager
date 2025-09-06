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
        className={`w-full text-left px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500' : ''}`}
      >
        {selectedOption ? (
          <span>{renderOption(selectedOption)}</span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-600">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-400 text-sm">
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
                        <div className="px-3 py-2 text-xs font-semibold text-indigo-400 bg-gray-800 border-b border-gray-600">
                          Recent
                        </div>
                        {recentOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className="w-full text-left px-3 py-2 text-white hover:bg-gray-600 focus:bg-gray-600 focus:outline-none"
                          >
                            {renderOption(option)}
                          </button>
                        ))}
                        {otherOptions.length > 0 && (
                          <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-800 border-b border-gray-600">
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
                        className="w-full text-left px-3 py-2 text-white hover:bg-gray-600 focus:bg-gray-600 focus:outline-none"
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
