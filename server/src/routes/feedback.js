const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Note: This route does NOT require authentication
// Anyone can submit feedback (even non-users)
router.post('/', feedbackController.submitFeedback);

module.exports = router;

