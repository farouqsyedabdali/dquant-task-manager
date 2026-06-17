const { purgeExpiredNotifications } = require('./notificationRetention');
const secureLogger = require('../middleware/secureLogger');

const DAY_MS = 24 * 60 * 60 * 1000;

let intervalId = null;

async function runNotificationCleanup() {
  try {
    const deleted = await purgeExpiredNotifications();
    if (deleted > 0) {
      secureLogger.info(`🗑️ Notification retention: removed ${deleted} notification(s) older than 3 months`);
    }
  } catch (err) {
    secureLogger.error('Notification cleanup failed', { message: err.message });
  }
}

function startNotificationCleanupScheduler() {
  if (intervalId != null) return;
  console.log('🔔 Starting notification cleanup scheduler (daily — 3 month retention)...');
  void runNotificationCleanup();
  intervalId = setInterval(runNotificationCleanup, DAY_MS);
  console.log('✅ Notification cleanup scheduler started');
}

function stopNotificationCleanupScheduler() {
  if (intervalId != null) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🛑 Notification cleanup scheduler stopped');
  }
}

module.exports = {
  startNotificationCleanupScheduler,
  stopNotificationCleanupScheduler,
  runNotificationCleanup
};
