const express = require('express');
const { body } = require('express-validator');
const { login, register, registerCompany, registerPersonal, deleteCompany, getMe, updateAutoArchivePeriod, forgotPassword, verifyPasswordResetCode, resetPasswordWithCode, completeEmployeeSetup } = require('../controllers/authController');
const { initiateGoogleAuth, handleGoogleCallback, handleGoogleIdToken } = require('../controllers/googleAuthController');
const { handleMicrosoftCallback } = require('../controllers/microsoftAuthController');
const auth = require('../middleware/auth');
const { adminOnly, sysAdminOnly } = require('../middleware/roleCheck');
const { validators, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

// Public routes
router.post('/login', 
  validators.email('email'),
  validators.email('companyEmail', true),
  body('password').trim().notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  login
);

router.post('/register-company',
  validators.companyName('name'),
  validators.email('email'),
  validators.name('adminName'),
  validators.email('adminEmail'),
  validators.password('password', 6), // Match frontend requirement of 6 characters
  handleValidationErrors,
  registerCompany
);

router.post('/register-personal',
  validators.name('name'),
  validators.email('email'),
  validators.password('password', 6), // Match frontend requirement of 6 characters
  handleValidationErrors,
  registerPersonal
);

router.post('/register',
  auth,
  adminOnly,
  validators.name('name'),
  validators.email('email'),
  validators.password('password', 8),
  validators.role('role'),
  validators.integer('companyId', 1, true),
  handleValidationErrors,
  register
);

router.post('/complete-employee-setup',
  body('token').trim().notEmpty().withMessage('Token is required'),
  validators.password('password', 8),
  handleValidationErrors,
  completeEmployeeSetup
);

// Google OAuth routes
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Microsoft OAuth (Outlook email agent)
router.get('/microsoft/callback', handleMicrosoftCallback);

// Google Sign-In for mobile apps (accepts idToken from SDK, returns Tialz JWT)
router.post('/google-id-token',
  body('idToken').trim().notEmpty().withMessage('idToken is required'),
  handleValidationErrors,
  handleGoogleIdToken
);

// Forgot password routes (public)
router.post('/forgot-password',
  validators.email('email'),
  handleValidationErrors,
  forgotPassword
);

router.post('/verify-password-reset-code',
  validators.email('email'),
  body('code').trim().notEmpty().withMessage('Verification code is required').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  handleValidationErrors,
  verifyPasswordResetCode
);

router.post('/reset-password-with-code',
  validators.email('email'),
  body('code').trim().notEmpty().withMessage('Verification code is required').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  validators.password('newPassword', 6), // Allow 6 chars for reset (backward compatibility)
  handleValidationErrors,
  resetPasswordWithCode
);

// Protected routes
router.get('/me', auth, getMe);
router.put('/company/auto-archive', auth, updateAutoArchivePeriod); // Update auto-archive period
router.delete('/company', auth, sysAdminOnly, deleteCompany); // Only SYSDMIN can delete company

module.exports = router; 