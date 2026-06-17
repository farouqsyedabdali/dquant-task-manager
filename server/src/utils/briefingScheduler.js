const secureLogger = require('../middleware/secureLogger');
const { tickBriefings } = require('../services/briefingService');

function startBriefingScheduler() {
  secureLogger.info('📋 Briefing scheduler: every 60s');
  tickBriefings().catch((e) =>
    secureLogger.warn('Briefing tick failed', { message: e.message }),
  );
  setInterval(() => {
    tickBriefings().catch((e) =>
      secureLogger.warn('Briefing tick failed', { message: e.message }),
    );
  }, 60 * 1000);
}

module.exports = { startBriefingScheduler };
