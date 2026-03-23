import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import CalendarIcon from '../icons/CalendarIcon';
import QuickActionsDropdown from './QuickActionsDropdown';
import { FaHome, FaUsers, FaCog, FaSignOutAlt, FaUserFriends, FaProjectDiagram, FaComment, FaBook } from 'react-icons/fa';
import UserManualModal from '../common/UserManualModal';
import useThemeLogo from '../../hooks/useThemeLogo';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showUserManual, setShowUserManual] = useState(false);
  const profileDropdownRef = useRef(null);
  const { user, logout, isAdmin, isSysAdmin, isSuperAdmin } = useAuthStore();
  const navigate = useNavigate();
  const tialzLogo = useThemeLogo();
  
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


  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Listen for body class changes to detect panel open state
  useEffect(() => {
    const checkPanelState = () => {
      setIsPanelOpen(document.body.classList.contains('calendar-panel-open'));
    };
    
    // Initial check
    checkPanelState();
    
    // Create observer to watch for class changes
    const observer = new MutationObserver(checkPanelState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Also check periodically as fallback
    const interval = setInterval(checkPanelState, 100);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 shadow-lg border-b transition-all duration-300 ${
        isPanelOpen ? 'backdrop-blur-md' : ''
      }`}
      style={{
        backgroundColor: isPanelOpen 
          ? 'var(--color-bg-secondary)' 
          : 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-default)',
        ...(isPanelOpen && {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: 0.9
        })
      }}
    >
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        <div className="flex justify-between items-center h-16 gap-3 min-w-0">
          {/* Logo + nav — min-w-0 lets the row shrink instead of overlapping the right side */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              <img 
                src={tialzLogo}
                alt="TIALZ Logo"
                className="h-10 sm:h-11 w-auto object-contain max-h-[44px]"
              />
            </div>
            
            {/* Navigation: scroll horizontally at md–lg instead of wrapping/overlap */}
            <nav className="hidden md:flex ml-4 lg:ml-8 app-toolbar-scroll flex-1 min-w-0 pl-2">
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
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
                <FaHome className="w-4 h-4 flex-shrink-0" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => handleNavigation('/calendar')}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
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
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
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
              <button
                onClick={() => handleNavigation('/projects')}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
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
                <FaProjectDiagram className="w-4 h-4" />
                <span>Projects and Events</span>
              </button>
              {isAdmin() && !isPersonalAccount && (
                <button
                  onClick={() => handleNavigation('/employees')}
                  className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 flex-shrink-0 whitespace-nowrap"
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
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Quick Actions Dropdown */}
            <QuickActionsDropdown />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full transition-colors duration-200"
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
                <div className="text-right hidden md:block min-w-0 max-w-[10rem] lg:max-w-[14rem]">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  {!isPersonalAccount && (
                    <p 
                      className="text-xs transition-colors duration-200"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {user?.role === 'SYSDMIN' ? 'System Administrator' : user?.role?.toLowerCase()}
                    </p>
                  )}
                </div>
                  <div 
                  className="text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    }}
                  >
                  <span 
                    className="text-sm font-medium"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1'
                    }}
                  >
                    {user?.name?.charAt(0)}
                  </span>
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
                  className="absolute right-0 mt-2 w-64 border rounded-lg shadow-xl z-50 transition-all duration-200 animate-[slideDown_0.2s_ease-out]"
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
                        <div 
                        className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: 'var(--color-primary)',
                          width: '48px',
                          height: '48px',
                          minWidth: '48px',
                          minHeight: '48px',
                          maxWidth: '48px',
                          maxHeight: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}
                        >
                        <span 
                          className="text-lg font-bold"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: '1'
                          }}
                        >
                          {user?.name?.charAt(0)}
                        </span>
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
                    <button
                      onClick={() => {
                        navigate('/settings?category=feedback');
                        setIsProfileDropdownOpen(false);
                      }}
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
                      <FaComment className="w-4 h-4" />
                      <span>Feedback</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserManual(true);
                        setIsProfileDropdownOpen(false);
                      }}
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
                      <FaBook className="w-4 h-4" />
                      <span>User Manual</span>
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
                <button
                  onClick={() => handleNavigation('/projects')}
                  className="block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 transition-colors duration-200"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <FaProjectDiagram className="w-4 h-4" />
                  <span>Projects and Events</span>
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
                    <div 
                    className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      width: '32px',
                      height: '32px',
                      minWidth: '32px',
                      minHeight: '32px',
                      maxWidth: '32px',
                      maxHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1'
                    }}
                    >
                    <span 
                      className="text-xs"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1'
                      }}
                    >
                      {user?.name?.charAt(0)}
                    </span>
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
                    onClick={() => {
                      navigate('/settings?category=feedback');
                      setIsMenuOpen(false);
                    }}
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
                    <FaComment className="w-4 h-4" />
                    <span>Feedback</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserManual(true);
                      setIsMenuOpen(false);
                    }}
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
                    <FaBook className="w-4 h-4" />
                    <span>User Manual</span>
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


      {/* User Manual Modal */}
      <UserManualModal
        isOpen={showUserManual}
        onClose={() => setShowUserManual(false)}
      />
    </header>
  );
};

export default Header; 