import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import UserManualModal from './UserManualModal';
import { FaCog, FaSignOutAlt, FaComment, FaBook } from 'react-icons/fa';

/**
 * Profile avatar + dropdown (Settings, Feedback, User Manual, Logout).
 * Shared by main Header and AI-first shell header.
 */
export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserManual, setShowUserManual] = useState(false);
  const ref = useRef(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isPersonalAccount = user?.isPersonal || false;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const go = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full transition-colors duration-200"
          style={{ color: 'var(--color-text-primary)' }}
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
              <p className="text-xs transition-colors duration-200" style={{ color: 'var(--color-text-tertiary)' }}>
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
              lineHeight: '1',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }}
          >
            <span className="text-sm font-medium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' }}>
              {user?.name?.charAt(0)}
            </span>
          </div>
          <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-tertiary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-64 border rounded-lg shadow-xl z-[60] transition-all duration-200 animate-[slideDown_0.2s_ease-out]"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
              <div className="flex items-center space-x-3">
                <div
                  className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    width: '48px',
                    height: '48px',
                    minWidth: '48px',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1',
                  }}
                >
                  <span className="text-lg font-bold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' }}>
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium transition-colors duration-200" style={{ color: 'var(--color-text-primary)' }}>
                    {user?.name}
                  </p>
                  <p className="text-sm transition-colors duration-200" style={{ color: 'var(--color-text-secondary)' }}>
                    {user?.email}
                  </p>
                  {!isPersonalAccount && (
                    <p className="text-xs transition-colors duration-200" style={{ color: 'var(--color-text-tertiary)' }}>
                      {user?.role === 'SYSDMIN' ? 'System Administrator' : user?.role?.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                type="button"
                onClick={() => go('/settings')}
                className="w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
                style={{ color: 'var(--color-text-secondary)' }}
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
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
                style={{ color: 'var(--color-text-secondary)' }}
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
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
                style={{ color: 'var(--color-text-secondary)' }}
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

              <div className="border-t my-2" style={{ borderColor: 'var(--color-border-default)' }} />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
                style={{ color: 'var(--color-text-secondary)' }}
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

      <UserManualModal isOpen={showUserManual} onClose={() => setShowUserManual(false)} />
    </>
  );
}
