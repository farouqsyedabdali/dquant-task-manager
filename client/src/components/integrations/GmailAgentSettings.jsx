import { useEffect, useState } from 'react';
import { FaEllipsisV, FaEnvelope, FaGoogle, FaPause, FaPlay, FaSyncAlt, FaTimes, FaUnlink, FaUserSlash } from 'react-icons/fa';
import IconButton from '../common/IconButton';
import { gmailAgentAPI } from '../../services/api';

const GmailAgentSettings = () => {
  const [account, setAccount] = useState(null);
  const [recent, setRecent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');
  const [skipSenders, setSkipSenders] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [skipSendersModalOpen, setSkipSendersModalOpen] = useState(false);
  const [calendarScopeGranted, setCalendarScopeGranted] = useState(false);
  const [googleCalendarWriteEnabled, setGoogleCalendarWriteEnabled] = useState(false);

  const loadStatus = async () => {
    try {
      setError('');
      const { data } = await gmailAgentAPI.getStatus();
      setAccount(data.account || null);
      setRecent(Array.isArray(data.recent) ? data.recent : []);
      setSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : []);
      setCalendarScopeGranted(Boolean(data.calendarScopeGranted));
      setGoogleCalendarWriteEnabled(Boolean(data.googleCalendarWriteEnabled));
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
      if (data.calendarScopeGranted !== undefined) setCalendarScopeGranted(Boolean(data.calendarScopeGranted));
      if (data.googleCalendarWriteEnabled !== undefined) setGoogleCalendarWriteEnabled(Boolean(data.googleCalendarWriteEnabled));
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
      setSkipSenders([]);
      setSkipSendersModalOpen(false);
      setCalendarScopeGranted(false);
      setGoogleCalendarWriteEnabled(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect Gmail');
    } finally {
      setIsWorking(false);
    }
  };

  const alwaysSkipSender = async (senderEmail) => {
    if (!senderEmail) return;
    try {
      setIsWorking(true);
      const { data } = await gmailAgentAPI.addSkipSender(senderEmail);
      setSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : skipSenders);
      setOpenMenuId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add always-skip sender');
    } finally {
      setIsWorking(false);
    }
  };

  const undoSkipSender = async (ruleId) => {
    try {
      setIsWorking(true);
      const { data } = await gmailAgentAPI.removeSkipSender(ruleId);
      setSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove always-skip sender');
    } finally {
      setIsWorking(false);
    }
  };

  const connected = account && account.status !== 'REVOKED';

  return (
    <>
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
              Google Mail &amp; Calendar
            </h2>
            <p className="text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>
              One connection reads Gmail for the AI task agent and shows your primary Google Calendar alongside tasks in the app calendar. Grant both Mail and Calendar when prompted.
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
                <Detail label="Google account" value={account.email} />
                <Detail label="Status" value={account.status} />
                <Detail label="Google Calendar in app" value={calendarScopeGranted ? 'Enabled' : 'Not linked — use Connect again'} />
                <Detail
                  label="Sync tasks to Google Calendar"
                  value={
                    googleCalendarWriteEnabled
                      ? 'On (Tialz calendar)'
                      : calendarScopeGranted
                        ? 'Reconnect to grant event write'
                        : 'Connect Google first'
                  }
                />
                <Detail label="Auto-create tasks" value={account.syncEnabled ? 'On' : 'Paused'} />
                <Detail label="Last checked" value={account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : 'Not yet'} />
              </div>
              {account.lastError && (
                <p className="mt-3 text-sm" style={{ color: '#ef4444' }}>{account.lastError}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <IconButton
                type="button"
                size="sm"
                variant="secondary"
                icon={account.syncEnabled ? <FaPause /> : <FaPlay />}
                label={account.syncEnabled ? 'Pause agent' : 'Resume agent'}
                disabled={isWorking}
                onClick={() => updateSync(!account.syncEnabled)}
              />
              <IconButton
                type="button"
                size="sm"
                variant="primary"
                icon={<FaSyncAlt />}
                label="Check now"
                disabled={isWorking || !account.syncEnabled}
                onClick={syncNow}
              />
              <IconButton
                type="button"
                size="sm"
                variant="secondary"
                icon={<FaUserSlash />}
                label={
                  skipSenders.length > 0
                    ? `Skipped senders (${skipSenders.length})`
                    : 'Skipped senders'
                }
                disabled={isWorking}
                onClick={() => {
                  setOpenMenuId(null);
                  setSkipSendersModalOpen(true);
                }}
              />
              <IconButton
                type="button"
                size="sm"
                variant="danger"
                icon={<FaUnlink />}
                label="Disconnect"
                disabled={isWorking}
                onClick={disconnect}
              />
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
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px]" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                            {humanize(item.status)}
                          </span>
                          {item.senderEmail && (
                            <div className="relative">
                              <button
                                type="button"
                                aria-label="Email actions"
                                onClick={() => setOpenMenuId((prev) => (prev === item.id ? null : item.id))}
                                className="rounded-md border p-1.5 text-xs"
                                style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                              >
                                <FaEllipsisV className="h-3 w-3" />
                              </button>
                              {openMenuId === item.id && (
                                <div
                                  className="absolute right-0 z-10 mt-1 rounded-md border p-1 shadow"
                                  style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)' }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => alwaysSkipSender(item.senderEmail)}
                                    disabled={isWorking}
                                    className="whitespace-nowrap rounded px-2 py-1 text-xs font-medium disabled:opacity-50"
                                    style={{ color: 'var(--color-text-primary)' }}
                                  >
                                    Always skip
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
              Connect Google (mail &amp; calendar)
            </button>
          </div>
        )}
      </div>
    </div>

    {skipSendersModalOpen && (
      <div className="modal modal-open backdrop-blur-sm animate-fadeIn" style={{ zIndex: 55 }}>
        <div
          className="modal-box max-w-lg max-h-[85vh] border flex flex-col"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Always skipped senders
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Emails from these addresses are never turned into tasks.
              </p>
            </div>
            <IconButton
              icon={<FaTimes />}
              label="Close"
              iconOnly
              variant="ghost"
              size="sm"
              onClick={() => setSkipSendersModalOpen(false)}
              className="!p-2 !rounded-full shrink-0"
            />
          </div>
          <div className="overflow-y-auto flex-1 min-h-0 pr-1 -mr-1">
            {skipSenders.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No sender addresses are set to always skip.
              </p>
            ) : (
              <div className="space-y-2">
                {skipSenders.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between rounded-lg border p-3 text-sm gap-3" style={{ borderColor: 'var(--color-border-default)' }}>
                    <p className="truncate min-w-0" style={{ color: 'var(--color-text-primary)' }}>{rule.senderEmail}</p>
                    <button
                      type="button"
                      onClick={() => undoSkipSender(rule.id)}
                      disabled={isWorking}
                      className="rounded-md border px-2 py-1 text-xs font-medium shrink-0 disabled:opacity-50"
                      style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                    >
                      Undo
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => setSkipSendersModalOpen(false)} aria-hidden="true" />
      </div>
    )}
    </>
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
