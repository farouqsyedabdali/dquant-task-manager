const prisma = require('../lib/prisma');
const { getOutlookAgentAuthUrl } = require('../services/microsoftAuthService');
const { getOutlookAgentStatus, syncOutlookAccount, PROVIDER } = require('../services/outlookAgentService');
const { scheduleGoogleCalendarSyncForTask } = require('../services/gmailAgentService');
const {
  allowIngestionOnce,
  allowSenderAlways
} = require('../services/emailAllowService');

const getStatus = async (req, res) => {
  try {
    const [status, skipSenders] = await Promise.all([
      getOutlookAgentStatus(req.user.id),
      prisma.emailSenderRule.findMany({
        where: {
          userId: req.user.id,
          provider: PROVIDER,
          alwaysSkip: true
        },
        orderBy: { senderEmail: 'asc' },
        select: { id: true, senderEmail: true, createdAt: true }
      })
    ]);
    res.json({ success: true, ...status, skipSenders });
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

const allowOnce = async (req, res) => {
  try {
    const result = await allowIngestionOnce({
      userId: req.user.id,
      provider: PROVIDER,
      ingestionId: req.params.ingestionId,
      auditAgentName: 'Outlook agent',
      auditSource: 'outlook_agent_allow_once',
      scheduleTask: scheduleGoogleCalendarSyncForTask
    });
    const status = await getOutlookAgentStatus(req.user.id);
    res.json({ success: true, ...result, ...status });
  } catch (error) {
    console.error('Outlook agent allow once error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to allow email once' });
  }
};

const allowAlways = async (req, res) => {
  try {
    const senderEmail = String(req.body?.senderEmail || '').trim().toLowerCase();
    const result = await allowSenderAlways({
      user: req.user,
      provider: PROVIDER,
      senderEmail,
      auditAgentName: 'Outlook agent',
      auditSource: 'outlook_agent_allow_always',
      scheduleTask: scheduleGoogleCalendarSyncForTask
    });
    const status = await getOutlookAgentStatus(req.user.id);
    res.json({ success: true, ...result, ...status });
  } catch (error) {
    console.error('Outlook agent allow always error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to allow sender always' });
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
  allowOnce,
  allowAlways
};
