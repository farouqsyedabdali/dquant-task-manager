import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import CalendarIcon from '../icons/CalendarIcon';
import { FaHome, FaUsers, FaCog, FaSignOutAlt, FaExternalLinkAlt, FaUserFriends } from 'react-icons/fa';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const { user, logout, isAdmin, isSysAdmin, isSuperAdmin } = useAuthStore();
  const navigate = useNavigate();
  
  // Check if this is a personal account
  const isPersonalAccount = user?.isPersonal || false;

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleOpenPopup = () => {
    // Execute the VBS script to open the popup
    // Since we can't directly execute VBS from the browser, we'll open the popup URL directly
    // The VBS script is designed to open http://localhost:5173/popup in a popup window
    window.open('/popup', '_blank', 'width=320,height=400,scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no');
  };

  return (
    <header 
      className="shadow-lg border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 
                className="text-xl font-bold transition-colors duration-200"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {user?.companyName || 'Tialz Task Manager'}
              </h1>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex ml-8 space-x-4">
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200"
                style={{ 
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <FaHome className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => handleNavigation('/calendar')}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200"
                style={{ 
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => handleNavigation('/contacts')}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200"
                style={{ 
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Contacts</span>
              </button>
              {isAdmin() && !isPersonalAccount && (
                <button
                  onClick={() => handleNavigation('/employees')}
                  className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200"
                  style={{ 
                    color: 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <FaUsers className="w-4 h-4" />
                  <span>Employees</span>
                </button>
              )}
              {isSuperAdmin() && (
                <button
                  onClick={() => handleNavigation('/super-admin')}
                  className="text-red-400 hover:text-red-300 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                >
                  <span>🔴</span>
                  <span>Super Admin</span>
                </button>
              )}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Open Popup Button */}
            <button
              onClick={handleOpenPopup}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <FaExternalLinkAlt className="w-4 h-4" />
              <span>Open Popup</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center space-x-3 transition-colors duration-200"
                style={{ 
                  color: 'var(--color-text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  {!isPersonalAccount && (
                    <p 
                      className="text-xs transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {user?.role === 'SYSDMIN' ? 'System Administrator' : user?.role?.toLowerCase()}
                    </p>
                  )}
                </div>
                <div className="avatar placeholder">
                  <div 
                    className="text-white rounded-full w-10 transition-colors duration-200"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    }}
                  >
                    <span className="text-sm font-medium">{user?.name?.charAt(0)}</span>
                  </div>
                </div>
                <svg 
                  className="w-4 h-4 transition-colors duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 border rounded-lg shadow-xl z-50 transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-default)',
                  }}
                >
                  <div 
                    className="p-4 border-b"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="avatar placeholder">
                        <div 
                          className="text-white rounded-full w-12"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          <span className="text-lg font-bold">{user?.name?.charAt(0)}</span>
                        </div>
                      </div>
                      <div>
                        <p 
                          className="font-medium transition-colors duration-200"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {user?.name}
                        </p>
                        <p 
                          className="text-sm transition-colors duration-200"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {user?.email}
                        </p>
                        {!isPersonalAccount && (
                          <p 
                            className="text-xs transition-colors duration-200"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            {user?.role === 'SYSDMIN' ? 'System Administrator' : user?.role?.toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={() => handleNavigation('/settings')}
                      className="w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
                      style={{ 
                        color: 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FaCog className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    
                    <div 
                      className="border-t my-2"
                      style={{ borderColor: 'var(--color-border-default)' }}
                    ></div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
                      style={{ 
                        color: 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="focus:outline-none transition-colors duration-200"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div 
              className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t transition-colors duration-200"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              {/* Mobile Navigation */}
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <FaHome className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => handleNavigation('/calendar')}
                  className="block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>Calendar</span>
                </button>
                <button
                  onClick={() => handleNavigation('/contacts')}
                  className="block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Contacts</span>
                </button>
                {isAdmin() && !isPersonalAccount && (
                  <button
                    onClick={() => handleNavigation('/employees')}
                    className="block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 transition-colors duration-200"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }}
                  >
                    <FaUsers className="w-4 h-4" />
                    <span>Employees</span>
                  </button>
                )}
              </div>
              
              <div 
                className="border-t pt-4 mt-4 transition-colors duration-200"
                style={{ borderColor: 'var(--color-border-default)' }}
              >
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="avatar placeholder">
                    <div 
                      className="text-white rounded-full w-8"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <span className="text-xs">{user?.name?.charAt(0)}</span>
                    </div>
                  </div>
                  <div>
                    <p 
                      className="text-sm font-medium transition-colors duration-200"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {user?.name}
                    </p>
                    {!isPersonalAccount && (
                      <p 
                        className="text-xs capitalize transition-colors duration-200"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {user?.role?.toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div 
                  className="border-t mt-3 pt-3 transition-colors duration-200"
                  style={{ borderColor: 'var(--color-border-default)' }}
                >
                  <button
                    onClick={() => handleNavigation('/settings')}
                    className="w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
                    style={{ 
                      color: 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FaCog className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
                    style={{ 
                      color: 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      
    </header>
  );
};

export default Header; 