const express = require('express');
const router = express.Router();
const taskInvitationController = require('../controllers/taskInvitationController');
const auth = require('../middleware/auth');

// Protected routes - require authentication (more specific routes first)
router.get('/pending', auth, taskInvitationController.getPendingInvitations);
router.get('/user/received', auth, taskInvitationController.getReceivedInvitations);
router.get('/user/sent', auth, taskInvitationController.getSentInvitations);
router.post('/:token/accept', auth, taskInvitationController.acceptInvitation);
router.post('/:token/decline', auth, taskInvitationController.declineInvitation);

// Public route - get invitation details by token (no auth required)
// This must be last since it matches any string as :token
router.get('/:token', taskInvitationController.getInvitationByToken);

// Send invitation route (attached to task)
// This will be called as POST /api/tasks/:taskId/send-invitation
// We'll add it directly in the tasks routes file

module.exports = router;

