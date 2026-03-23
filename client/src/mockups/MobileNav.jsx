import { useState } from 'react';

/**
 * Mobile navigation – hamburger menu, simplified header
 * Current: full nav may be cramped on mobile
 */
const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { label: 'Dashboard', icon: '📋' },
    { label: 'Projects', icon: '📁' },
    { label: 'Calendar', icon: '📅' },
    { label: 'Contacts', icon: '👥' },
    { label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      {/* Mobile header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <span className="text-lg font-bold">Tialz</span>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            + Task
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <span className="block w-5 h-0.5 mb-1.5 rounded" style={{ backgroundColor: 'var(--color-text-primary)' }} />
            <span className="block w-5 h-0.5 mb-1.5 rounded" style={{ backgroundColor: 'var(--color-text-primary)' }} />
            <span className="block w-5 h-0.5 rounded" style={{ backgroundColor: 'var(--color-text-primary)' }} />
          </button>
        </div>
      </header>

      {/* Slide-out menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-64 z-50 p-6 pt-16 border-l"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <nav className="space-y-1">
              {links.map((l) => (
                <a
                  key={l.label}
                  href="#"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: l.label === 'Dashboard' ? 'var(--color-bg-tertiary)' : 'transparent',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </a>
              ))}
            </nav>
            <div className="absolute bottom-6 left-6 right-6">
              <button className="w-full py-3 rounded-xl text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                Log out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Simulated content */}
      <div className="p-4">
        <div className="h-4 w-1/2 rounded mb-4" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)', borderWidth: 1 }}>
              <div className="h-4 w-3/4 rounded mb-2" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
              <div className="h-3 w-1/2 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
