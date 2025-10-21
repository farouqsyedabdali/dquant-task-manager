const express = require('express');
const auth = require('../middleware/auth');
const { superAdminOnly } = require('../middleware/roleCheck');
const {
  getAllCompanies,
  getCompanyById,
  searchUsersGlobally,
  getSystemHealth,
  resetUserPassword,
  toggleCompanyStatus
} = require('../controllers/superAdminController');

const router = express.Router();

// All routes require authentication first, then SUPER_ADMIN role
router.use(auth);
router.use((req, res, next) => {
  console.log('🔴 SUPER ADMIN ROUTE ACCESS:', {
    path: req.path,
    method: req.method,
    userRole: req.user?.role,
    userId: req.user?.userId,
    timestamp: new Date().toISOString()
  });
  superAdminOnly(req, res, next);
});

// Company management routes
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompanyById);
router.put('/companies/:companyId/status', toggleCompanyStatus);

// User management routes
router.get('/users/search', searchUsersGlobally);
router.put('/users/:userId/reset-password', resetUserPassword);

// System monitoring routes
router.get('/system/health', getSystemHealth);

module.exports = router;
