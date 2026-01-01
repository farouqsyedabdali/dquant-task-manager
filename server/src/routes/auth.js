const express = require('express');
const { login, register, registerCompany, registerPersonal, deleteCompany, getMe, updateAutoArchivePeriod, forgotPassword, verifyPasswordResetCode, resetPasswordWithCode, completeEmployeeSetup } = require('../controllers/authController');
const { initiateGoogleAuth, handleGoogleCallback } = require('../controllers/googleAuthController');
const auth = require('../middleware/auth');
const { adminOnly, sysAdminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register-company', registerCompany); // Company registration
router.post('/register-personal', registerPersonal); // Personal registration
router.post('/register', auth, adminOnly, register); // Only admins can register new users
router.post('/complete-employee-setup', completeEmployeeSetup); // Complete employee account setup

// Google OAuth routes
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Forgot password routes (public)
router.post('/forgot-password', forgotPassword);
router.post('/verify-password-reset-code', verifyPasswordResetCode);
router.post('/reset-password-with-code', resetPasswordWithCode);

// Protected routes
router.get('/me', auth, getMe);
router.put('/company/auto-archive', auth, updateAutoArchivePeriod); // Update auto-archive period
router.delete('/company', auth, sysAdminOnly, deleteCompany); // Only SYSDMIN can delete company

module.exports = router; 