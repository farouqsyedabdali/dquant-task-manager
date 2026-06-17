const express = require('express');
const { body, query } = require('express-validator');
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validators');
const {
  connect,
  disconnect,
  getStatus,
  runSyncNow,
  updateSettings,
  getCalendarEvents,
  addSkipSender,
  removeSkipSender,
  allowOnce,
  allowAlways
} = require('../controllers/gmailAgentController');

const router = express.Router();

router.use(auth);

router.get('/status', getStatus);
router.get(
  '/calendar/events',
  query('timeMin').notEmpty().isISO8601().withMessage('timeMin must be a valid ISO 8601 datetime'),
  query('timeMax').notEmpty().isISO8601().withMessage('timeMax must be a valid ISO 8601 datetime'),
  handleValidationErrors,
  getCalendarEvents
);
router.post('/connect', connect);
router.patch(
  '/accounts/:accountId',
  body('syncEnabled').isBoolean().withMessage('syncEnabled must be a boolean'),
  handleValidationErrors,
  updateSettings
);
router.post('/accounts/:accountId/sync', runSyncNow);
router.post('/accounts/:accountId/disconnect', disconnect);
router.post(
  '/skip-senders',
  body('senderEmail').isEmail().withMessage('senderEmail must be a valid email'),
  handleValidationErrors,
  addSkipSender
);
router.delete('/skip-senders/:ruleId', removeSkipSender);
router.post('/ingestions/:ingestionId/allow-once', allowOnce);
router.post(
  '/allow-senders',
  body('senderEmail').isEmail().withMessage('senderEmail must be a valid email'),
  handleValidationErrors,
  allowAlways
);

module.exports = router;
