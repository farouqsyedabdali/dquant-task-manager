const express = require('express');
const {
  archiveTask,
  unarchiveTask,
  getArchivedTasks
} = require('../controllers/taskArchiveController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth); // All routes require authentication

// Archive a task
router.post('/:taskId/archive', archiveTask);

// Unarchive a task
router.post('/:taskId/unarchive', unarchiveTask);

// Get archived tasks
router.get('/archived', getArchivedTasks);

module.exports = router;
