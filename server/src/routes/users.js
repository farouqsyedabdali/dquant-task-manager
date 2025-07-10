const express = require('express');
const { getAllUsers, getUserById } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication and admin role
router.use(auth);
router.use(adminOnly);

// Get all users
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

module.exports = router; 