const prisma = require('../lib/prisma');

/**
 * Get audit logs for a company (admin only)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { companyId } = req.user;
    const {
      page = 1,
      limit = 50,
      action,
      entityType,
      userId,
      startDate,
      endDate,
      search
    } = req.query;

    // Build where clause
    const whereClause = {
      companyId: parseInt(companyId)
    };

    // Filter by action
    if (action) {
      whereClause.action = action;
    }

    // Filter by entity type
    if (entityType) {
      whereClause.entityType = entityType;
    }

    // Filter by user
    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    // Search in description
    if (search) {
      whereClause.description = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get audit logs with user information
    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    });

    // Get total count for pagination
    const totalCount = await prisma.auditLog.count({
      where: whereClause
    });

    // Get summary statistics
    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        companyId: parseInt(companyId),
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: {
        action: true
      }
    });

    res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        },
        stats: stats.map(stat => ({
          action: stat.action,
          count: stat._count.action
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
};

/**
 * Get audit log by ID (admin only)
 */
const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        id: parseInt(id),
        companyId: parseInt(companyId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log'
    });
  }
};

/**
 * Get audit log statistics (admin only)
 */
const getAuditStats = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Get action counts
    const actionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        companyId: parseInt(companyId),
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    });

    // Get user activity
    const userStats = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        companyId: parseInt(companyId),
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        userId: true
      },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    });

    // Get daily activity
    const dailyStats = await prisma.auditLog.groupBy({
      by: ['createdAt'],
      where: {
        companyId: parseInt(companyId),
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get entity type stats
    const entityStats = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where: {
        companyId: parseInt(companyId),
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        entityType: true
      },
      orderBy: {
        _count: {
          entityType: 'desc'
        }
      }
    });

    res.json({
      success: true,
      data: {
        actionStats: actionStats.map(stat => ({
          action: stat.action,
          count: stat._count.action
        })),
        userStats: userStats.map(stat => ({
          userId: stat.userId,
          count: stat._count.userId
        })),
        dailyStats: dailyStats.map(stat => ({
          date: stat.createdAt.toISOString().split('T')[0],
          count: stat._count.id
        })),
        entityStats: entityStats.map(stat => ({
          entityType: stat.entityType,
          count: stat._count.entityType
        })),
        totalActions: actionStats.reduce((sum, stat) => sum + stat._count.action, 0),
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days: parseInt(days)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit statistics'
    });
  }
};

/**
 * Get audit logs for a specific task
 */
const getTaskAuditLogs = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { companyId, id: userId, role } = req.user;

    // Get the task to verify access
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(taskId),
        OR: [
          { companyId: companyId }, // User's company tasks
          { assigneeId: userId }, // Assigned to user
          { assignerId: userId }, // Created by user
          { coAssignees: { some: { userId: userId } } }, // Co-assigned
          { sharedWith: { some: { userId: userId } } }, // Shared with user
          { collaborators: { some: { userId: userId } } } // Collaborating
        ]
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or access denied'
      });
    }

    // Get audit logs for this task (all task-related actions)
    const taskLogs = await prisma.auditLog.findMany({
      where: {
        entityId: parseInt(taskId),
        entityType: 'Task',
        companyId: companyId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get comment audit logs related to this task
    // Note: Comments are linked via their parent entity (task)
    // We filter by checking if the description contains the task ID reference
    const commentLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Comment',
        companyId: companyId,
        // Only include comments that reference this specific task ID
        description: {
          contains: `task #${taskId}`,
          mode: 'insensitive'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get co-assignee logs
    // Filter by task ID reference instead of title
    const coAssigneeLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'TaskCoAssignee',
        companyId: companyId,
        description: {
          contains: `task #${taskId}`,
          mode: 'insensitive'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get task share logs
    const shareLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'TaskShare',
        companyId: companyId,
        description: {
          contains: `task #${taskId}`,
          mode: 'insensitive'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Combine all logs and sort by most recent
    const allLogs = [...taskLogs, ...commentLogs, ...coAssigneeLogs, ...shareLogs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      data: allLogs
    });
  } catch (error) {
    console.error('Error fetching task audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task audit logs'
    });
  }
};

/**
 * Export audit logs to CSV (admin only)
 */
const exportAuditLogs = async (req, res) => {
  try {
    const { companyId } = req.user;
    const {
      action,
      entityType,
      userId,
      startDate,
      endDate
    } = req.query;

    // Build where clause (same as getAuditLogs)
    const whereClause = {
      companyId: parseInt(companyId)
    };

    if (action) whereClause.action = action;
    if (entityType) whereClause.entityType = entityType;
    if (userId) whereClause.userId = parseInt(userId);
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    // Get all audit logs (no pagination for export)
    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Generate CSV content
    const csvHeader = 'Date,Time,User,Email,Role,Action,Entity Type,Entity ID,Description\n';
    const csvRows = auditLogs.map(log => {
      const date = new Date(log.createdAt);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().split(' ')[0];

      return [
        dateStr,
        timeStr,
        `"${log.user.name}"`,
        `"${log.user.email}"`,
        log.user.role,
        log.action,
        log.entityType,
        log.entityId || '',
        `"${log.description.replace(/"/g, '""')}"`
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs'
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
  getTaskAuditLogs,
  exportAuditLogs
};
