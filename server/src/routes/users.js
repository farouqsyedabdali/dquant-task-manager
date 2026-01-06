const express = require('express');
const { getAllUsers, getEmployeesForAssignment, getUserById, createEmployee, updateUser, deleteEmployee, resetUserPassword, deleteCompany, resendEmployeeInvitation } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const { validators, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

// Route for getting employees for task assignment (available to all authenticated users)
router.get('/employees', auth, getEmployeesForAssignment);

// All other routes require authentication and admin role
router.use(auth);
router.use(adminOnly);

// Get all users
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', validators.id('id'), handleValidationErrors, getUserById);

// Create new employee
router.post('/',
  validators.name('name'),
  validators.email('email'),
  validators.role('role'),
  handleValidationErrors,
  createEmployee
);

// Resend employee invitation
router.post('/:id/resend-invitation', validators.id('id'), handleValidationErrors, resendEmployeeInvitation);

// Update employee
router.put('/:id',
  validators.id('id'),
  validators.name('name', 100, true),
  validators.email('email', true),
  validators.role('role'),
  handleValidationErrors,
  updateUser
);

// Reset user password
router.put('/:id/reset-password',
  validators.id('id'),
  validators.password('newPassword', 8),
  handleValidationErrors,
  resetUserPassword
);

// Delete employee
router.delete('/:id', validators.id('id'), handleValidationErrors, deleteEmployee);

// Delete company (only SYSDMIN)
router.delete('/company', deleteCompany);

module.exports = router; 