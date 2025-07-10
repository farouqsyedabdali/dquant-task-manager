const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskPriority
} = require('../controllers/taskController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get tasks (admin: all tasks, employee: assigned tasks)
router.get('/', getTasks);

// Get single task
router.get('/:id', getTask);

// Create task (admin only)
router.post('/', adminOnly, createTask);

// Update task (admin: full update, employee: status only)
router.put('/:id', updateTask);

// Delete task (admin only)
router.delete('/:id', adminOnly, deleteTask);

// Update task status (employee)
router.patch('/:id/status', updateTaskStatus);

// Update task priority (admin only)
router.patch('/:id/priority', adminOnly, updateTaskPriority);

module.exports = router; 