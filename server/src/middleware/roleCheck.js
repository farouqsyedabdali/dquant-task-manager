const secureLogger = require('./secureLogger');

const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    secureLogger.debug('🔐 ROLE CHECK:', {
      path: req.path,
      userRole: req.user?.role,
      allowedRoles: allowedRoles,
      hasAccess: allowedRoles.includes(req.user?.role),
      timestamp: new Date().toISOString()
    });

    if (!req.user) {
      secureLogger.warn('❌ NO USER in request', { path: req.path });
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      secureLogger.warn('❌ INSUFFICIENT PERMISSIONS:', {
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        userId: req.user.id
      });
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    secureLogger.debug('✅ ROLE CHECK PASSED');
    next();
  };
};

const superAdminOnly = roleCheck(['SUPER_ADMIN']);
const adminOnly = roleCheck(['ADMIN', 'SYSDMIN', 'SUPER_ADMIN']);
const sysAdminOnly = roleCheck(['SYSDMIN', 'SUPER_ADMIN']);
const employeeOnly = roleCheck(['EMPLOYEE']);

module.exports = {
  roleCheck,
  superAdminOnly,
  adminOnly,
  sysAdminOnly,
  employeeOnly
}; 