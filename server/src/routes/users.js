const express = require('express');
const { getAllUsers, getEmployeesForAssignment, getUserById, createEmployee, updateUser, deleteEmployee, deleteCompany } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// Route for getting employees for task assignment (available to all authenticated users)
router.get('/employees', auth, getEmployeesForAssignment);

// All other routes require authentication and admin role
router.use(auth);
router.use(adminOnly);

// Get all users
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Create new employee
router.post('/', createEmployee);

// Update employee
router.put('/:id', updateUser);

// Delete employee
router.delete('/:id', deleteEmployee);

// Delete company (only SYSDMIN)
router.delete('/company', deleteCompany);

module.exports = router; 