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
const { validators, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Debug endpoint to check company data
router.get('/debug', debugCompanyTasks);

// Get tasks (admin: all tasks, employee: assigned tasks)
router.get('/', getTasks);

// Get single task
router.get('/:id', validators.id('id'), handleValidationErrors, getTask);

// Create task (anyone can create tasks)
router.post('/',
  validators.title('title', 200),
  validators.description('description', 1000, true),
  validators.priority('priority'),
  validators.integer('assigneeId', 1, true),
  validators.integer('externalContactId', 1, true),
  validators.integer('parentTaskId', 1, true),
  validators.date('dueDate', false),
  handleValidationErrors,
  createTask
);

// Create subtask (assignee can create subtasks from tasks assigned to them)
router.post('/:id/subtasks',
  validators.id('id'),
  validators.title('title', 200),
  validators.description('description', 1000, true),
  validators.priority('priority'),
  validators.date('dueDate', false),
  handleValidationErrors,
  createSubtask
);

// Update task (assigner can edit, assignee can only change status)
router.put('/:id',
  validators.id('id'),
  validators.title('title', 200, true),
  validators.description('description', 1000, true),
  validators.priority('priority'),
  validators.status('status'),
  validators.integer('assigneeId', 1, true),
  validators.integer('externalContactId', 1, true),
  validators.date('dueDate', true),
  handleValidationErrors,
  updateTask
);

// Delete task (admin or assigner can delete)
router.delete('/:id', validators.id('id'), handleValidationErrors, deleteTask);

// Update task status (assigner or assignee can update)
router.patch('/:id/status',
  validators.id('id'),
  validators.status('status'),
  handleValidationErrors,
  updateTaskStatus
);

// Update task priority (admin or assigner can update)
router.patch('/:id/priority',
  validators.id('id'),
  validators.priority('priority'),
  handleValidationErrors,
  updateTaskPriority
);

// Co-assignee routes
// Get co-assignees for a task
router.get('/:id/co-assignees', validators.id('id'), handleValidationErrors, getCoAssignees);

// Add co-assignee to task (only lead assignee can do this)
router.post('/:id/co-assignees',
  validators.id('id'),
  validators.integer('userId', 1, false),
  handleValidationErrors,
  addCoAssignee
);

// Remove co-assignee from task (only lead assignee can do this)
router.delete('/:id/co-assignees/:userId',
  validators.id('id'),
  validators.id('userId'),
  handleValidationErrors,
  removeCoAssignee
);

// Task invitation routes
// Send task invitation via email
router.post('/:taskId/send-invitation',
  validators.id('taskId'),
  validators.email('recipientEmail'),
  handleValidationErrors,
  sendInvitation
);

// Unaccept task (remove yourself from an accepted task)
router.post('/:taskId/unaccept', validators.id('taskId'), handleValidationErrors, unaccessTask);

module.exports = router; 