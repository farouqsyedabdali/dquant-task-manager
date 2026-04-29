const prisma = require('../lib/prisma');
const { getGmailAgentAuthUrl } = require('../services/googleAuthService');
const { getGmailAgentStatus, syncGmailAccount } = require('../services/gmailAgentService');

const getStatus = async (req, res) => {
  try {
    const status = await getGmailAgentStatus(req.user.id);
    res.json({ success: true, ...status });
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
        encryptedRefreshToken: null
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

module.exports = {
  getStatus,
  connect,
  updateSettings,
  disconnect,
  runSyncNow
};
