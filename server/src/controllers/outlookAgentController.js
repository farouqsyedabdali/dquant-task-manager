const prisma = require('../lib/prisma');
const { getOutlookAgentAuthUrl } = require('../services/microsoftAuthService');
const { getOutlookAgentStatus, syncOutlookAccount, PROVIDER } = require('../services/outlookAgentService');

const getStatus = async (req, res) => {
  try {
    const status = await getOutlookAgentStatus(req.user.id);
    res.json({ success: true, ...status });
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

module.exports = {
  getStatus,
  connect,
  updateSettings,
  disconnect,
  runSyncNow
};
