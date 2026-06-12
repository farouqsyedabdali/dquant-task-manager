const prisma = require('../lib/prisma');
const { getOutlookAgentAuthUrl } = require('../services/microsoftAuthService');
const { getOutlookAgentStatus, syncOutlookAccount, PROVIDER } = require('../services/outlookAgentService');

const getStatus = async (req, res) => {
  try {
    const [status, rules] = await Promise.all([
      getOutlookAgentStatus(req.user.id),
      prisma.emailSenderRule.findMany({
        where: {
          userId: req.user.id,
          provider: PROVIDER
        },
        orderBy: { senderEmail: 'asc' },
        select: { id: true, senderEmail: true, alwaysSkip: true, alwaysAllow: true, createdAt: true }
      })
    ]);
    const skipSenders = rules.filter((r) => r.alwaysSkip);
    const allowSenders = rules.filter((r) => r.alwaysAllow);
    res.json({ success: true, ...status, skipSenders, allowSenders });
  } catch (error) {
    console.error('Outlook agent status error:', error);
    res.status(500).json({ error: 'Failed to fetch Outlook agent status' });
  }
};

const connect = async (req, res) => {
  try {
    const authUrl = getOutlookAgentAuthUrl(req.user.id);
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Outlook agent connect error:', error);
    res.status(500).json({ error: error.message || 'Failed to start Outlook connection' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { syncEnabled } = req.body;
    const account = await prisma.connectedAccount.findFirst({
      where: { id: Number(req.params.accountId), userId: req.user.id, provider: PROVIDER }
    });

    if (!account) return res.status(404).json({ error: 'Outlook connection not found' });

    const updated = await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        syncEnabled: Boolean(syncEnabled),
        status: Boolean(syncEnabled) ? 'ACTIVE' : account.status
      },
      select: {
        id: true,
        email: true,
        status: true,
        syncEnabled: true,
        lastSyncedAt: true,
        lastError: true
      }
    });

    res.json({ success: true, account: updated });
  } catch (error) {
    console.error('Outlook agent settings error:', error);
    res.status(500).json({ error: 'Failed to update Outlook agent settings' });
  }
};

const disconnect = async (req, res) => {
  try {
    const account = await prisma.connectedAccount.findFirst({
      where: { id: Number(req.params.accountId), userId: req.user.id, provider: PROVIDER }
    });

    if (!account) return res.status(404).json({ error: 'Outlook connection not found' });

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
    console.error('Outlook agent disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Outlook agent' });
  }
};

const runSyncNow = async (req, res) => {
  try {
    const account = await prisma.connectedAccount.findFirst({
      where: { id: Number(req.params.accountId), userId: req.user.id, provider: PROVIDER }
    });

    if (!account) return res.status(404).json({ error: 'Outlook connection not found' });

    const result = await syncOutlookAccount(account);
    const status = await getOutlookAgentStatus(req.user.id);
    res.json({ success: true, result, ...status });
  } catch (error) {
    console.error('Outlook agent manual sync error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync Outlook' });
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
          senderEmail
        }
      },
      create: {
        userId: req.user.id,
        companyId: req.user.companyId,
        provider: PROVIDER,
        senderEmail,
        alwaysSkip: true
      },
      update: { alwaysSkip: true }
    });

    const skipSenders = await prisma.emailSenderRule.findMany({
      where: { userId: req.user.id, provider: PROVIDER, alwaysSkip: true },
      orderBy: { senderEmail: 'asc' },
      select: { id: true, senderEmail: true, createdAt: true }
    });
    res.json({ success: true, skipSenders });
  } catch (error) {
    console.error('Outlook agent add skip sender error:', error);
    res.status(500).json({ error: 'Failed to add always-skip sender' });
  }
};

const removeSkipSender = async (req, res) => {
  try {
    const id = Number(req.params.ruleId);
    if (!id) return res.status(400).json({ error: 'Invalid rule id' });

    const rule = await prisma.emailSenderRule.findFirst({
      where: { id, userId: req.user.id, provider: PROVIDER }
    });
    if (!rule) return res.status(404).json({ error: 'Skip sender rule not found' });

    await prisma.emailSenderRule.delete({ where: { id } });
    const skipSenders = await prisma.emailSenderRule.findMany({
      where: { userId: req.user.id, provider: PROVIDER, alwaysSkip: true },
      orderBy: { senderEmail: 'asc' },
      select: { id: true, senderEmail: true, createdAt: true }
    });
    res.json({ success: true, skipSenders });
  } catch (error) {
    console.error('Outlook agent remove skip sender error:', error);
    res.status(500).json({ error: 'Failed to remove always-skip sender' });
  }
};

const addAllowSender = async (req, res) => {
  try {
    const senderEmail = String(req.body?.senderEmail || '').trim().toLowerCase();
    if (!senderEmail) return res.status(400).json({ error: 'senderEmail is required' });

    await prisma.emailSenderRule.upsert({
      where: {
        userId_provider_senderEmail: {
          userId: req.user.id,
          provider: PROVIDER,
          senderEmail
        }
      },
      create: {
        userId: req.user.id,
        companyId: req.user.companyId,
        provider: PROVIDER,
        senderEmail,
        alwaysSkip: false,
        alwaysAllow: true
      },
      update: { alwaysSkip: false, alwaysAllow: true }
    });

    const rules = await prisma.emailSenderRule.findMany({
      where: { userId: req.user.id, provider: PROVIDER },
      orderBy: { senderEmail: 'asc' },
      select: { id: true, senderEmail: true, alwaysSkip: true, alwaysAllow: true, createdAt: true }
    });
    const allowSenders = rules.filter((r) => r.alwaysAllow);
    res.json({ success: true, allowSenders });
  } catch (error) {
    console.error('Outlook agent add allow sender error:', error);
    res.status(500).json({ error: 'Failed to add always-allow sender' });
  }
};

const removeAllowSender = async (req, res) => {
  try {
    const id = Number(req.params.ruleId);
    if (!id) return res.status(400).json({ error: 'Invalid rule id' });

    const rule = await prisma.emailSenderRule.findFirst({
      where: { id, userId: req.user.id, provider: PROVIDER }
    });
    if (!rule) return res.status(404).json({ error: 'Allow sender rule not found' });

    await prisma.emailSenderRule.delete({ where: { id } });
    const rules = await prisma.emailSenderRule.findMany({
      where: { userId: req.user.id, provider: PROVIDER },
      orderBy: { senderEmail: 'asc' },
      select: { id: true, senderEmail: true, alwaysSkip: true, alwaysAllow: true, createdAt: true }
    });
    const allowSenders = rules.filter((r) => r.alwaysAllow);
    res.json({ success: true, allowSenders });
  } catch (error) {
    console.error('Outlook agent remove allow sender error:', error);
    res.status(500).json({ error: 'Failed to remove always-allow sender' });
  }
};

const processIngestionAction = async (req, res) => {
  try {
    const ingestionId = Number(req.params.ingestionId);
    const { action } = req.body;
    if (!ingestionId) return res.status(400).json({ error: 'Invalid ingestion id' });
    if (!['allow_once', 'always_allow', 'skip_once'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    const { handleIngestionAction } = require('../services/emailAgentShared');
    const result = await handleIngestionAction({
      userId: req.user.id,
      companyId: req.user.companyId,
      ingestionId,
      action
    });

    res.json(result);
  } catch (error) {
    console.error('Outlook process ingestion action error:', error);
    res.status(500).json({ error: error.message || 'Failed to process email action' });
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
  addAllowSender,
  removeAllowSender,
  processIngestionAction
};
