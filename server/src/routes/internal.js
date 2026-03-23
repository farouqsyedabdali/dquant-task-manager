const express = require('express');
const { body } = require('express-validator');
const { processInboundEmail } = require('../controllers/internalEmailController');
const { handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

router.post(
  '/process-email',
  body('senderEmail')
    .trim()
    .normalizeEmail()
    .toLowerCase()
    .isEmail()
    .withMessage('senderEmail must be a valid email address'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('subject is required')
    .isLength({ max: 255 })
    .withMessage('subject must be less than 255 characters'),
  body('cleanBody')
    .trim()
    .notEmpty()
    .withMessage('cleanBody is required')
    .isLength({ max: 20000 })
    .withMessage('cleanBody must be less than 20000 characters'),
  handleValidationErrors,
  processInboundEmail
);

module.exports = router;
