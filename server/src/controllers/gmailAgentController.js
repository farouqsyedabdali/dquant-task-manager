const prisma = require('../lib/prisma');
const { getGmailAgentAuthUrl } = require('../services/googleAuthService');
const {
  getGmailAgentStatus,
  syncGmailAccount,
  listGoogleCalendarEventsForUser,
  scheduleGoogleCalendarSyncForTask
} = require('../services/gmailAgentService');
const {
  allowIngestionOnce,
  allowSenderAlways
} = require('../services/emailAllowService');

const getStatus = async (req, res) => {
  try {
    const [status, skipSenders] = await Promise.all([
      getGmailAgentStatus(req.user.id),
      prisma.emailSenderRule.findMany({
        where: {
          userId: req.user.id,
          provider: 'GOOGLE_GMAIL',
          alwaysSkip: true
        },
        orderBy: { senderEmail: 'asc' },
        select: { id: true, senderEmail: true, createdAt: true }
      })
    ]);
    res.json({ success: true, ...status, skipSenders });
  } catch (error) {
    console.error('Gmail agent status error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail agent status' });
  }
};

const connect = async (req, res) => {
  try {
    const authUrl = getGmailAgentAuthUrl(req.user.id);
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Gmail agent connect error:', error);
    res.status(500).json({ error: 'Failed to start Gmail connection' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { syncEnabled } = req.body;
    const account = await prisma.connectedAccount.findFirst({
      where: { id: Number(req.params.accountId), userId: req.user.id, provider: 'GOOGLE_GMAIL' }
    });

    if (!account) return res.status(404).json({ error: 'Gmail connection not found' });

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
    console.error('Gmail agent settings error:', error);
    res.status(500).json({ error: 'Failed to update Gmail agent settings' });
  }
};

const disconnect = async (req, res) => {
  try {
    const account = await prisma.connectedAccount.findFirst({
      where: { id: Number(req.params.accountId), userId: req.user.id, provider: 'GOOGLE_GMAIL' }
    });

    if (!account) return res.status(404).json({ error: 'Gmail connection not found' });

    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        status: 'REVOKED',
        syncEnabled: false,
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        tialzGoogleCalendarId: null
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Gmail agent disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail agent' });
  }
};

const runSyncNow = async (req, res) => {
  try {
    const account = await prisma.connectedAccount.findFirst({
      where: { id: Number(req.params.accountId), userId: req.user.id, provider: 'GOOGLE_GMAIL' }
    });

    if (!account) return res.status(404).json({ error: 'Gmail connection not found' });

    const result = await syncGmailAccount(account);
    const status = await getGmailAgentStatus(req.user.id);
    res.json({ success: true, result, ...status });
  } catch (error) {
    console.error('Gmail agent manual sync error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync Gmail' });
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
          provider: 'GOOGLE_GMAIL',
          senderEmail
        }
      },
      create: {
        userId: req.user.id,
        companyId: req.user.companyId,
        provider: 'GOOGLE_GMAIL',
        senderEmail,
        alwaysSkip: true
      },
      update: { alwaysSkip: true }
    });

    const skipSenders = await prisma.emailSenderRule.findMany({
      where: { userId: req.user.id, provider: 'GOOGLE_GMAIL', alwaysSkip: true },
      orderBy: { senderEmail: 'asc' },
      select: { id: true, senderEmail: true, createdAt: true }
    });
    res.json({ success: true, skipSenders });
  } catch (error) {
    console.error('Gmail agent add skip sender error:', error);
    res.status(500).json({ error: 'Failed to add always-skip sender' });
  }
};

const getCalendarEvents = async (req, res) => {
  try {
    const { timeMin, timeMax } = req.query;
    const result = await listGoogleCalendarEventsForUser(req.user.id, { timeMin, timeMax });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Google Calendar events error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch Google Calendar events' });
  }
};

const removeSkipSender = async (req, res) => {
  try {
    const id = Number(req.params.ruleId);
    if (!id) return res.status(400).json({ error: 'Invalid rule id' });

    const rule = await prisma.emailSenderRule.findFirst({
      where: { id, userId: req.user.id, provider: 'GOOGLE_GMAIL' }
    });
    if (!rule) return res.status(404).json({ error: 'Skip sender rule not found' });

    await prisma.emailSenderRule.delete({ where: { id } });
    const skipSenders = await prisma.emailSenderRule.findMany({
      where: { userId: req.user.id, provider: 'GOOGLE_GMAIL', alwaysSkip: true },
      orderBy: { senderEmail: 'asc' },
      select: { id: true, senderEmail: true, createdAt: true }
    });
    res.json({ success: true, skipSenders });
  } catch (error) {
    console.error('Gmail agent remove skip sender error:', error);
    res.status(500).json({ error: 'Failed to remove always-skip sender' });
  }
};

const allowOnce = async (req, res) => {
  try {
    const result = await allowIngestionOnce({
      userId: req.user.id,
      provider: 'GOOGLE_GMAIL',
      ingestionId: req.params.ingestionId,
      auditAgentName: 'Gmail agent',
      auditSource: 'gmail_agent_allow_once',
      scheduleTask: scheduleGoogleCalendarSyncForTask
    });
    const status = await getGmailAgentStatus(req.user.id);
    res.json({ success: true, ...result, ...status });
  } catch (error) {
    console.error('Gmail agent allow once error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to allow email once' });
  }
};

const allowAlways = async (req, res) => {
  try {
    const senderEmail = String(req.body?.senderEmail || '').trim().toLowerCase();
    const result = await allowSenderAlways({
      user: req.user,
      provider: 'GOOGLE_GMAIL',
      senderEmail,
      auditAgentName: 'Gmail agent',
      auditSource: 'gmail_agent_allow_always',
      scheduleTask: scheduleGoogleCalendarSyncForTask
    });
    const status = await getGmailAgentStatus(req.user.id);
    res.json({ success: true, ...result, ...status });
  } catch (error) {
    console.error('Gmail agent allow always error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to allow sender always' });
  }
};

module.exports = {
  getStatus,
  connect,
  updateSettings,
  disconnect,
  runSyncNow,
  getCalendarEvents,
  addSkipSender,
  removeSkipSender,
  allowOnce,
  allowAlways
};
