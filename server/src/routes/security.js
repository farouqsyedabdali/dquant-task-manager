const express = require('express');
const { 
  getFailedLogins, 
  getSuspiciousActivity, 
  generateSecurityReport, 
  getUserSessions, 
  resetAllPasswords, 
  lockSuspiciousAccounts 
} = require('../controllers/securityController');
const auth = require('../middleware/auth');
const { superAdminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication and super admin role
router.use(auth);
router.use(superAdminOnly);

// Security monitoring routes
router.get('/failed-logins', getFailedLogins);
router.get('/suspicious-activity', getSuspiciousActivity);
router.get('/security-report', generateSecurityReport);
router.get('/user-sessions', getUserSessions);

// Security actions
router.post('/reset-all-passwords', resetAllPasswords);
router.post('/lock-suspicious-accounts', lockSuspiciousAccounts);

module.exports = router;
