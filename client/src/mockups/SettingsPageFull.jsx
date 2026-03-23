import { useState } from 'react';

/**
 * Full settings page mockup – sections, toggles, profile
 */
const SettingsPageFull = () => {
  const [fontSize, setFontSize] = useState('medium');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {/* Profile */}
        <div
          className="p-6 rounded-2xl border mb-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>JD</div>
            <div>
              <p className="font-medium">John Doe</p>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>john@company.com</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg text-sm" style={{ borderColor: 'var(--color-border-default)', borderWidth: 1 }}>Edit profile</button>
        </div>

        {/* Preferences */}
        <div
          className="p-6 rounded-2xl border mb-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <h2 className="text-lg font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Font size</span>
              <div className="flex gap-2">
                {['small', 'medium', 'large'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className="px-3 py-1 rounded-lg text-sm capitalize"
                    style={{
                      backgroundColor: fontSize === s ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                      color: fontSize === s ? 'white' : 'var(--color-text-secondary)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Email notifications</span>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className="relative w-14 h-7 rounded-full transition-colors"
                style={{ backgroundColor: notifications ? 'var(--color-primary)' : 'var(--color-bg-tertiary)' }}
              >
                <span
                  className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: notifications ? 'calc(100% - 22px)' : '4px' }}
                />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span>Dark mode</span>
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="relative w-14 h-7 rounded-full transition-colors"
                style={{ backgroundColor: darkMode ? 'var(--color-primary)' : 'var(--color-bg-tertiary)' }}
              >
                <span
                  className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: darkMode ? 'calc(100% - 22px)' : '4px' }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="p-6 rounded-2xl border"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-dark)',
            borderWidth: 1,
          }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Danger zone</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Permanently delete your account and all data.</p>
          <button className="px-4 py-2 rounded-lg text-sm border" style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border-dark)' }}>Delete account</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPageFull;
