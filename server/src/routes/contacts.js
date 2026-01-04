const express = require('express');
const { getContacts, getContactById, createContact, updateContact, deleteContact, getContactDeletionPreview, searchContacts } = require('../controllers/contactController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/contacts - Get all contacts for the user
router.get('/', getContacts);

// GET /api/contacts/search - Search contacts (must come before /:id)
router.get('/search', searchContacts);

// GET /api/contacts/:id/deletion-preview - Get preview of tasks affected by deletion (must come before /:id)
router.get('/:id/deletion-preview', getContactDeletionPreview);

// GET /api/contacts/:id - Get a specific contact
router.get('/:id', getContactById);

// POST /api/contacts - Create a new contact
router.post('/', createContact);

// PUT /api/contacts/:id - Update a contact
router.put('/:id', updateContact);

// DELETE /api/contacts/:id - Delete a contact
router.delete('/:id', deleteContact);

module.exports = router;
