const express = require('express');
const { body } = require('express-validator');
const { getContacts, getContactById, createContact, updateContact, deleteContact, getContactDeletionPreview, searchContacts } = require('../controllers/contactController');
const auth = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/contacts - Get all contacts for the user
router.get('/', getContacts);

// GET /api/contacts/search - Search contacts (must come before /:id)
router.get('/search', searchContacts);

// GET /api/contacts/:id/deletion-preview - Get preview of tasks affected by deletion (must come before /:id)
router.get('/:id/deletion-preview', validators.id('id'), handleValidationErrors, getContactDeletionPreview);

// GET /api/contacts/:id - Get a specific contact
router.get('/:id', validators.id('id'), handleValidationErrors, getContactById);

// POST /api/contacts - Create a new contact
router.post('/',
  validators.name('name'),
  validators.email('email'),
  body('company').optional().trim().escape().isLength({ max: 100 }).withMessage('Company name must be less than 100 characters'),
  validators.phone('phone', true),
  handleValidationErrors,
  createContact
);

// PUT /api/contacts/:id - Update a contact
router.put('/:id',
  validators.id('id'),
  validators.name('name', 100, true),
  validators.email('email', true),
  body('company').optional().trim().escape().isLength({ max: 100 }).withMessage('Company name must be less than 100 characters'),
  validators.phone('phone', true),
  handleValidationErrors,
  updateContact
);

// DELETE /api/contacts/:id - Delete a contact
router.delete('/:id', validators.id('id'), handleValidationErrors, deleteContact);

module.exports = router;
