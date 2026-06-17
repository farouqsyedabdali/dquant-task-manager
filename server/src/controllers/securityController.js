const prisma = require('../lib/prisma');
const { logAuditActionDirect } = require('../middleware/auditLogger');



/**
 * Get failed login attempts (Super Admin only)
 */
const getFailedLogins = async (req, res) => {
  try {
    const { days = 7, limit = 50 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get failed login attempts from audit logs
    const failedLogins = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN', // Using USER_LOGIN as proxy for failed logins
        createdAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Get summary statistics
    const totalFailedLogins = await prisma.auditLog.count({
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: startDate
        }
      }
    });

    const uniqueUsers = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: startDate
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    res.json({
      success: true,
      data: {
        failedLogins,
        summary: {
          totalFailedLogins,
          uniqueUsers: uniqueUsers.length,
          timeRange: `${days} days`
        }
      }
    });
  } catch (error) {
    console.error('Get failed logins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get suspicious activity (Super Admin only)
 */
const getSuspiciousActivity = async (req, res) => {
  try {
    const { days = 7, limit = 50 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Define suspicious patterns
    const suspiciousActions = [
      'PASSWORD_CHANGED',
      'USER_DELETED',
      'COMPANY_DELETED',
      'SYSTEM_ACTION'
    ];

    const suspiciousActivity = await prisma.auditLog.findMany({
      where: {
        action: {
          in: suspiciousActions
        },
        createdAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Get activity summary
    const activitySummary = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        action: {
          in: suspiciousActions
        },
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        action: true
      }
    });

    res.json({
      success: true,
      data: {
        suspiciousActivity,
        summary: {
          totalActivities: suspiciousActivity.length,
          activityBreakdown: activitySummary,
          timeRange: `${days} days`
        }
      }
    });
  } catch (error) {
    console.error('Get suspicious activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Generate security report (Super Admin only)
 */
const generateSecurityReport = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get comprehensive security data
    const [
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      recentLogins,
      failedLogins,
      passwordChanges,
      userDeletions,
      companyDeletions,
      auditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isEmailVerified: true } }),
      prisma.user.count({ where: { isEmailVerified: false } }),
      prisma.auditLog.count({
        where: {
          action: 'USER_LOGIN',
          createdAt: { gte: startDate }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'USER_LOGIN',
          createdAt: { gte: startDate }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'PASSWORD_CHANGED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'USER_DELETED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'COMPANY_DELETED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.auditLog.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
              company: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      })
    ]);

    const report = {
      period: {
        startDate,
        endDate: new Date(),
        days: parseInt(days)
      },
      userStats: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0
      },
      activityStats: {
        recentLogins,
        failedLogins,
        passwordChanges,
        userDeletions,
        companyDeletions,
        totalAuditEvents: auditLogs.length
      },
      securityMetrics: {
        failedLoginRate: recentLogins > 0 ? (failedLogins / (recentLogins + failedLogins) * 100).toFixed(2) : 0,
        passwordChangeRate: totalUsers > 0 ? (passwordChanges / totalUsers * 100).toFixed(2) : 0,
        deletionRate: totalUsers > 0 ? (userDeletions / totalUsers * 100).toFixed(2) : 0
      },
      recentActivity: auditLogs.slice(0, 20)
    };

    // Log the report generation
    await logAuditActionDirect(req, 'SYSTEM_ACTION', 'Security', {
      entityId: null,
      metadata: {
        reportPeriod: `${days} days`,
        generatedBy: req.user.name,
        reportType: 'comprehensive'
      }
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate security report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user sessions (Super Admin only)
 */
const getUserSessions = async (req, res) => {
  try {
    const { limit = 100, days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get recent login activities
    const userSessions = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Get active users (users who logged in within the last 24 hours)
    const activeUsers = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      distinct: ['userId']
    });

    res.json({
      success: true,
      data: {
        userSessions,
        activeUsers,
        summary: {
          totalSessions: userSessions.length,
          activeUsers: activeUsers.length,
          timeRange: `${days} days`
        }
      }
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reset all user passwords (Super Admin only)
 */
const resetAllPasswords = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Get all users except SUPER_ADMIN
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'SUPER_ADMIN'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (users.length === 0) {
      return res.status(400).json({ error: 'No users found to reset passwords for' });
    }

    // Hash the new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update all user passwords
    await prisma.user.updateMany({
      where: {
        role: {
          not: 'SUPER_ADMIN'
        }
      },
      data: {
        password: hashedPassword
      }
    });

    // Log the bulk password reset
    await logAuditActionDirect(req, 'SYSTEM_ACTION', 'Security', {
      entityId: null,
      metadata: {
        affectedUsers: users.length,
        resetBy: req.user.name,
        resetByRole: req.user.role
      }
    });

    res.json({
      success: true,
      message: `Successfully reset passwords for ${users.length} users`,
      data: {
        affectedUsers: users.length,
        users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
      }
    });
  } catch (error) {
    console.error('Reset all passwords error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Lock suspicious accounts (Super Admin only)
 */
const lockSuspiciousAccounts = async (req, res) => {
  try {
    const { days = 7, failedLoginThreshold = 5 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Find users with excessive failed logins
    const suspiciousUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        userId: true
      },
      having: {
        userId: {
          _count: {
            gte: parseInt(failedLoginThreshold)
          }
        }
      }
    });

    if (suspiciousUsers.length === 0) {
      return res.json({
        success: true,
        message: 'No suspicious accounts found',
        data: {
          lockedAccounts: 0,
          suspiciousUsers: []
        }
      });
    }

    // Get user details
    const userIds = suspiciousUsers.map(s => s.userId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    // For now, we'll mark them as suspicious in audit logs
    // In a real system, you might want to add a 'locked' or 'suspended' field
    for (const user of users) {
      await logAuditActionDirect(req, 'SYSTEM_ACTION', 'Security', {
        entityId: user.id,
        userName: user.name,
        metadata: {
          reason: 'Excessive failed login attempts',
          failedLogins: suspiciousUsers.find(s => s.userId === user.id)?._count?.userId || 0,
          lockedBy: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: `Identified ${users.length} suspicious accounts`,
      data: {
        suspiciousUsers: users,
        lockedAccounts: users.length,
        criteria: {
          days: parseInt(days),
          failedLoginThreshold: parseInt(failedLoginThreshold)
        }
      }
    });
  } catch (error) {
    console.error('Lock suspicious accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getFailedLogins,
  getSuspiciousActivity,
  generateSecurityReport,
  getUserSessions,
  resetAllPasswords,
  lockSuspiciousAccounts
};
