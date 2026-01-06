const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validators');

// All routes require authentication
router.use(auth);

// Get available templates (must be before /:id route)
router.get('/templates', projectController.getTemplates);

// Project CRUD routes
router.get('/', projectController.getAllProjects);
router.get('/:id', validators.id('id'), handleValidationErrors, projectController.getProjectById);
router.post('/',
  validators.title('name', 200),
  validators.description('description', 500, true),
  validators.date('dueDate', true),
  handleValidationErrors,
  projectController.createProject
);
router.put('/:id',
  validators.id('id'),
  validators.title('name', 200, true),
  validators.description('description', 500, true),
  validators.date('dueDate', true),
  handleValidationErrors,
  projectController.updateProject
);
router.delete('/:id', validators.id('id'), handleValidationErrors, projectController.deleteProject);

// Project task routes
router.post('/:id/tasks',
  validators.id('id'),
  validators.title('title', 200),
  validators.description('description', 1000, true),
  validators.priority('priority'),
  validators.integer('assigneeId', 1, true),
  validators.integer('externalContactId', 1, true),
  validators.date('dueDate', false),
  handleValidationErrors,
  projectController.addTaskToProject
);
router.delete('/:id/tasks/:taskId',
  validators.id('id'),
  validators.id('taskId'),
  handleValidationErrors,
  projectController.removeTaskFromProject
);

// Send draft tasks
router.post('/:id/tasks/:taskId/send',
  validators.id('id'),
  validators.id('taskId'),
  handleValidationErrors,
  projectController.sendTask
);
router.post('/:id/tasks/send-all',
  validators.id('id'),
  handleValidationErrors,
  projectController.sendAllDraftTasks
);

// Reassign tasks
router.put('/:id/tasks/:taskId/reassign',
  validators.id('id'),
  validators.id('taskId'),
  validators.integer('assigneeId', 1, true),
  validators.integer('externalContactId', 1, true),
  handleValidationErrors,
  projectController.reassignTask
);

module.exports = router;

