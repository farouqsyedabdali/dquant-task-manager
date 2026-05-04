const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validators');
const {
  connect,
  disconnect,
  getStatus,
  runSyncNow,
  updateSettings
} = require('../controllers/outlookAgentController');

const router = express.Router();

router.use(auth);

router.get('/status', getStatus);
router.post('/connect', connect);
router.patch(
  '/accounts/:accountId',
  body('syncEnabled').isBoolean().withMessage('syncEnabled must be a boolean'),
  handleValidationErrors,
  updateSettings
);
router.post('/accounts/:accountId/sync', runSyncNow);
router.post('/accounts/:accountId/disconnect', disconnect);

module.exports = router;
