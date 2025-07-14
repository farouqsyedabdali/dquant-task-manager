const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  createSubtask,
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

// Create task (anyone can create tasks)
router.post('/', createTask);

// Create subtask (assignee can create subtasks from tasks assigned to them)
router.post('/:id/subtasks', createSubtask);

// Update task (assigner can edit, assignee can only change status)
router.put('/:id', updateTask);

// Delete task (admin or assigner can delete)
router.delete('/:id', deleteTask);

// Update task status (assigner or assignee can update)
router.patch('/:id/status', updateTaskStatus);

// Update task priority (admin or assigner can update)
router.patch('/:id/priority', updateTaskPriority);

module.exports = router; 