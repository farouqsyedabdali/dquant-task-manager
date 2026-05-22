const prisma = require('../lib/prisma');
const {
  validateImapCredentials,
  upsertHostingerAccount,
  getHostingerAgentStatus,
  syncHostingerAccount,
  PROVIDER,
} = require('../services/hostingerAgentService');

const getStatus = async (req, res) => {
  try {
    const [status, skipSenders] = await Promise.all([
      getHostingerAgentStatus(req.user.id),
      prisma.emailSenderRule.findMany({
        where: {
          userId: req.user.id,
          provider: PROVIDER,
          alwaysSkip: true,
        },
        orderBy: { senderEmail: 'asc' },
        select: { id: true, senderEmail: true, createdAt: true },
      }),
    ]);
    res.json({ success: true, ...status, skipSenders });
  } catch (error) {
    console.error('Hostinger agent status error:', error);
    res.status(500).json({ error: 'Failed to fetch Hostinger agent status' });
  }
};

const connect = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate IMAP credentials before saving
    const { host } = await validateImapCredentials(email, password);

    // Check if user already has a different provider connected
    const existingAccounts = await prisma.connectedAccount.findMany({
      where: {
        userId: req.user.id,
        status: { not: 'REVOKED' },
        provider: { not: PROVIDER },
      },
    });

    if (existingAccounts.length > 0) {
      return res.status(409).json({
        error: 'You already have another email provider connected. Please disconnect it first before connecting Hostinger.',
        existingProvider: existingAccounts[0].provider,
      });
    }

    // Upsert the account
    const account = await upsertHostingerAccount({
      userId: req.user.id,
      email,
      password,
      host,
    });

    res.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        status: account.status,
        syncEnabled: account.syncEnabled,
        lastSyncedAt: account.lastSyncedAt,
        lastError: account.lastError,
      },
    });
  } catch (error) {
    console.error('Hostinger agent connect error:', error);
    const message = error.message || 'Failed to connect Hostinger email';
    // Return 401 for auth failures, 500 for everything else
    const status = message.toLowerCase().includes('auth') ||
                   message.toLowerCase().includes('login') ||
                   message.toLowerCase().includes('password')
      ? 401
      : 500;
    res.status(status).json({ error: message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { syncEnabled } = req.body;
    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: Number(req.params.accountId),
        userId: req.user.id,
        provider: PROVIDER,
      },
    });

    if (!account) return res.status(404).json({ error: 'Hostinger connection not found' });

    const updated = await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        syncEnabled: Boolean(syncEnabled),
        status: Boolean(syncEnabled) ? 'ACTIVE' : account.status,
      },
      select: {
        id: true,
        email: true,
        status: true,
        syncEnabled: true,
        lastSyncedAt: true,
        lastError: true,
      },
    });

    res.json({ success: true, account: updated });
  } catch (error) {
    console.error('Hostinger agent settings error:', error);
    res.status(500).json({ error: 'Failed to update Hostinger agent settings' });
  }
};

const disconnect = async (req, res) => {
  try {
    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: Number(req.params.accountId),
        userId: req.user.id,
        provider: PROVIDER,
      },
    });

    if (!account) return res.status(404).json({ error: 'Hostinger connection not found' });

    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        status: 'REVOKED',
        syncEnabled: false,
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Hostinger agent disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Hostinger agent' });
  }
};

const runSyncNow = async (req, res) => {
  try {
    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: Number(req.params.accountId),
        userId: req.user.id,
        provider: PROVIDER,
      },
    });

    if (!account) return res.status(404).json({ error: 'Hostinger connection not found' });

    const result = await syncHostingerAccount(account);
    const status = await getHostingerAgentStatus(req.user.id);
    res.json({ success: true, result, ...status });
  } catch (error) {
    console.error('Hostinger agent manual sync error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync Hostinger email' });
  }
};

const addSkipSender = async (req, res) => {
  try {
    const senderEmail = String(req.body?.senderEmail || '').trim().toLowerCase();
    if (!senderEmail) return res.status(400).json({ error: 'senderEmail is required' });

    await prisma.emailSenderRule.upsert({
      where: {
        userId_provider_senderEmail: {
          userId: req.user.id,
          provider: PROVIDER,
          senderEmail,
        },
      },
      create: {
        userId: req.user.id,
        companyId: req.user.companyId,
        provider: PROVIDER,
        senderEmail,
        alwaysSkip: true,
      },
      update: { alwaysSkip: true },
    });

    const skipSenders = await prisma.emailSenderRule.findMany({
      where: { userId: req.user.id, provider: PROVIDER, alwaysSkip: true },
      orderBy: { senderEmail: 'asc' },
      select: { id: true, senderEmail: true, createdAt: true },
    });
    res.json({ success: true, skipSenders });
  } catch (error) {
    console.error('Hostinger agent add skip sender error:', error);
    res.status(500).json({ error: 'Failed to add always-skip sender' });
  }
};

const removeSkipSender = async (req, res) => {
  try {
    const id = Number(req.params.ruleId);
    if (!id) return res.status(400).json({ error: 'Invalid rule id' });

    const rule = await prisma.emailSenderRule.findFirst({
      where: { id, userId: req.user.id, provider: PROVIDER },
    });
    if (!rule) return res.status(404).json({ error: 'Skip sender rule not found' });

    await prisma.emailSenderRule.delete({ where: { id } });
    const skipSenders = await prisma.emailSenderRule.findMany({
      where: { userId: req.user.id, provider: PROVIDER, alwaysSkip: true },
      orderBy: { senderEmail: 'asc' },
      select: { id: true, senderEmail: true, createdAt: true },
    });
    res.json({ success: true, skipSenders });
  } catch (error) {
    console.error('Hostinger agent remove skip sender error:', error);
    res.status(500).json({ error: 'Failed to remove always-skip sender' });
  }
};

module.exports = {
  getStatus,
  connect,
  updateSettings,
  disconnect,
  runSyncNow,
  addSkipSender,
  removeSkipSender,
};
