const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { validators, handleValidationErrors } = require('../middleware/validators');

// Note: This route does NOT require authentication
// Anyone can submit feedback (even non-users)
router.post('/', validators.feedback(), handleValidationErrors, feedbackController.submitFeedback);

module.exports = router;

