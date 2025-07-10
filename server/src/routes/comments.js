const express = require('express');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get comments for a task
router.get('/task/:taskId', getComments);

// Create comment
router.post('/task/:taskId', createComment);

// Update comment (admin only)
router.put('/:id', adminOnly, updateComment);

// Delete comment (admin only)
router.delete('/:id', adminOnly, deleteComment);

module.exports = router; 