const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  triggerReminderCheck,
  getReminderStats,
  getTaskReminderHistory
} = require('../controllers/reminderController');

// All routes require authentication
router.use(auth);

// Manually trigger reminder check (admin only)
router.post('/check', triggerReminderCheck);

// Get reminder statistics
router.get('/stats', getReminderStats);

// Get reminder history for a specific task
router.get('/task/:taskId', getTaskReminderHistory);

module.exports = router;

