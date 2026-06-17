import { useEffect, useState } from 'react';
import {
  FaCloud,
  FaEllipsisV,
  FaEnvelope,
  FaGoogle,
  FaLock,
  FaPause,
  FaPlay,
  FaServer,
  FaSyncAlt,
  FaTimes,
  FaUnlink,
  FaUserSlash,
} from 'react-icons/fa';
import IconButton from '../common/IconButton';
import useAuthStore from '../../context/authStore';
import {
  emailProviderAPI,
  gmailAgentAPI,
  outlookAgentAPI,
  hostingerAgentAPI,
} from '../../services/api';

/** Map detected provider key to the right API client. */
const PROVIDER_API = {
  google: gmailAgentAPI,
  microsoft: outlookAgentAPI,
  hostinger: hostingerAgentAPI,
};

const PROVIDER_LABELS = {
  google: 'Google Mail & Calendar',
  microsoft: 'Outlook / Microsoft 365',
  hostinger: 'Hostinger Email',
};

const PROVIDER_DESCRIPTIONS = {
  google:
    'Connect your Google account so Tialz can read Gmail for the AI task agent and show your primary Google Calendar alongside tasks.',
  microsoft:
    'Connect your Microsoft account so Tialz can read Outlook inbox mail, filter noise, and create tasks from actionable messages.',
  hostinger:
    'Connect your Hostinger email so Tialz can read your inbox, filter noise, and auto-create tasks from actionable messages.',
};

