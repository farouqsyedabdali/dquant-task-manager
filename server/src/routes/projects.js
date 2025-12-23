const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get available templates (must be before /:id route)
router.get('/templates', projectController.getTemplates);

// Project CRUD routes
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Project task routes
router.post('/:id/tasks', projectController.addTaskToProject);
router.delete('/:id/tasks/:taskId', projectController.removeTaskFromProject);

// Send draft tasks
router.post('/:id/tasks/:taskId/send', projectController.sendTask);
router.post('/:id/tasks/send-all', projectController.sendAllDraftTasks);

// Reassign tasks
router.put('/:id/tasks/:taskId/reassign', projectController.reassignTask);

module.exports = router;

