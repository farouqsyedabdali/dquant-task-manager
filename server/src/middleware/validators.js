const { body, param, query, validationResult } = require('express-validator');
const secureLogger = require('./secureLogger');

/**
 * Validation Middleware
 * 
 * Provides input sanitization and validation for all user inputs.
 * Prevents XSS, injection attacks, and data corruption.
 */

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    secureLogger.warn('⚠️  Validation errors:', {
      path: req.path,
      method: req.method,
      errors: errors.array()
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Common sanitizers
const sanitizeString = (field) => body(field).trim().escape();
const sanitizeEmail = (field) => body(field).trim().normalizeEmail().toLowerCase();
const sanitizeInt = (field) => body(field).toInt().optional({ nullable: true });

// Common validators
const validators = {
  // Email validation
  email: (field = 'email', optional = false) => {
    const validator = body(field)
      .trim()
      .normalizeEmail()
      .toLowerCase()
      .isEmail()
      .withMessage('Invalid email format')
      .isLength({ max: 255 })
      .withMessage('Email must be less than 255 characters');
    
    if (optional) {
      return [validator.optional({ nullable: true, checkFalsy: true })];
    }
    return [validator];
  },

  // Password validation (basic - will be enhanced with password policy)
  password: (field = 'password', minLength = 8) => [
    body(field)
      .trim()
      .isLength({ min: minLength, max: 128 })
      .withMessage(`Password must be between ${minLength} and 128 characters`)
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
  ],

  // Name validation
  name: (field = 'name', maxLength = 100, optional = false) => {
    const validator = body(field)
      .trim()
      .escape()
      .isLength({ min: 1, max: maxLength })
      .withMessage(`${field} must be between 1 and ${maxLength} characters`)
      .matches(/^[a-zA-Z0-9\s\-'\.]+$/)
      .withMessage(`${field} contains invalid characters`);
    
    if (optional) {
      return [validator.optional({ nullable: true, checkFalsy: true })];
    }
    return [validator.notEmpty().withMessage(`${field} is required`)];
  },

  // Title validation (for tasks, projects)
  title: (field = 'title', maxLength = 200, optional = false) => {
    const validator = body(field)
      .trim()
      .escape()
      .isLength({ min: 1, max: maxLength })
      .withMessage(`${field} must be between 1 and ${maxLength} characters`);
    
    if (optional) {
      return [validator.optional({ nullable: true, checkFalsy: true })];
    }
    return [validator.notEmpty().withMessage(`${field} is required`)];
  },

  // Description validation
  description: (field = 'description', maxLength = 1000, optional = true) => {
    const validator = body(field)
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .escape()
      .isLength({ max: maxLength })
      .withMessage(`${field} must be less than ${maxLength} characters`);
    
    if (!optional) {
      return [validator.notEmpty().withMessage(`${field} is required`)];
    }
    return [validator];
  },

  // Priority validation
  priority: (field = 'priority') => [
    body(field)
      .optional({ nullable: true })
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT')
  ],

  // Status validation
  status: (field = 'status') => [
    body(field)
      .optional({ nullable: true })
      .isIn(['TODO', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'])
      .withMessage('Status must be TODO, IN_PROGRESS, COMPLETED, ON_HOLD, or CANCELLED')
  ],

  // Role validation
  role: (field = 'role') => [
    body(field)
      .optional({ nullable: true })
      .isIn(['EMPLOYEE', 'ADMIN', 'SYSDMIN', 'SUPER_ADMIN'])
      .withMessage('Role must be EMPLOYEE, ADMIN, SYSDMIN, or SUPER_ADMIN')
  ],

  // Date validation
  date: (field = 'dueDate', optional = true) => {
    const validator = body(field)
      .optional({ nullable: optional })
      .trim()
      .isISO8601()
      .withMessage(`${field} must be a valid ISO 8601 date`)
      .toDate();
    
    if (!optional) {
      return [validator.notEmpty().withMessage(`${field} is required`)];
    }
    return [validator];
  },

  // Integer ID validation (for params)
  id: (field = 'id') => [
    param(field)
      .isInt({ min: 1 })
      .withMessage(`${field} must be a positive integer`)
      .toInt()
  ],

  // Integer validation (for body)
  integer: (field, min = 1, optional = true) => {
    const validator = body(field)
      .isInt({ min })
      .withMessage(`${field} must be a positive integer`)
      .toInt();
    
    if (optional) {
      return [validator.optional({ nullable: true, checkFalsy: true })];
    }
    return [validator.notEmpty().withMessage(`${field} is required`)];
  },

  // Phone number validation
  phone: (field = 'phone', optional = true) => {
    const validator = body(field)
      .optional({ nullable: optional, checkFalsy: true })
      .trim()
      .escape()
      .isLength({ max: 20 })
      .withMessage('Phone number must be less than 20 characters')
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage('Phone number contains invalid characters');
    
    return [validator];
  },

  // Company name validation
  companyName: (field = 'name') => [
    body(field)
      .trim()
      .escape()
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Company name must be between 1 and 100 characters')
  ],

  // Text content validation (for comments, feedback)
  textContent: (field = 'content', minLength = 1, maxLength = 2000) => [
    body(field)
      .trim()
      .escape()
      .notEmpty()
      .withMessage(`${field} is required`)
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
  ],

  // Feedback validation
  feedback: () => [
    body('name')
      .trim()
      .escape()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('email')
      .trim()
      .normalizeEmail()
      .toLowerCase()
      .isEmail()
      .withMessage('Invalid email format'),
    body('feedback')
      .trim()
      .escape()
      .notEmpty()
      .withMessage('Feedback is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Feedback must be between 10 and 2000 characters')
  ],

  // AI text input validation
  aiText: (field = 'text') => [
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${field} is required`)
      .isLength({ min: 1, max: 5000 })
      .withMessage(`${field} must be between 1 and 5000 characters`)
  ]
};

module.exports = {
  validators,
  handleValidationErrors,
  validationResult
};