const UnifiedEmailSettings = () => {
  const { user } = useAuthStore();

  // Detection state
  const [detectedProvider, setDetectedProvider] = useState(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [detectionError, setDetectionError] = useState('');

  // Connected account state
  const [activeProvider, setActiveProvider] = useState(null); // 'google' | 'microsoft' | 'hostinger' | null
  const [account, setAccount] = useState(null);
  const [recent, setRecent] = useState([]);
  const [skipSenders, setSkipSenders] = useState([]);
  const [calendarScopeGranted, setCalendarScopeGranted] = useState(false);
  const [googleCalendarWriteEnabled, setGoogleCalendarWriteEnabled] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [skipSendersModalOpen, setSkipSendersModalOpen] = useState(false);

  // Hostinger credentials form
  const [hostingerEmail, setHostingerEmail] = useState(user?.email || '');
  const [hostingerPassword, setHostingerPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  /** Load status from all three providers and detect which is connected. */
  const loadStatuses = async () => {
    try {
      setError('');
      const [gmailRes, outlookRes, hostingerRes] = await Promise.allSettled([
        gmailAgentAPI.getStatus(),
        outlookAgentAPI.getStatus(),
        hostingerAgentAPI.getStatus(),
      ]);

      // Check which one is connected (non-revoked)
      const gmail = gmailRes.status === 'fulfilled' ? gmailRes.value.data : {};
      const outlook = outlookRes.status === 'fulfilled' ? outlookRes.value.data : {};
      const hostinger = hostingerRes.status === 'fulfilled' ? hostingerRes.value.data : {};

      if (gmail.account && gmail.account.status !== 'REVOKED') {
        setActiveProvider('google');
        setAccount(gmail.account);
        setRecent(Array.isArray(gmail.recent) ? gmail.recent : []);
        setSkipSenders(Array.isArray(gmail.skipSenders) ? gmail.skipSenders : []);
        setCalendarScopeGranted(Boolean(gmail.calendarScopeGranted));
        setGoogleCalendarWriteEnabled(Boolean(gmail.googleCalendarWriteEnabled));
      } else if (outlook.account && outlook.account.status !== 'REVOKED') {
        setActiveProvider('microsoft');
        setAccount(outlook.account);
        setRecent(Array.isArray(outlook.recent) ? outlook.recent : []);
        setSkipSenders(Array.isArray(outlook.skipSenders) ? outlook.skipSenders : []);
      } else if (hostinger.account && hostinger.account.status !== 'REVOKED') {
        setActiveProvider('hostinger');
        setAccount(hostinger.account);
        setRecent(Array.isArray(hostinger.recent) ? hostinger.recent : []);
        setSkipSenders(Array.isArray(hostinger.skipSenders) ? hostinger.skipSenders : []);
      } else {
        setActiveProvider(null);
        setAccount(null);
        setRecent([]);
        setSkipSenders([]);
      }
    } catch (err) {
      setError('Failed to load email integration status');
    } finally {
      setIsLoading(false);
    }
  };

  /** Detect the user's email provider via MX records. */
  const detectProvider = async () => {
    try {
      setDetectionError('');
      const { data } = await emailProviderAPI.detect();
      setDetectedProvider(data);
    } catch (err) {
      setDetectionError('Could not detect your email provider');
      setDetectedProvider({ provider: 'unknown', supported: false });
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    loadStatuses();
    detectProvider();
  }, []);

  // ---- Provider API helper ----
  const api = activeProvider ? PROVIDER_API[activeProvider] : null;

  // ---- Actions (for connected state) ----
  const connectOAuth = async (provider) => {
    try {
      setIsWorking(true);
      const providerApi = PROVIDER_API[provider];
      const { data } = await providerApi.connect();
      if (data.authUrl) window.location.href = data.authUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start connection');
      setIsWorking(false);
    }
  };

  const connectHostinger = async () => {
    try {
      setIsConnecting(true);
      setConnectError('');
      const { data } = await hostingerAgentAPI.connect(hostingerEmail, hostingerPassword);
      if (data.account) {
        setActiveProvider('hostinger');
        setAccount(data.account);
        setHostingerPassword('');
      }
    } catch (err) {
      setConnectError(
        err.response?.data?.error || 'Failed to connect. Please check your email and password.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const updateSync = async (syncEnabled) => {
    if (!account?.id || !api) return;
    try {
      setIsWorking(true);
      const { data } = await api.updateSettings(account.id, { syncEnabled });
      setAccount(data.account);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setIsWorking(false);
    }
  };

  const syncNow = async () => {
    if (!account?.id || !api) return;
    try {
      setIsWorking(true);
      const { data } = await api.syncNow(account.id);
      setAccount(data.account || account);
      setRecent(Array.isArray(data.recent) ? data.recent : recent);
      if (data.calendarScopeGranted !== undefined)
        setCalendarScopeGranted(Boolean(data.calendarScopeGranted));
      if (data.googleCalendarWriteEnabled !== undefined)
        setGoogleCalendarWriteEnabled(Boolean(data.googleCalendarWriteEnabled));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync');
    } finally {
      setIsWorking(false);
    }
  };

  const disconnect = async () => {
    if (!account?.id || !api) return;
    try {
      setIsWorking(true);
      await api.disconnect(account.id);
      setActiveProvider(null);
      setAccount(null);
      setRecent([]);
      setSkipSenders([]);
      setSkipSendersModalOpen(false);
      setCalendarScopeGranted(false);
      setGoogleCalendarWriteEnabled(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect');
    } finally {
      setIsWorking(false);
    }
  };

  const alwaysSkipSender = async (senderEmail) => {
    if (!senderEmail || !api) return;
    try {
      setIsWorking(true);
      const { data } = await api.addSkipSender(senderEmail);
      setSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : skipSenders);
      setOpenMenuId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add always-skip sender');
    } finally {
      setIsWorking(false);
    }
  };

  const undoSkipSender = async (ruleId) => {
    if (!api) return;
    try {
      setIsWorking(true);
      const { data } = await api.removeSkipSender(ruleId);
      setSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove always-skip sender');
    } finally {
      setIsWorking(false);
    }
  };

  const allowEmailOnce = async (ingestionId) => {
    if (!ingestionId || !api) return;
    try {
      setIsWorking(true);
      const { data } = await api.allowOnce(ingestionId);
      setRecent(Array.isArray(data.recent) ? data.recent : recent);
      setOpenMenuId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to allow email once');
    } finally {
      setIsWorking(false);
    }
  };

  const allowSenderAlways = async (senderEmail) => {
    if (!senderEmail || !api) return;
    try {
      setIsWorking(true);
      const { data } = await api.allowAlways(senderEmail);
      setRecent(Array.isArray(data.recent) ? data.recent : recent);
      setSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : skipSenders);
      setOpenMenuId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to allow sender always');
    } finally {
      setIsWorking(false);
    }
  };

  // ---- Derived state ----
  const connected = account && account.status !== 'REVOKED';
  const displayProvider = activeProvider || detectedProvider?.provider || 'unknown';
  const providerLabel = PROVIDER_LABELS[displayProvider] || 'Email Integration';
  const providerDescription = PROVIDER_DESCRIPTIONS[displayProvider] || '';

  const ProviderIcon = ({ provider, className }) => {
    switch (provider) {
      case 'google':
        return <FaGoogle className={className} />;
      case 'microsoft':
        return <FaCloud className={className} />;
      case 'hostinger':
        return <FaServer className={className} />;
      default:
        return <FaEnvelope className={className} />;
    }
  };

  // ---- Render ----
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
              <h2
                className="card-title text-xl mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <FaEnvelope className="h-5 w-5" />
                Email Integration
              </h2>
              <p
                className="text-sm leading-6"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {connected
                  ? providerDescription
                  : 'Connect your email so Tialz can read your inbox, filter noise, and auto-create tasks from actionable messages.'}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: connected
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'var(--color-bg-tertiary)',
                color: connected ? '#16a34a' : 'var(--color-text-tertiary)',
              }}
            >
              {connected
                ? `Connected — ${PROVIDER_LABELS[activeProvider] || activeProvider}`
                : 'Not connected'}
            </span>
          </div>

          {error && (
            <div
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'rgba(239,68,68,.35)', color: '#ef4444' }}
            >
              {error}
            </div>
          )}

          {isLoading ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Loading email integration...
            </p>
          ) : connected ? (
            /* ---- CONNECTED STATE ---- */
            <div className="space-y-5">
              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: 'var(--color-border-default)',
                  backgroundColor: 'var(--color-bg-tertiary)',
                }}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <Detail label="Provider" value={PROVIDER_LABELS[activeProvider]} />
                  <Detail label="Account" value={account.email} />
                  <Detail label="Status" value={account.status} />
                  <Detail
                    label="Auto-create tasks"
                    value={account.syncEnabled ? 'On' : 'Paused'}
                  />
                  <Detail
                    label="Last checked"
                    value={
                      account.lastSyncedAt
                        ? new Date(account.lastSyncedAt).toLocaleString()
                        : 'Not yet'
                    }
                  />
                  {activeProvider === 'google' && (
                    <>
                      <Detail
                        label="Google Calendar in app"
                        value={
                          calendarScopeGranted
                            ? 'Enabled'
                            : 'Not linked — use Connect again'
                        }
                      />
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
                    </>
                  )}
                </div>
                {account.lastError && (
                  <p className="mt-3 text-sm" style={{ color: '#ef4444' }}>
                    {account.lastError}
                  </p>
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

              {/* Recent activity */}
              <div>
                <h3
                  className="mb-2 text-sm font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Recent email activity
                </h3>
                {recent.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    No emails processed yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recent.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border p-3 text-sm"
                        style={{ borderColor: 'var(--color-border-default)' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className="truncate font-medium"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {item.subject || '(No subject)'}
                            </p>
                            <p
                              className="truncate text-xs"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              {item.senderEmail}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[11px]"
                              style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {humanize(item.status)}
                            </span>
                            {item.senderEmail && (
                              <div className="relative">
                                <button
                                  type="button"
                                  aria-label="Email actions"
                                  onClick={() =>
                                    setOpenMenuId((prev) =>
                                      prev === item.id ? null : item.id
                                    )
                                  }
                                  className="rounded-md border p-1.5 text-xs"
                                  style={{
                                    borderColor: 'var(--color-border-default)',
                                    color: 'var(--color-text-secondary)',
                                  }}
                                >
                                  <FaEllipsisV className="h-3 w-3" />
                                </button>
                                {openMenuId === item.id && (
                                  <div
                                    className="absolute right-0 z-10 mt-1 rounded-md border p-1 shadow"
                                    style={{
                                      borderColor: 'var(--color-border-default)',
                                      backgroundColor: 'var(--color-bg-secondary)',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => alwaysSkipSender(item.senderEmail)}
                                      disabled={isWorking}
                                      className="block w-full whitespace-nowrap rounded px-2 py-1 text-left text-xs font-medium disabled:opacity-50"
                                      style={{ color: 'var(--color-text-primary)' }}
                                    >
                                      Always skip
                                    </button>
                                    {item.status === 'SKIPPED' && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => allowEmailOnce(item.id)}
                                          disabled={isWorking}
                                          className="block w-full whitespace-nowrap rounded px-2 py-1 text-left text-xs font-medium disabled:opacity-50"
                                          style={{ color: 'var(--color-text-primary)' }}
                                        >
                                          Allow once
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => allowSenderAlways(item.senderEmail)}
                                          disabled={isWorking}
                                          className="block w-full whitespace-nowrap rounded px-2 py-1 text-left text-xs font-medium disabled:opacity-50"
                                          style={{ color: 'var(--color-text-primary)' }}
                                        >
                                          Allow always
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {item.reason && (
                          <p
                            className="mt-1 text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {item.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ---- NOT CONNECTED STATE ---- */
            <div className="space-y-4">
              {isDetecting ? (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Detecting your email provider...
                </p>
              ) : detectedProvider?.provider === 'google' ? (
                /* Google detected */
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-3 rounded-xl border p-4"
                    style={{
                      borderColor: 'rgba(59, 130, 246, 0.35)',
                      backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    }}
                  >
                    <FaGoogle className="h-5 w-5 shrink-0" style={{ color: '#4285F4' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      We detected that <strong>{user?.email}</strong> uses Google. Click below
                      to connect via Google OAuth.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => connectOAuth('google')}
                    disabled={isWorking}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <FaGoogle className="h-4 w-4" />
                    Connect Google (mail &amp; calendar)
                  </button>
                </div>
              ) : detectedProvider?.provider === 'microsoft' ? (
                /* Microsoft detected */
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-3 rounded-xl border p-4"
                    style={{
                      borderColor: 'rgba(59, 130, 246, 0.35)',
                      backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    }}
                  >
                    <FaCloud className="h-5 w-5 shrink-0" style={{ color: '#0078D4' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      We detected that <strong>{user?.email}</strong> uses Microsoft 365 / Outlook.
                      Click below to connect.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => connectOAuth('microsoft')}
                    disabled={isWorking}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <FaCloud className="h-4 w-4" />
                    Connect Outlook
                  </button>
                </div>
              ) : detectedProvider?.provider === 'hostinger' ? (
                /* Hostinger detected — show credentials form */
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-3 rounded-xl border p-4"
                    style={{
                      borderColor: 'rgba(139, 92, 246, 0.35)',
                      backgroundColor: 'rgba(139, 92, 246, 0.06)',
                    }}
                  >
                    <FaServer className="h-5 w-5 shrink-0" style={{ color: '#673DE6' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      We detected that <strong>{user?.email}</strong> uses Hostinger email.
                      Enter your email password below to connect.
                    </p>
                  </div>

                  {connectError && (
                    <div
                      className="rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: 'rgba(239,68,68,.35)', color: '#ef4444' }}
                    >
                      {connectError}
                    </div>
                  )}

                  <div className="space-y-3 max-w-md">
                    <div>
                      <label
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        value={hostingerEmail}
                        onChange={(e) => setHostingerEmail(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        style={{
                          borderColor: 'var(--color-border-default)',
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                        }}
                        placeholder="you@yourdomain.com"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        value={hostingerPassword}
                        onChange={(e) => setHostingerPassword(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        style={{
                          borderColor: 'var(--color-border-default)',
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                        }}
                        placeholder="Your email password"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && hostingerEmail && hostingerPassword) {
                            connectHostinger();
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FaLock className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        Your password is encrypted at rest (AES-256) and only used for IMAP access.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={connectHostinger}
                      disabled={isConnecting || !hostingerEmail || !hostingerPassword}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <FaServer className="h-4 w-4" />
                      {isConnecting ? 'Connecting...' : 'Connect Hostinger Email'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Unknown provider — offer manual choice */
                <div className="space-y-4">
                  <div
                    className="rounded-xl border p-4 text-sm leading-6"
                    style={{
                      borderColor: 'rgba(245,158,11,.35)',
                      backgroundColor: 'rgba(245,158,11,.08)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    We couldn&apos;t automatically detect the email provider for{' '}
                    <strong>{user?.email}</strong>. Please choose your provider below.
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => connectOAuth('google')}
                      disabled={isWorking}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: '#4285F4' }}
                    >
                      <FaGoogle className="h-4 w-4" />
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => connectOAuth('microsoft')}
                      disabled={isWorking}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: '#0078D4' }}
                    >
                      <FaCloud className="h-4 w-4" />
                      Microsoft 365
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetectedProvider({ provider: 'hostinger', supported: true });
                      }}
                      disabled={isWorking}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: '#673DE6' }}
                    >
                      <FaServer className="h-4 w-4" />
                      Hostinger
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Skip senders modal */}
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
                <h3
                  className="text-xl font-bold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Always skipped senders
                </h3>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
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
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm gap-3"
                      style={{ borderColor: 'var(--color-border-default)' }}
                    >
                      <p
                        className="truncate min-w-0"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {rule.senderEmail}
                      </p>
                      <button
                        type="button"
                        onClick={() => undoSkipSender(rule.id)}
                        disabled={isWorking}
                        className="rounded-md border px-2 py-1 text-xs font-medium shrink-0 disabled:opacity-50"
                        style={{
                          borderColor: 'var(--color-border-default)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="modal-backdrop" aria-hidden="true" />
        </div>
      )}
    </>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
      {label}
    </p>
    <p className="mt-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
      {value || 'None'}
    </p>
  </div>
);

function humanize(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default UnifiedEmailSettings;
