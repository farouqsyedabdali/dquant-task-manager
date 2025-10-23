const express = require('express');
const { shareTask, shareTaskWithContact, shareTaskWithEmail, unshareTask, getTaskShares, getSharedTasks } = require('../controllers/taskShareController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Share a task with a user
router.post('/:taskId/share', shareTask);

// Share a task with a contact
router.post('/:taskId/share-contact', shareTaskWithContact);

// Share a task with an email address
router.post('/:taskId/share-email', shareTaskWithEmail);

// Unshare a task with a user
router.delete('/:taskId/share/:userId', unshareTask);

// Get users a task is shared with
router.get('/:taskId/shares', getTaskShares);

// Get tasks shared with current user
router.get('/shared', getSharedTasks);

module.exports = router;
