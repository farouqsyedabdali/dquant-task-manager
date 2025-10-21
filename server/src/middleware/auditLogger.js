const prisma = require('../lib/prisma');

/**
 * Audit logging middleware
 * Automatically logs user actions to the audit log
 */
const auditLogger = (action, entityType, options = {}) => {
  return async (req, res, next) => {
    // Store original res.json to intercept the response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action after the response is sent
      setImmediate(async () => {
        try {
          await logAuditAction(req, action, entityType, data, options);
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      });
      
      // Call the original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Log an audit action
 */
const logAuditAction = async (req, action, entityType, responseData, options = {}) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      console.warn('Cannot log audit action: missing user or company ID');
      return;
    }

    // Skip logging for certain actions if specified
    if (options.skipLogging) {
      return;
    }

    // Generate description based on action and entity type
    const description = generateDescription(action, entityType, req, responseData, options);
    
    // Extract old and new values for updates
    const { oldValues, newValues } = extractValues(req, action, responseData, options);
    
    // Extract metadata (e.g., task title, comment content)
    const metadata = extractMetadata(req, responseData, options);

    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId: options.entityId || responseData?.id || null,
        description,
        oldValues: oldValues || null,
        newValues: newValues || null,
        metadata: metadata || null,
        userId,
        companyId
      }
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
};

/**
 * Generate human-readable description for the audit log
 */
const generateDescription = (action, entityType, req, responseData, options) => {
  const userName = req.user?.name || 'Unknown User';
  const timestamp = new Date().toLocaleString();
  
  switch (action) {
    case 'TASK_CREATED':
      return `${userName} created task "${responseData?.title || 'Unknown Task'}" at ${timestamp}`;
    
    case 'TASK_UPDATED':
      return `${userName} updated task "${options.taskTitle || responseData?.title || 'Unknown Task'}" at ${timestamp}`;
    
    case 'TASK_DELETED':
      return `${userName} deleted task "${options.taskTitle || 'Unknown Task'}" at ${timestamp}`;
    
    case 'TASK_STATUS_CHANGED':
      return `${userName} changed task status from "${options.oldStatus}" to "${options.newStatus}" in "${options.taskTitle || 'Unknown Task'}" at ${timestamp}`;
    
    case 'TASK_PRIORITY_CHANGED':
      return `${userName} changed task priority from "${options.oldPriority}" to "${options.newPriority}" in "${options.taskTitle || 'Unknown Task'}" at ${timestamp}`;
    
    case 'TASK_ASSIGNED':
      return `${userName} assigned task "${options.taskTitle || 'Unknown Task'}" to ${options.assigneeName || 'Unknown User'} at ${timestamp}`;
    
    case 'TASK_UNASSIGNED':
      return `${userName} unassigned task "${options.taskTitle || 'Unknown Task'}" from ${options.assigneeName || 'Unknown User'} at ${timestamp}`;
    
    case 'COMMENT_CREATED':
      return `${userName} added a comment in "${options.taskTitle || 'Unknown Task'}" at ${timestamp}: "${options.commentContent || 'No content'}"`;
    
    case 'COMMENT_UPDATED':
      return `${userName} edited a comment in "${options.taskTitle || 'Unknown Task'}" at ${timestamp}: From "${options.oldCommentContent || 'No content'}" to "${options.newCommentContent || 'No content'}"`;
    
    case 'COMMENT_DELETED':
      return `${userName} deleted a comment in "${options.taskTitle || 'Unknown Task'}" at ${timestamp}: "${options.commentContent || 'No content'}"`;
    
    case 'CO_ASSIGNEE_ADDED':
      return `${userName} added co-assignee ${options.coAssigneeName || 'Unknown User'} to task "${options.taskTitle || 'Unknown Task'}" at ${timestamp}`;
    
    case 'CO_ASSIGNEE_REMOVED':
      return `${userName} removed co-assignee ${options.coAssigneeName || 'Unknown User'} from task "${options.taskTitle || 'Unknown Task'}" at ${timestamp}`;
    
    case 'USER_CREATED':
      return `${userName} created user "${options.newUserName || responseData?.name || 'Unknown User'}" at ${timestamp}`;
    
    case 'USER_UPDATED':
      return `${userName} updated user "${options.userName || 'Unknown User'}" at ${timestamp}`;
    
    case 'USER_DELETED':
      return `${userName} deleted user "${options.userName || 'Unknown User'}" at ${timestamp}`;
    
    case 'USER_ROLE_CHANGED':
      return `${userName} changed role of ${options.userName || 'Unknown User'} from "${options.oldRole}" to "${options.newRole}" at ${timestamp}`;
    
    case 'USER_LOGIN':
      return `${userName} logged in at ${timestamp}`;
    
    case 'USER_LOGOUT':
      return `${userName} logged out at ${timestamp}`;
    
    case 'PASSWORD_CHANGED':
      return `${userName} changed their password at ${timestamp}`;
    
    default:
      return `${userName} performed ${action} on ${entityType} at ${timestamp}`;
  }
};

/**
 * Extract old and new values for updates
 */
const extractValues = (req, action, responseData, options) => {
  const oldValues = options.oldValues || null;
  const newValues = options.newValues || responseData || null;
  
  return { oldValues, newValues };
};

/**
 * Extract metadata for additional context
 */
const extractMetadata = (req, responseData, options) => {
  const metadata = {
    ...options.metadata,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    endpoint: req.originalUrl,
    method: req.method
  };
  
  return Object.keys(metadata).length > 0 ? metadata : null;
};

/**
 * Helper function to log audit actions directly (for use in controllers)
 */
const logAuditActionDirect = async (req, action, entityType, options = {}) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      console.warn('Cannot log audit action: missing user or company ID');
      return;
    }

    const description = generateDescription(action, entityType, req, null, options);
    const { oldValues, newValues } = extractValues(req, action, null, options);
    const metadata = extractMetadata(req, null, options);

    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId: options.entityId || null,
        description,
        oldValues: oldValues || null,
        newValues: newValues || null,
        metadata: metadata || null,
        userId,
        companyId
      }
    });
  } catch (error) {
    console.error('Failed to log audit action directly:', error);
  }
};

module.exports = {
  auditLogger,
  logAuditActionDirect
};
