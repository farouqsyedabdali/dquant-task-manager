const express = require('express');
const router = express.Router();
const taskInvitationController = require('../controllers/taskInvitationController');
const auth = require('../middleware/auth');

// Public route - get invitation details by token (no auth required)
router.get('/:token', taskInvitationController.getInvitationByToken);

// Protected routes - require authentication
router.post('/:token/accept', auth, taskInvitationController.acceptInvitation);
router.post('/:token/decline', auth, taskInvitationController.declineInvitation);
router.get('/user/received', auth, taskInvitationController.getReceivedInvitations);
router.get('/user/sent', auth, taskInvitationController.getSentInvitations);

// Send invitation route (attached to task)
// This will be called as POST /api/tasks/:taskId/send-invitation
// We'll add it directly in the tasks routes file

module.exports = router;

