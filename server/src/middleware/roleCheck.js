const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    console.log('🔐 ROLE CHECK:', {
      path: req.path,
      userRole: req.user?.role,
      allowedRoles: allowedRoles,
      hasAccess: allowedRoles.includes(req.user?.role),
      timestamp: new Date().toISOString()
    });

    if (!req.user) {
      console.log('❌ NO USER in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log('❌ INSUFFICIENT PERMISSIONS:', {
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    console.log('✅ ROLE CHECK PASSED');
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