const express = require('express');
const { login, register, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', auth, adminOnly, register); // Only admins can register new users

// Protected routes
router.get('/me', auth, getMe);

module.exports = router; 