const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  createSubtask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskPriority,
  debugCompanyTasks,
  addCoAssignee,
  removeCoAssignee,
  getCoAssignees
} = require('../controllers/taskController');
const { sendInvitation, unaccessTask } = require('../controllers/taskInvitationController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Debug endpoint to check company data
router.get('/debug', debugCompanyTasks);

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

// Co-assignee routes
// Get co-assignees for a task
router.get('/:id/co-assignees', getCoAssignees);

// Add co-assignee to task (only lead assignee can do this)
router.post('/:id/co-assignees', addCoAssignee);

// Remove co-assignee from task (only lead assignee can do this)
router.delete('/:id/co-assignees/:userId', removeCoAssignee);

// Task invitation routes
// Send task invitation via email
router.post('/:taskId/send-invitation', sendInvitation);

// Unaccept task (remove yourself from an accepted task)
router.post('/:taskId/unaccept', unaccessTask);

module.exports = router; 