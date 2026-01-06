const express = require('express');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const { validators, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get comments for a task
router.get('/task/:taskId', validators.id('taskId'), handleValidationErrors, getComments);

// Create comment
router.post('/task/:taskId',
  validators.id('taskId'),
  validators.textContent('content', 1, 2000),
  handleValidationErrors,
  createComment
);

// Update comment (author or admin only)
router.put('/:id',
  validators.id('id'),
  validators.textContent('content', 1, 2000),
  handleValidationErrors,
  updateComment
);

// Delete comment (admin only)
router.delete('/:id', validators.id('id'), handleValidationErrors, adminOnly, deleteComment);

module.exports = router; 