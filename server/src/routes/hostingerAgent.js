const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validators');
const {
  connect,
  disconnect,
  getStatus,
  runSyncNow,
  updateSettings,
  addSkipSender,
  removeSkipSender,
  allowOnce,
  allowAlways,
} = require('../controllers/hostingerAgentController');

const router = express.Router();

router.use(auth);

router.get('/status', getStatus);
router.post(
  '/connect',
  body('email').isEmail().withMessage('email must be a valid email'),
  body('password').trim().notEmpty().withMessage('password is required'),
  handleValidationErrors,
  connect
);
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
