const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validators');
const {
  detectEmailProvider,
  connectCalDav,
  disconnectCalDav,
  getIntegrationsStatus
} = require('../controllers/integrationsController');

const router = express.Router();

router.use(auth);

// Auto-detect email provider via MX records
router.get('/detect', detectEmailProvider);

// Aggregated status for all providers (Google, Microsoft, CalDAV)
router.get('/status', getIntegrationsStatus);

// CalDAV credential-based connection
router.post(
  '/caldav/connect',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  connectCalDav
);

// CalDAV disconnect
router.post('/caldav/:accountId/disconnect', disconnectCalDav);

module.exports = router;
