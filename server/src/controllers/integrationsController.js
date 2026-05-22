const prisma = require('../lib/prisma');
const { detectProvider } = require('../utils/providerDetector');
const { encryptToken, decryptToken } = require('../utils/tokenCrypto');
const { getGmailAgentAuthUrl } = require('../services/googleAuthService');
const { getOutlookAgentAuthUrl } = require('../services/microsoftAuthService');

// ─── Detect email provider ──────────────────────────────────────────────────
const detectEmailProvider = async (req, res) => {
  try {
    const email = req.query.email || req.user.email;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const provider = await detectProvider(email);
    let authUrl = null;

    if (provider === 'google') {
      authUrl = getGmailAgentAuthUrl(req.user.id);
    } else if (provider === 'microsoft') {
      authUrl = getOutlookAgentAuthUrl(req.user.id);
    }
    // caldav and unknown → no redirect, frontend handles the form / manual picker

    res.json({ success: true, provider, email, authUrl });
  } catch (error) {
    console.error('Provider detection error:', error);
    res.status(500).json({ error: 'Failed to detect email provider' });
  }
};

// ─── Connect CalDAV ─────────────────────────────────────────────────────────
const connectCalDav = async (req, res) => {
  try {
    const { email, password, serverUrl } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const caldavServerUrl = serverUrl || `https://mail.hostinger.com/dav/`;

    // Encrypt credentials (AES-256-GCM via tokenCrypto)
    const encryptedPassword = encryptToken(password);
    const encryptedServerUrl = encryptToken(caldavServerUrl);

    // Upsert — one CalDAV account per user per email
    const account = await prisma.connectedAccount.upsert({
      where: {
        provider_userId_email: {
          provider: 'CALDAV',
          userId: req.user.id,
          email: email.toLowerCase()
        }
      },
      update: {
        encryptedAccessToken: encryptedPassword,
        encryptedRefreshToken: encryptedServerUrl,
        status: 'ACTIVE',
        syncEnabled: true,
        lastError: null
      },
      create: {
        provider: 'CALDAV',
        email: email.toLowerCase(),
        encryptedAccessToken: encryptedPassword,
        encryptedRefreshToken: encryptedServerUrl,
        status: 'ACTIVE',
        syncEnabled: true,
        userId: req.user.id,
        companyId: req.user.companyId
      },
      select: {
        id: true,
        email: true,
        status: true,
        syncEnabled: true,
        lastSyncedAt: true,
        lastError: true,
        createdAt: true
      }
    });

    res.json({ success: true, account });
  } catch (error) {
    console.error('CalDAV connect error:', error);
    res.status(500).json({ error: 'Failed to connect CalDAV account' });
  }
};

// ─── Disconnect CalDAV ──────────────────────────────────────────────────────
const disconnectCalDav = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await prisma.connectedAccount.findFirst({
      where: { id: Number(accountId), userId: req.user.id, provider: 'CALDAV' }
    });

    if (!account) {
      return res.status(404).json({ error: 'CalDAV connection not found' });
    }

    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        status: 'REVOKED',
        syncEnabled: false,
        encryptedAccessToken: null,
        encryptedRefreshToken: null
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('CalDAV disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect CalDAV account' });
  }
};

// ─── Aggregated integrations status ─────────────────────────────────────────
const getIntegrationsStatus = async (req, res) => {
  try {
    const accounts = await prisma.connectedAccount.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        provider: true,
        email: true,
        status: true,
        syncEnabled: true,
        lastSyncedAt: true,
        lastError: true,
        scopes: true,
        tialzGoogleCalendarId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Determine which providers are actively connected
    const connected = {
      google: accounts.find(a => a.provider === 'GOOGLE_GMAIL' && a.status !== 'REVOKED') || null,
      microsoft: accounts.find(a => a.provider === 'MICROSOFT_OUTLOOK' && a.status !== 'REVOKED') || null,
      caldav: accounts.find(a => a.provider === 'CALDAV' && a.status !== 'REVOKED') || null,
    };

    res.json({ success: true, connected, accounts });
  } catch (error) {
    console.error('Integrations status error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations status' });
  }
};

module.exports = {
  detectEmailProvider,
  connectCalDav,
  disconnectCalDav,
  getIntegrationsStatus
};
