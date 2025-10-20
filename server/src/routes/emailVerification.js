const express = require('express');
const router = express.Router();
const {
  sendVerificationEmail,
  verifyEmail,
  checkVerificationStatus
} = require('../controllers/emailVerificationController');

// Logging middleware for debugging
router.use((req, res, next) => {
  console.log('🔔 Email verification route hit:', req.method, req.path);
  console.log('Request body:', req.body);
  next();
});

// Send verification email
router.post('/send', sendVerificationEmail);

// Verify email with token
router.post('/verify', verifyEmail);

// Check verification status
router.get('/status', checkVerificationStatus);

module.exports = router;
