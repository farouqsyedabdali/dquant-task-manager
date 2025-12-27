const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all templates
router.get('/', templateController.getAllTemplates);

// Get a specific template
router.get('/:id', templateController.getTemplateById);

// Create template from existing project
router.post('/from-project/:projectId', templateController.createFromProject);

// Create project from template
router.post('/:id/create-project', templateController.createProjectFromTemplate);

// Update a template
router.put('/:id', templateController.updateTemplate);

// Delete a template
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;




