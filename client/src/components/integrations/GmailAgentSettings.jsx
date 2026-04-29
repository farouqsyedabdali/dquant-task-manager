import { useEffect, useState } from 'react';
import { FaEnvelope, FaGoogle, FaSyncAlt } from 'react-icons/fa';
import { gmailAgentAPI } from '../../services/api';

const GmailAgentSettings = () => {
  const [account, setAccount] = useState(null);
  const [recent, setRecent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = async () => {
    try {
      setError('');
      const { data } = await gmailAgentAPI.getStatus();
      setAccount(data.account || null);
      setRecent(Array.isArray(data.recent) ? data.recent : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load Gmail agent status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const connect = async () => {
    try {
      setIsWorking(true);
      const { data } = await gmailAgentAPI.connect();
      if (data.authUrl) window.location.href = data.authUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect Gmail');
      setIsWorking(false);
    }
  };

  const updateSync = async (syncEnabled) => {
    if (!account?.id) return;
    try {
      setIsWorking(true);
      const { data } = await gmailAgentAPI.updateSettings(account.id, { syncEnabled });
      setAccount(data.account);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update Gmail agent');
    } finally {
      setIsWorking(false);
    }
  };

  const syncNow = async () => {
    if (!account?.id) return;
    try {
      setIsWorking(true);
      const { data } = await gmailAgentAPI.syncNow(account.id);
      setAccount(data.account || account);
      setRecent(Array.isArray(data.recent) ? data.recent : recent);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync Gmail');
    } finally {
      setIsWorking(false);
    }
  };

  const disconnect = async () => {
    if (!account?.id) return;
    try {
      setIsWorking(true);
      await gmailAgentAPI.disconnect(account.id);
      setAccount(null);
      setRecent([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect Gmail');
    } finally {
      setIsWorking(false);
    }
  };

  const connected = account && account.status !== 'REVOKED';

  return (
    <div
      className="card"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-default)',
        borderWidth: 1,
      }}
    >
      <div className="card-body">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="card-title text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
              <FaEnvelope className="h-5 w-5" />
              Gmail AI Agent
            </h2>
            <p className="text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>
              Connect Gmail so Tialz can read recent emails in the background, filter out noise, and automatically create tasks from important work.
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: connected ? 'rgba(34, 197, 94, 0.12)' : 'var(--color-bg-tertiary)',
              color: connected ? '#16a34a' : 'var(--color-text-tertiary)',
            }}
          >
            {connected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {error && (
          <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(239,68,68,.35)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading Gmail agent...</p>
        ) : connected ? (
          <div className="space-y-5">
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}>
              <div className="grid gap-3 md:grid-cols-2">
                <Detail label="Gmail account" value={account.email} />
                <Detail label="Status" value={account.status} />
                <Detail label="Auto-create tasks" value={account.syncEnabled ? 'On' : 'Paused'} />
                <Detail label="Last checked" value={account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : 'Not yet'} />
              </div>
              {account.lastError && (
                <p className="mt-3 text-sm" style={{ color: '#ef4444' }}>{account.lastError}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateSync(!account.syncEnabled)}
                disabled={isWorking}
                className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
              >
                {account.syncEnabled ? 'Pause agent' : 'Resume agent'}
              </button>
              <button
                type="button"
                onClick={syncNow}
                disabled={isWorking || !account.syncEnabled}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
              >
                <FaSyncAlt className="h-3.5 w-3.5" />
                Check now
              </button>
              <button
                type="button"
                onClick={disconnect}
                disabled={isWorking}
                className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ borderColor: 'rgba(239,68,68,.35)', color: '#ef4444' }}
              >
                Disconnect
              </button>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent email activity</h3>
              {recent.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No emails processed yet.</p>
              ) : (
                <div className="space-y-2">
                  {recent.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--color-border-default)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.subject || '(No subject)'}</p>
                          <p className="truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.senderEmail}</p>
                        </div>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px]" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                          {humanize(item.status)}
                        </span>
                      </div>
                      {item.reason && <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border p-4 text-sm leading-6" style={{ borderColor: 'rgba(245,158,11,.35)', backgroundColor: 'rgba(245,158,11,.08)', color: 'var(--color-text-secondary)' }}>
              For testing, Google may show an unverified-app warning because Gmail inbox access is a restricted scope. You can continue through that warning during development.
            </div>
            <button
              type="button"
              onClick={connect}
              disabled={isWorking}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <FaGoogle className="h-4 w-4" />
              Connect Gmail
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
    <p className="mt-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{value || 'None'}</p>
  </div>
);

function humanize(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default GmailAgentSettings;
