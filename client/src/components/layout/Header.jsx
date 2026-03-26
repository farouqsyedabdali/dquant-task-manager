import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import QuickActionsDropdown from './QuickActionsDropdown';
import UserProfileDropdown from '../common/UserProfileDropdown';
import { FaCog, FaSignOutAlt, FaComment, FaBook } from 'react-icons/fa';
import UserManualModal from '../common/UserManualModal';
import useThemeLogo from '../../hooks/useThemeLogo';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserManual, setShowUserManual] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const tialzLogo = useThemeLogo();

  const isPersonalAccount = user?.isPersonal || false;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    const checkPanelState = () => {
      setIsPanelOpen(document.body.classList.contains('calendar-panel-open'));
    };

    checkPanelState();

    const observer = new MutationObserver(checkPanelState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const interval = setInterval(checkPanelState, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isPanelOpen ? 'backdrop-blur-md' : ''
      }`}
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        ...(isPanelOpen && {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: 0.98,
        }),
      }}
    >
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        <div className="flex justify-between items-center h-16 gap-3 min-w-0">
          <div className="flex flex-shrink-0 items-center min-w-0">
            <img
              src={tialzLogo}
              alt="TIALZ Logo"
              className="h-10 sm:h-11 w-auto object-contain max-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <QuickActionsDropdown />

            <UserProfileDropdown />

            <div className="md:hidden">
              <button
                type="button"
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

        {isMenuOpen && (
          <div className="md:hidden">
            <div
              className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t transition-colors duration-200"
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
                    lineHeight: '1',
                  }}
                >
                  <span
                    className="text-xs"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1',
                    }}
                  >
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium transition-colors duration-200" style={{ color: 'var(--color-text-primary)' }}>
                    {user?.name}
                  </p>
                  {!isPersonalAccount && (
                    <p className="text-xs capitalize transition-colors duration-200" style={{ color: 'var(--color-text-tertiary)' }}>
                      {user?.role?.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t mt-3 pt-3 transition-colors duration-200" style={{ borderColor: 'var(--color-border-default)' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/settings');
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
                  <FaCog className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
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
        )}
      </div>

      <UserManualModal isOpen={showUserManual} onClose={() => setShowUserManual(false)} />
    </header>
  );
};

export default Header;
