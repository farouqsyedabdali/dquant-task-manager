const express = require('express');
const { login, register, registerCompany, registerPersonal, deleteCompany, getMe, forgotPassword, verifyPasswordResetCode, resetPasswordWithCode } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { adminOnly, sysAdminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register-company', registerCompany); // Company registration
router.post('/register-personal', registerPersonal); // Personal registration
router.post('/register', auth, adminOnly, register); // Only admins can register new users

// Forgot password routes (public)
router.post('/forgot-password', forgotPassword);
router.post('/verify-password-reset-code', verifyPasswordResetCode);
router.post('/reset-password-with-code', resetPasswordWithCode);

// Protected routes
router.get('/me', auth, getMe);
router.delete('/company', auth, sysAdminOnly, deleteCompany); // Only SYSDMIN can delete company

module.exports = router; 