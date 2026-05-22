import { useEffect, useState, useCallback } from 'react';
import {
  FaEnvelope, FaGoogle, FaCloud, FaServer, FaUnlink, FaPause, FaPlay,
  FaSyncAlt, FaUserSlash, FaEllipsisV, FaTimes, FaCheckCircle, FaExclamationTriangle,
  FaPlug, FaLock, FaSpinner
} from 'react-icons/fa';
import IconButton from '../common/IconButton';
import useAuthStore from '../../context/authStore';
import { integrationsAPI, gmailAgentAPI, outlookAgentAPI } from '../../services/api';

/* ─── helpers ─────────────────────────────────────────────────────────── */
function humanize(v) {
  return String(v || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

const PROVIDER_META = {
  google: {
    label: 'Google Mail & Calendar',
    icon: <FaGoogle className="h-4 w-4" />,
    color: '#4285F4',
    gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC05 100%)',
  },
  microsoft: {
    label: 'Outlook / Microsoft 365',
    icon: <FaCloud className="h-4 w-4" />,
    color: '#0078D4',
    gradient: 'linear-gradient(135deg, #0078D4 0%, #00BCF2 100%)',
  },
  caldav: {
    label: 'CalDAV / Hostinger',
    icon: <FaServer className="h-4 w-4" />,
    color: '#673DE6',
    gradient: 'linear-gradient(135deg, #673DE6 0%, #9333EA 100%)',
  },
  unknown: {
    label: 'Unknown Provider',
    icon: <FaPlug className="h-4 w-4" />,
    color: '#6B7280',
    gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
  },
};

/* ────────────────────────────────────────────────────────────────────── */
const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
    <p className="mt-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{value || 'None'}</p>
  </div>
);

