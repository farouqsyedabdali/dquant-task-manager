const { syncAllGmailAccounts } = require('../services/gmailAgentService');

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

async function runGmailAgentSync() {
  if (process.env.GMAIL_AGENT_ENABLED === 'false') {
    return { skipped: true, reason: 'disabled' };
  }

  console.log('📬 Starting Gmail agent sync...');
  const result = await syncAllGmailAccounts();
  console.log(`📬 Gmail agent sync complete: ${result.accountsProcessed} account(s) checked`);
  return result;
}

function startGmailAgentScheduler() {
  if (process.env.GMAIL_AGENT_ENABLED === 'false') {
    console.log('📬 Gmail agent scheduler disabled');
    return null;
  }

  const intervalMs = Number(process.env.GMAIL_AGENT_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  console.log(`📬 Starting Gmail agent scheduler (every ${Math.round(intervalMs / 1000)}s)`);

  runGmailAgentSync().catch((error) => {
    console.error('Error in initial Gmail agent sync:', error);
  });

  const intervalId = setInterval(() => {
    runGmailAgentSync().catch((error) => {
      console.error('Error in scheduled Gmail agent sync:', error);
    });
  }, intervalMs);

  return intervalId;
}

module.exports = {
  runGmailAgentSync,
  startGmailAgentScheduler
};
