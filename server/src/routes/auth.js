const express = require('express');
const { login, register, registerCompany, deleteCompany, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register-company', registerCompany); // Company registration
router.post('/register', auth, adminOnly, register); // Only admins can register new users

// Protected routes
router.get('/me', auth, getMe);
router.delete('/company', auth, adminOnly, deleteCompany); // Only admins can delete company

module.exports = router; 