/* ────────────────────────────────────────────────────────────────────── */
const UnifiedEmailSettings = () => {
  const { user } = useAuthStore();
  const userEmail = user?.email || '';

  /* ── state ─────────────────────────────────────────────── */
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');

  // Connected accounts
  const [googleAccount, setGoogleAccount] = useState(null);
  const [microsoftAccount, setMicrosoftAccount] = useState(null);
  const [caldavAccount, setCaldavAccount] = useState(null);

  // Detection flow
  const [step, setStep] = useState('IDLE'); // IDLE | DETECTING | CALDAV_FORM | MANUAL
  const [detectedProvider, setDetectedProvider] = useState(null);

  // CalDAV form fields
  const [caldavEmail, setCaldavEmail] = useState('');
  const [caldavPassword, setCaldavPassword] = useState('');
  const [caldavServerUrl, setCaldavServerUrl] = useState('https://mail.hostinger.com/dav/');

  // Gmail-specific
  const [gmailRecent, setGmailRecent] = useState([]);
  const [gmailSkipSenders, setGmailSkipSenders] = useState([]);
  const [gmailCalendarScope, setGmailCalendarScope] = useState(false);
  const [gmailCalendarWrite, setGmailCalendarWrite] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [skipSendersModalOpen, setSkipSendersModalOpen] = useState(false);
  const [skipSendersProvider, setSkipSendersProvider] = useState(null);

  // Outlook-specific
  const [outlookRecent, setOutlookRecent] = useState([]);
  const [outlookSkipSenders, setOutlookSkipSenders] = useState([]);

  /* ── load ───────────────────────────────────────────────── */
  const loadAll = useCallback(async () => {
    try {
      setError('');
      const [intStatus, gmailStatus, outlookStatus] = await Promise.allSettled([
        integrationsAPI.getStatus(),
        gmailAgentAPI.getStatus(),
        outlookAgentAPI.getStatus(),
      ]);

      if (intStatus.status === 'fulfilled') {
        const c = intStatus.value.data.connected || {};
        setGoogleAccount(c.google || null);
        setMicrosoftAccount(c.microsoft || null);
        setCaldavAccount(c.caldav || null);
      }
      if (gmailStatus.status === 'fulfilled') {
        const d = gmailStatus.value.data;
        if (d.account && d.account.status !== 'REVOKED') {
          setGoogleAccount(prev => prev || d.account);
        }
        setGmailRecent(Array.isArray(d.recent) ? d.recent : []);
        setGmailSkipSenders(Array.isArray(d.skipSenders) ? d.skipSenders : []);
        setGmailCalendarScope(Boolean(d.calendarScopeGranted));
        setGmailCalendarWrite(Boolean(d.googleCalendarWriteEnabled));
      }
      if (outlookStatus.status === 'fulfilled') {
        const d = outlookStatus.value.data;
        if (d.account && d.account.status !== 'REVOKED') {
          setMicrosoftAccount(prev => prev || d.account);
        }
        setOutlookRecent(Array.isArray(d.recent) ? d.recent : []);
        setOutlookSkipSenders(Array.isArray(d.skipSenders) ? d.skipSenders : []);
      }
    } catch (err) {
      setError('Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── actions ────────────────────────────────────────────── */
  const handleDetect = async () => {
    setStep('DETECTING');
    setError('');
    try {
      const { data } = await integrationsAPI.detect(userEmail);
      setDetectedProvider(data.provider);

      if (data.provider === 'google' && data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      if (data.provider === 'microsoft' && data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      if (data.provider === 'caldav') {
        setCaldavEmail(userEmail);
        setStep('CALDAV_FORM');
        return;
      }
      // unknown → manual selector
      setStep('MANUAL');
    } catch (err) {
      setError(err.response?.data?.error || 'Detection failed');
      setStep('MANUAL');
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setIsWorking(true);
      const { data } = await gmailAgentAPI.connect();
      if (data.authUrl) window.location.href = data.authUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect Google');
      setIsWorking(false);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      setIsWorking(true);
      const { data } = await outlookAgentAPI.connect();
      if (data.authUrl) window.location.href = data.authUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect Outlook');
      setIsWorking(false);
    }
  };

  const handleConnectCalDav = async () => {
    if (!caldavEmail || !caldavPassword) return;
    try {
      setIsWorking(true);
      const { data } = await integrationsAPI.connectCalDav({
        email: caldavEmail,
        password: caldavPassword,
        serverUrl: caldavServerUrl,
      });
      setCaldavAccount(data.account);
      setCaldavPassword('');
      setStep('IDLE');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect CalDAV');
    } finally {
      setIsWorking(false);
    }
  };

  /* ── disconnect helpers ────────────────────────────────── */
  const disconnectGoogle = async () => {
    if (!googleAccount?.id) return;
    try {
      setIsWorking(true);
      await gmailAgentAPI.disconnect(googleAccount.id);
      setGoogleAccount(null);
      setGmailRecent([]);
      setGmailSkipSenders([]);
      setGmailCalendarScope(false);
      setGmailCalendarWrite(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect Google');
    } finally { setIsWorking(false); }
  };

  const disconnectOutlook = async () => {
    if (!microsoftAccount?.id) return;
    try {
      setIsWorking(true);
      await outlookAgentAPI.disconnect(microsoftAccount.id);
      setMicrosoftAccount(null);
      setOutlookRecent([]);
      setOutlookSkipSenders([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect Outlook');
    } finally { setIsWorking(false); }
  };

  const disconnectCalDav = async () => {
    if (!caldavAccount?.id) return;
    try {
      setIsWorking(true);
      await integrationsAPI.disconnectCalDav(caldavAccount.id);
      setCaldavAccount(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect CalDAV');
    } finally { setIsWorking(false); }
  };

  /* ── toggle sync / sync now helpers ────────────────────── */
  const toggleGmailSync = async () => {
    if (!googleAccount?.id) return;
    try {
      setIsWorking(true);
      const { data } = await gmailAgentAPI.updateSettings(googleAccount.id, { syncEnabled: !googleAccount.syncEnabled });
      setGoogleAccount(data.account);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    } finally { setIsWorking(false); }
  };

  const syncGmailNow = async () => {
    if (!googleAccount?.id) return;
    try {
      setIsWorking(true);
      const { data } = await gmailAgentAPI.syncNow(googleAccount.id);
      setGoogleAccount(data.account || googleAccount);
      setGmailRecent(Array.isArray(data.recent) ? data.recent : gmailRecent);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync');
    } finally { setIsWorking(false); }
  };

  const toggleOutlookSync = async () => {
    if (!microsoftAccount?.id) return;
    try {
      setIsWorking(true);
      const { data } = await outlookAgentAPI.updateSettings(microsoftAccount.id, { syncEnabled: !microsoftAccount.syncEnabled });
      setMicrosoftAccount(data.account);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    } finally { setIsWorking(false); }
  };

  const syncOutlookNow = async () => {
    if (!microsoftAccount?.id) return;
    try {
      setIsWorking(true);
      const { data } = await outlookAgentAPI.syncNow(microsoftAccount.id);
      setMicrosoftAccount(data.account || microsoftAccount);
      setOutlookRecent(Array.isArray(data.recent) ? data.recent : outlookRecent);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync');
    } finally { setIsWorking(false); }
  };

  /* ── skip senders (gmail) ─────────────────────────────── */
  const alwaysSkipSender = async (senderEmail, provider) => {
    if (!senderEmail) return;
    try {
      setIsWorking(true);
      if (provider === 'google') {
        const { data } = await gmailAgentAPI.addSkipSender(senderEmail);
        setGmailSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : gmailSkipSenders);
      } else {
        const { data } = await outlookAgentAPI.addSkipSender(senderEmail);
        setOutlookSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : outlookSkipSenders);
      }
      setOpenMenuId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to skip sender');
    } finally { setIsWorking(false); }
  };

  const undoSkipSender = async (ruleId, provider) => {
    try {
      setIsWorking(true);
      if (provider === 'google') {
        const { data } = await gmailAgentAPI.removeSkipSender(ruleId);
        setGmailSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : []);
      } else {
        const { data } = await outlookAgentAPI.removeSkipSender(ruleId);
        setOutlookSkipSenders(Array.isArray(data.skipSenders) ? data.skipSenders : []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to undo skip sender');
    } finally { setIsWorking(false); }
  };

  /* ── derived ────────────────────────────────────────────── */
  const anyConnected = googleAccount || microsoftAccount || caldavAccount;

  /* ── render ─────────────────────────────────────────────── */
  return (
    <>
      {/* ─── Main card ─────────────────────────────────── */}
      <div
        className="card overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
          borderWidth: 1,
        }}
      >
        {/* Gradient accent bar */}
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, #4285F4 0%, #0078D4 33%, #673DE6 66%, #9333EA 100%)',
        }} />

        <div className="card-body">
          {/* ── Header ────────────────────────────────── */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="card-title text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
                <FaEnvelope className="h-5 w-5" />
                Email & Calendar Integration
              </h2>
              <p className="text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>
                One-click connection — Tialz automatically detects your email provider and sets up mail ingestion, calendar sync, and AI task creation.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {googleAccount && (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: 'rgba(66,133,244,.12)', color: '#4285F4' }}>
                  Google
                </span>
              )}
              {microsoftAccount && (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: 'rgba(0,120,212,.12)', color: '#0078D4' }}>
                  Outlook
                </span>
              )}
              {caldavAccount && (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: 'rgba(103,61,230,.12)', color: '#673DE6' }}>
                  CalDAV
                </span>
              )}
              {!anyConnected && (
                <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                  Not connected
                </span>
              )}
            </div>
          </div>

          {/* ── Error ────────────────────────────────── */}
          {error && (
            <div className="rounded-lg border px-3 py-2 text-sm mt-3 flex items-center gap-2" style={{ borderColor: 'rgba(239,68,68,.35)', color: '#ef4444' }}>
              <FaExclamationTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
              <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100"><FaTimes className="h-3 w-3" /></button>
            </div>
          )}

          {/* ── Loading ─────────────────────────────── */}
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 justify-center">
              <FaSpinner className="h-4 w-4 animate-spin" style={{ color: 'var(--color-text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading integrations...</p>
            </div>
          ) : (
            <div className="space-y-6 mt-2">
              {/* ──────── Connected accounts ──────── */}
              {anyConnected && (
                <div className="space-y-4">
                  {/* Google account card */}
                  {googleAccount && (
                    <AccountCard
                      provider="google"
                      account={googleAccount}
                      recent={gmailRecent}
                      skipSenders={gmailSkipSenders}
                      calendarScopeGranted={gmailCalendarScope}
                      googleCalendarWriteEnabled={gmailCalendarWrite}
                      isWorking={isWorking}
                      onToggleSync={toggleGmailSync}
                      onSyncNow={syncGmailNow}
                      onDisconnect={disconnectGoogle}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onAlwaysSkip={(email) => alwaysSkipSender(email, 'google')}
                      onOpenSkipSenders={() => { setSkipSendersProvider('google'); setSkipSendersModalOpen(true); }}
                    />
                  )}

                  {/* Microsoft account card */}
                  {microsoftAccount && (
                    <AccountCard
                      provider="microsoft"
                      account={microsoftAccount}
                      recent={outlookRecent}
                      skipSenders={outlookSkipSenders}
                      isWorking={isWorking}
                      onToggleSync={toggleOutlookSync}
                      onSyncNow={syncOutlookNow}
                      onDisconnect={disconnectOutlook}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onAlwaysSkip={(email) => alwaysSkipSender(email, 'microsoft')}
                      onOpenSkipSenders={() => { setSkipSendersProvider('microsoft'); setSkipSendersModalOpen(true); }}
                    />
                  )}

                  {/* CalDAV account card */}
                  {caldavAccount && (
                    <div
                      className="rounded-xl border p-4 transition-all duration-200"
                      style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg text-white" style={{ background: PROVIDER_META.caldav.gradient }}>
                          <FaServer className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>CalDAV / Hostinger</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{caldavAccount.email}</p>
                        </div>
                        <span className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
                          Connected
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Detail label="Status" value={humanize(caldavAccount.status)} />
                        <Detail label="Connected" value={caldavAccount.createdAt ? new Date(caldavAccount.createdAt).toLocaleString() : 'N/A'} />
                      </div>
                      <div className="mt-3">
                        <IconButton
                          type="button" size="sm" variant="danger"
                          icon={<FaUnlink />} label="Disconnect"
                          disabled={isWorking} onClick={disconnectCalDav}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ──────── Connect launcher ──────── */}
              {step === 'IDLE' && (
                <div
                  className="rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 hover:border-solid"
                  style={{
                    borderColor: anyConnected ? 'var(--color-border-default)' : 'var(--color-primary)',
                    backgroundColor: anyConnected ? 'transparent' : 'rgba(var(--color-primary-rgb, 99,102,241), 0.03)',
                  }}
                >
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    {anyConnected
                      ? 'Connect an additional email account'
                      : `Click the button below to connect your email (${userEmail}). We'll detect your provider automatically.`
                    }
                  </p>
                  <button
                    type="button"
                    onClick={handleDetect}
                    disabled={isWorking}
                    className="inline-flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                    style={{
                      background: 'linear-gradient(135deg, #4285F4 0%, #673DE6 50%, #9333EA 100%)',
                    }}
                  >
                    <FaPlug className="h-4 w-4" />
                    {anyConnected ? 'Connect Another Account' : 'Integrate Email & Calendar'}
                  </button>
                </div>
              )}

              {/* ──────── Detecting state ──────── */}
              {step === 'DETECTING' && (
                <div
                  className="rounded-xl border p-6 text-center"
                  style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  <FaSpinner className="h-6 w-6 animate-spin mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Detecting your email provider...
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    Looking up MX records for {userEmail.split('@')[1]}
                  </p>
                </div>
              )}

              {/* ──────── CalDAV form ──────── */}
              {step === 'CALDAV_FORM' && (
                <div
                  className="rounded-xl border p-5 space-y-4"
                  style={{ borderColor: 'rgba(103,61,230,.35)', backgroundColor: 'rgba(103,61,230,.04)' }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex items-center justify-center h-9 w-9 rounded-xl text-white" style={{ background: PROVIDER_META.caldav.gradient }}>
                      <FaServer className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        CalDAV Provider Detected
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        Your domain uses a CalDAV-compatible provider (e.g. Hostinger, Titan). Enter your credentials below.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
                    <input
                      type="email"
                      value={caldavEmail}
                      onChange={e => setCaldavEmail(e.target.value)}
                      className="w-full p-2.5 rounded-lg border text-sm transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      <FaLock className="inline h-3 w-3 mr-1" />
                      Password / App Password
                    </label>
                    <input
                      type="password"
                      value={caldavPassword}
                      onChange={e => setCaldavPassword(e.target.value)}
                      placeholder="Enter your email password"
                      className="w-full p-2.5 rounded-lg border text-sm transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Server URL (auto-filled)</label>
                    <input
                      type="text"
                      value={caldavServerUrl}
                      onChange={e => setCaldavServerUrl(e.target.value)}
                      className="w-full p-2.5 rounded-lg border text-xs transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-tertiary)',
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleConnectCalDav}
                      disabled={isWorking || !caldavEmail || !caldavPassword}
                      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                      style={{ background: PROVIDER_META.caldav.gradient }}
                    >
                      {isWorking ? <FaSpinner className="h-3.5 w-3.5 animate-spin" /> : <FaCheckCircle className="h-3.5 w-3.5" />}
                      Connect
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep('IDLE'); setCaldavPassword(''); }}
                      className="text-sm font-medium transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    🔒 Your password is encrypted with AES-256-GCM before storage and is never stored in plaintext.
                  </p>
                </div>
              )}

              {/* ──────── Manual provider selection ──────── */}
              {step === 'MANUAL' && (
                <div
                  className="rounded-xl border p-5 space-y-3"
                  style={{ borderColor: 'rgba(245,158,11,.35)', backgroundColor: 'rgba(245,158,11,.06)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FaExclamationTriangle className="h-4 w-4" style={{ color: '#F59E0B' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Could not auto-detect your provider
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Please select your email provider manually:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleConnectGoogle}
                      disabled={isWorking}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                      style={{ background: PROVIDER_META.google.gradient }}
                    >
                      <FaGoogle className="h-3.5 w-3.5" /> Google
                    </button>
                    <button
                      onClick={handleConnectOutlook}
                      disabled={isWorking}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                      style={{ background: PROVIDER_META.microsoft.gradient }}
                    >
                      <FaCloud className="h-3.5 w-3.5" /> Microsoft 365
                    </button>
                    <button
                      onClick={() => { setCaldavEmail(userEmail); setStep('CALDAV_FORM'); }}
                      disabled={isWorking}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                      style={{ background: PROVIDER_META.caldav.gradient }}
                    >
                      <FaServer className="h-3.5 w-3.5" /> CalDAV
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('IDLE')}
                    className="text-xs font-medium mt-1"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    ← Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Skip senders modal ────────────────────────── */}
      {skipSendersModalOpen && (
        <div className="modal modal-open backdrop-blur-sm animate-fadeIn" style={{ zIndex: 55 }}>
          <div
            className="modal-box max-w-lg max-h-[85vh] border flex flex-col"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)' }}
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
                icon={<FaTimes />} label="Close" iconOnly variant="ghost" size="sm"
                onClick={() => { setSkipSendersModalOpen(false); setSkipSendersProvider(null); }}
                className="!p-2 !rounded-full shrink-0"
              />
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 pr-1 -mr-1">
              {(skipSendersProvider === 'google' ? gmailSkipSenders : outlookSkipSenders).length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  No sender addresses are set to always skip.
                </p>
              ) : (
                <div className="space-y-2">
                  {(skipSendersProvider === 'google' ? gmailSkipSenders : outlookSkipSenders).map(rule => (
                    <div key={rule.id} className="flex items-center justify-between rounded-lg border p-3 text-sm gap-3" style={{ borderColor: 'var(--color-border-default)' }}>
                      <p className="truncate min-w-0" style={{ color: 'var(--color-text-primary)' }}>{rule.senderEmail}</p>
                      <button
                        type="button"
                        onClick={() => undoSkipSender(rule.id, skipSendersProvider)}
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
          <div className="modal-backdrop" aria-hidden="true" />
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Sub-component: AccountCard — renders a connected Google or Microsoft
   account with controls, recent activity, etc.
   ═══════════════════════════════════════════════════════════════════════ */
const AccountCard = ({
  provider, account, recent = [], skipSenders = [],
  calendarScopeGranted, googleCalendarWriteEnabled,
  isWorking, onToggleSync, onSyncNow, onDisconnect,
  openMenuId, setOpenMenuId, onAlwaysSkip, onOpenSkipSenders,
}) => {
  const meta = PROVIDER_META[provider] || PROVIDER_META.unknown;
  const connected = account && account.status !== 'REVOKED';
  if (!connected) return null;

  return (
    <div
      className="rounded-xl border p-4 transition-all duration-200"
      style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg text-white" style={{ background: meta.gradient }}>
          {meta.icon}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{meta.label}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{account.email}</p>
        </div>
        <span className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
          Connected
        </span>
      </div>

      {/* Detail grid */}
      <div className="grid gap-3 md:grid-cols-2">
        <Detail label="Status" value={humanize(account.status)} />
        {provider === 'google' && (
          <>
            <Detail label="Google Calendar" value={calendarScopeGranted ? 'Enabled' : 'Not linked'} />
            <Detail
              label="Sync tasks → Google Calendar"
              value={googleCalendarWriteEnabled ? 'On (Tialz calendar)' : calendarScopeGranted ? 'Reconnect to grant' : 'Connect first'}
            />
          </>
        )}
        <Detail label="Auto-create tasks" value={account.syncEnabled ? 'On' : 'Paused'} />
        <Detail label="Last checked" value={account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : 'Not yet'} />
      </div>
      {account.lastError && (
        <p className="mt-3 text-sm" style={{ color: '#ef4444' }}>{account.lastError}</p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <IconButton type="button" size="sm" variant="secondary"
          icon={account.syncEnabled ? <FaPause /> : <FaPlay />}
          label={account.syncEnabled ? 'Pause agent' : 'Resume agent'}
          disabled={isWorking} onClick={onToggleSync}
        />
        <IconButton type="button" size="sm" variant="primary"
          icon={<FaSyncAlt />} label="Check now"
          disabled={isWorking || !account.syncEnabled} onClick={onSyncNow}
        />
        <IconButton type="button" size="sm" variant="secondary"
          icon={<FaUserSlash />}
          label={skipSenders.length > 0 ? `Skipped senders (${skipSenders.length})` : 'Skipped senders'}
          disabled={isWorking} onClick={onOpenSkipSenders}
        />
        <IconButton type="button" size="sm" variant="danger"
          icon={<FaUnlink />} label="Disconnect"
          disabled={isWorking} onClick={onDisconnect}
        />
      </div>

      {/* Recent email activity */}
      {recent.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent email activity</h3>
          <div className="space-y-2">
            {recent.map(item => (
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
                        <button type="button" aria-label="Email actions"
                          onClick={() => setOpenMenuId(prev => (prev === item.id ? null : item.id))}
                          className="rounded-md border p-1.5 text-xs" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                        >
                          <FaEllipsisV className="h-3 w-3" />
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-0 z-10 mt-1 rounded-md border p-1 shadow"
                            style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)' }}
                          >
                            <button type="button" onClick={() => onAlwaysSkip(item.senderEmail)} disabled={isWorking}
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
        </div>
      )}
    </div>
  );
};

export default UnifiedEmailSettings;
