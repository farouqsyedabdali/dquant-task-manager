const express = require('express');
const router = express.Router();
const googleContactsController = require('../controllers/googleContactsController');
const googleInvitationsController = require('../controllers/googleInvitationsController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Google contacts routes
router.get('/', googleContactsController.getContacts);
router.get('/status', googleContactsController.getAccessStatus);
router.post('/connect', googleContactsController.connectGoogleAccount);
router.post('/disconnect', googleContactsController.disconnectGoogleContacts);
router.post('/import', googleContactsController.importContacts);

// Google invitations routes (nested under tasks)
router.post('/tasks/:taskId/send-google-invitations', googleInvitationsController.sendGoogleInvitations);

module.exports = router;