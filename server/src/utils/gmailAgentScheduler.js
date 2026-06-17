const { syncAllGmailAccounts } = require('../services/gmailAgentService');
const { syncAllOutlookAccounts } = require('../services/outlookAgentService');
const { syncAllHostingerAccounts } = require('../services/hostingerAgentService');

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

async function runOutlookAgentSync() {
  if (process.env.OUTLOOK_AGENT_ENABLED === 'false') {
    return { skipped: true, reason: 'disabled' };
  }

  console.log('📬 Starting Outlook agent sync...');
  const result = await syncAllOutlookAccounts();
  console.log(`📬 Outlook agent sync complete: ${result.accountsProcessed} account(s) checked`);
  return result;
}

async function runHostingerAgentSync() {
  if (process.env.HOSTINGER_AGENT_ENABLED === 'false') {
    return { skipped: true, reason: 'disabled' };
  }

  console.log('📬 Starting Hostinger agent sync...');
  const result = await syncAllHostingerAccounts();
  console.log(`📬 Hostinger agent sync complete: ${result.accountsProcessed} account(s) checked`);
  return result;
}

async function runEmailAgentSync() {
  const combined = { gmail: null, outlook: null, hostinger: null };
  if (process.env.GMAIL_AGENT_ENABLED !== 'false') {
    combined.gmail = await runGmailAgentSync();
  } else {
    combined.gmail = { skipped: true, reason: 'disabled' };
  }
  if (process.env.OUTLOOK_AGENT_ENABLED !== 'false') {
    combined.outlook = await runOutlookAgentSync();
  } else {
    combined.outlook = { skipped: true, reason: 'disabled' };
  }
  if (process.env.HOSTINGER_AGENT_ENABLED !== 'false') {
    combined.hostinger = await runHostingerAgentSync();
  } else {
    combined.hostinger = { skipped: true, reason: 'disabled' };
  }
  return combined;
}

function startGmailAgentScheduler() {
  if (process.env.GMAIL_AGENT_ENABLED === 'false' && process.env.OUTLOOK_AGENT_ENABLED === 'false' && process.env.HOSTINGER_AGENT_ENABLED === 'false') {
    console.log('📬 Email agent schedulers disabled (Gmail, Outlook, and Hostinger)');
    return null;
  }

  const intervalMs = Number(process.env.GMAIL_AGENT_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  console.log(
    `📬 Starting email agent scheduler (every ${Math.round(intervalMs / 1000)}s) — Gmail: ${process.env.GMAIL_AGENT_ENABLED === 'false' ? 'off' : 'on'}, Outlook: ${process.env.OUTLOOK_AGENT_ENABLED === 'false' ? 'off' : 'on'}`
  );

  runEmailAgentSync().catch((error) => {
    console.error('Error in initial email agent sync:', error);
  });

  const intervalId = setInterval(() => {
    runEmailAgentSync().catch((error) => {
      console.error('Error in scheduled email agent sync:', error);
    });
  }, intervalMs);

  return intervalId;
}

module.exports = {
  runGmailAgentSync,
  runOutlookAgentSync,
  runHostingerAgentSync,
  runEmailAgentSync,
  startGmailAgentScheduler
};
