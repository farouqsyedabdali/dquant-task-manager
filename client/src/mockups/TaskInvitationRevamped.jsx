import { useState } from 'react';

/**
 * Revamped Task Invitation – theme-aware, cleaner layout
 * Current site: hardcoded bg-gray-900, breaks light mode
 */
const TaskInvitationRevamped = () => {
  const [declineReason, setDeclineReason] = useState('');
  const [showDecline, setShowDecline] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-8 shadow-xl"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl" style={{ backgroundColor: 'var(--color-primary)' }}>
            📋
          </div>
          <h1 className="text-xl font-bold mb-2">You're invited to a task</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Sarah Kim wants to assign you a task
          </p>
        </div>

        <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          <h2 className="font-semibold mb-2">Review PR #142</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Verify all tests pass before merge. High priority.
          </p>
          <div className="flex gap-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>Due Mar 20</span>
            <span>From: Sarah Kim</span>
          </div>
        </div>

        {!showDecline ? (
          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-full font-medium"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              Accept
            </button>
            <button
              onClick={() => setShowDecline(true)}
              className="flex-1 py-3 rounded-full font-medium border"
              style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
            >
              Decline
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Optional: reason for declining..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
              }}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDecline(false)} className="flex-1 py-2 rounded-full text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                Cancel
              </button>
              <button className="flex-1 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                Confirm decline
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Not signed in? You'll be asked to log in first
        </p>
      </div>
    </div>
  );
};

export default TaskInvitationRevamped;
