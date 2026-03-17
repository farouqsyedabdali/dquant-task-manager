import { useState } from 'react';

/**
 * Toast / notification design – consistent feedback
 */
const ToastNotification = () => {
  const [visible, setVisible] = useState('success');

  const toasts = [
    { type: 'success', message: 'Task created successfully', icon: '✓' },
    { type: 'error', message: 'Failed to save. Please try again.', icon: '✕' },
    { type: 'info', message: 'Invitation sent to sarah@company.com', icon: 'ℹ' },
  ];

  const getStyles = (type) => {
    const base = { success: {}, error: {}, info: {} };
    base.success = { backgroundColor: 'var(--color-bg-secondary)', borderLeft: '4px solid var(--color-primary)' };
    base.error = { backgroundColor: 'var(--color-bg-secondary)', borderLeft: '4px solid #ef4444' };
    base.info = { backgroundColor: 'var(--color-bg-secondary)', borderLeft: '4px solid var(--color-accent)' };
    return base[type] || base.info;
  };

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-2">Toast notifications</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-tertiary)' }}>
          Consistent feedback design
        </p>

        <div className="space-y-4">
          {toasts.map((t) => (
            <div
              key={t.type}
              className="flex items-center gap-4 p-4 rounded-xl border shadow-lg"
              style={{
                ...getStyles(t.type),
                borderColor: 'var(--color-border-default)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                style={{
                  backgroundColor: t.type === 'success' ? 'var(--color-primary)' : t.type === 'error' ? '#ef4444' : 'var(--color-accent)',
                  color: 'white',
                }}
              >
                {t.icon}
              </div>
              <p className="flex-1 text-sm">{t.message}</p>
              <button className="text-lg opacity-50 hover:opacity-100" style={{ color: 'var(--color-text-tertiary)' }}>×</button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setVisible(visible ? '' : 'success')}
          className="mt-8 px-4 py-2 rounded-full font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          Trigger toast
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;
