const express = require('express');
const {
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
  getTaskAuditLogs,
  exportAuditLogs
} = require('../controllers/auditController');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// Get audit logs for a specific task (requires auth, not admin)
router.get('/task/:taskId', auth, getTaskAuditLogs);

// All other routes require authentication and admin access
router.use(auth);
router.use(adminOnly);

// Get audit logs with filtering and pagination
router.get('/', getAuditLogs);

// Get audit log by ID
router.get('/:id', getAuditLogById);

// Get audit statistics
router.get('/stats/summary', getAuditStats);

// Export audit logs to CSV
router.get('/export/csv', exportAuditLogs);

module.exports = router;
