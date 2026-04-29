const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const { logAuditActionDirect } = require('../middleware/auditLogger');



/**
 * Get all companies with health metrics (Super Admin only)
 */
const getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, subscriptionPlan, isPersonal } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (subscriptionPlan) {
      whereClause.subscriptionPlan = subscriptionPlan;
    }
    
    if (isPersonal !== undefined) {
      whereClause.isPersonal = isPersonal === 'true';
    }

    // Get companies with user counts and last activity
    const companies = await prisma.company.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            users: true,
            tasks: true,
            auditLogs: true
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
    const totalCount = await prisma.company.count({
      where: whereClause
    });

    // Calculate health metrics for each company
    const companiesWithHealth = companies.map(company => {
      const userCount = company._count.users;
      const taskCount = company._count.tasks;
      const auditCount = company._count.auditLogs;
      
      // Calculate health score (0-100)
      let healthScore = 100;
      
      // Deduct points for inactive companies
      const daysSinceCreation = Math.floor((new Date() - company.createdAt) / (1000 * 60 * 60 * 24));
      if (daysSinceCreation > 30 && userCount === 0) {
        healthScore -= 50; // Inactive company
      }
      
      // Deduct points for companies with no recent activity (using createdAt as proxy)
      const lastActivity = company.users.reduce((latest, user) => {
        return user.createdAt > latest ? user.createdAt : latest;
      }, company.createdAt);
      
      const daysSinceActivity = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysSinceActivity > 7) {
        healthScore -= Math.min(30, daysSinceActivity * 2);
      }
      
      // Deduct points for companies marked for deletion
      if (company.markedForDeletion) {
        healthScore -= 100;
      }
      
      healthScore = Math.max(0, healthScore);
      
      // Determine health status
      let healthStatus = 'healthy';
      if (healthScore < 30) healthStatus = 'critical';
      else if (healthScore < 60) healthStatus = 'warning';
      else if (healthScore < 80) healthStatus = 'fair';
      
      return {
        ...company,
        healthScore,
        healthStatus,
        userCount,
        taskCount,
        auditCount,
        lastActivity,
        daysSinceActivity
      };
    });

    res.json({
      success: true,
      data: {
        companies: companiesWithHealth,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get company details by ID (Super Admin only)
 */
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            isEmailVerified: true
          }
        },
        _count: {
          select: {
            users: true,
            tasks: true,
            auditLogs: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Get company by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Search users across all companies (Super Admin only)
 */
const searchUsersGlobally = async (req, res) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 20, 
      role, 
      companyId,
      isEmailVerified,
      lastLoginDays 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (companyId) {
      whereClause.companyId = parseInt(companyId);
    }
    
    if (isEmailVerified !== undefined) {
      whereClause.isEmailVerified = isEmailVerified === 'true';
    }
    
    if (lastLoginDays) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(lastLoginDays));
      whereClause.lastLoginAt = {
        gte: daysAgo
      };
    }

    // Get users with company information
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionPlan: true,
            isPersonal: true
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
    const totalCount = await prisma.user.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Search users globally error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get system health metrics (Super Admin only)
 */
const getSystemHealth = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get basic counts
    const totalCompanies = await prisma.company.count();
    const totalUsers = await prisma.user.count();
    const totalTasks = await prisma.task.count();
    const totalAuditLogs = await prisma.auditLog.count();

    // Get recent activity
    const recentCompanies = await prisma.company.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const recentTasks = await prisma.task.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    // Get subscription distribution
    const subscriptionStats = await prisma.company.groupBy({
      by: ['subscriptionPlan'],
      _count: {
        subscriptionPlan: true
      }
    });

    // Get role distribution
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    // Get companies by health status
    const companies = await prisma.company.findMany({
      include: {
        users: {
          select: {
            createdAt: true
          }
        }
      }
    });

    let healthyCompanies = 0;
    let warningCompanies = 0;
    let criticalCompanies = 0;

    companies.forEach(company => {
      const userCount = company.users.length;
      const daysSinceCreation = Math.floor((new Date() - company.createdAt) / (1000 * 60 * 60 * 24));
      
      let healthScore = 100;
      
      if (daysSinceCreation > 30 && userCount === 0) {
        healthScore -= 50;
      }
      
      if (company.markedForDeletion) {
        healthScore -= 100;
      }
      
      if (healthScore < 30) criticalCompanies++;
      else if (healthScore < 60) warningCompanies++;
      else healthyCompanies++;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalCompanies,
          totalUsers,
          totalTasks,
          totalAuditLogs,
          recentCompanies,
          recentUsers,
          recentTasks
        },
        subscriptionDistribution: subscriptionStats,
        roleDistribution: roleStats,
        companyHealth: {
          healthy: healthyCompanies,
          warning: warningCompanies,
          critical: criticalCompanies
        }
      }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reset user password (Super Admin only)
 */
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword },
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
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Suspend/activate company (Super Admin only)
 */
const toggleCompanyStatus = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { action } = req.body; // 'suspend' or 'activate'

    if (!['suspend', 'activate'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "suspend" or "activate"' });
    }

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // For now, we'll use markedForDeletion as a suspension mechanism
    // In a real system, you might want a separate 'suspended' field
    const updatedCompany = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: { 
        markedForDeletion: action === 'suspend' 
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Company ${action}d successfully`,
      data: updatedCompany
    });
  } catch (error) {
    console.error('Toggle company status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete company completely (Super Admin only)
 */
const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
      include: {
        users: true,
        tasks: true,
        projects: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check for active tasks and users
    const activeTasks = company.tasks.filter(task => task.status !== 'COMPLETED');
    const activeUsers = company.users.length;

    if (activeTasks.length > 0) {
      return res.status(400).json({
        error: `Cannot delete company with ${activeTasks.length} active tasks. Please complete or archive all tasks first.`
      });
    }

    // Log audit action before deletion
    await logAuditActionDirect(req, 'COMPANY_DELETED', 'Company', {
      entityId: company.id,
      companyName: company.name,
      oldValues: {
        name: company.name,
        email: company.email,
        subscriptionPlan: company.subscriptionPlan,
        userCount: company.users.length,
        taskCount: company.tasks.length,
        projectCount: company.projects.length
      },
      metadata: {
        deletedBy: req.user.name,
        activeUsersCount: activeUsers,
        activeTasksCount: activeTasks.length
      }
    });

    // Delete in proper order to handle foreign key constraints
    // Note: Prisma should handle most cascades, but we'll be explicit

    // Delete task-related data first
    await prisma.taskReminder.deleteMany({
      where: { task: { companyId: parseInt(companyId) } }
    });

    await prisma.comment.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    await prisma.notification.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    await prisma.taskCoAssignee.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    await prisma.taskCollaborator.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    await prisma.taskInvitation.deleteMany({
      where: { task: { companyId: parseInt(companyId) } }
    });

    await prisma.taskShare.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    await prisma.taskArchive.deleteMany({
      where: { task: { companyId: parseInt(companyId) } }
    });

    // Delete tasks
    await prisma.task.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    // Delete project-related data
    await prisma.projectMember.deleteMany({
      where: { project: { companyId: parseInt(companyId) } }
    });

    await prisma.project.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    // Delete template-related data
    await prisma.templateTask.deleteMany({
      where: { template: { companyId: parseInt(companyId) } }
    });

    await prisma.projectTemplate.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    // Delete user-related data
    await prisma.contact.deleteMany({
      where: { user: { companyId: parseInt(companyId) } }
    });

    // Delete audit logs for this company
    await prisma.auditLog.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    // Finally delete users and company
    await prisma.user.deleteMany({
      where: { companyId: parseInt(companyId) }
    });

    await prisma.company.delete({
      where: { id: parseInt(companyId) }
    });

    res.json({
      success: true,
      message: `Company "${company.name}" and all associated data deleted successfully`,
      data: {
        deletedCompany: {
          id: company.id,
          name: company.name,
          usersDeleted: company.users.length,
          tasksDeleted: company.tasks.length,
          projectsDeleted: company.projects.length
        }
      }
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete user globally (Super Admin only)
 */
const deleteUserGlobally = async (req, res) => {
  try {
    const { userId } = req.params;

    const userToDelete = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        company: true,
        _count: {
          select: {
            assignedTasks: true,
            createdTasks: true,
            coAssignedTasks: true,
            collaboratedTasks: true
          }
        }
      }
    });

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has any assigned tasks
    const assignedTasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: parseInt(userId) },
          { assignerId: parseInt(userId) }
        ]
      }
    });

    if (assignedTasks.length > 0) {
      return res.status(400).json({
        error: `Cannot delete user with ${assignedTasks.length} assigned tasks. Please reassign or complete all tasks first.`,
        taskCount: assignedTasks.length
      });
    }

    // Log audit action before deletion
    await logAuditActionDirect(req, 'USER_DELETED', 'User', {
      entityId: userToDelete.id,
      userName: userToDelete.name,
      oldValues: {
        name: userToDelete.name,
        email: userToDelete.email,
        role: userToDelete.role,
        companyId: userToDelete.companyId
      },
      metadata: {
        deletedBy: req.user.name,
        companyName: userToDelete.company.name,
        deletionType: 'global_super_admin',
        assignedTasksCount: userToDelete._count.assignedTasks,
        createdTasksCount: userToDelete._count.createdTasks,
        coAssignedTasksCount: userToDelete._count.coAssignedTasks,
        collaboratedTasksCount: userToDelete._count.collaboratedTasks
      }
    });

    // Delete user-related data in proper order
    // Delete task collaborations and co-assignments
    await prisma.taskCoAssignee.deleteMany({
      where: { userId: parseInt(userId) }
    });

    await prisma.taskCollaborator.deleteMany({
      where: { userId: parseInt(userId) }
    });

    await prisma.taskShare.deleteMany({
      where: { userId: parseInt(userId) }
    });

    // Delete contacts
    await prisma.contact.deleteMany({
      where: { userId: parseInt(userId) }
    });

    // Delete comments
    await prisma.comment.deleteMany({
      where: { authorId: parseInt(userId) }
    });

    // Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: parseInt(userId) }
    });

    // Delete project memberships
    await prisma.projectMember.deleteMany({
      where: { userId: parseInt(userId) }
    });

    // Delete project templates
    await prisma.projectTemplate.deleteMany({
      where: { userId: parseInt(userId) }
    });

    // Delete audit logs for this user
    await prisma.auditLog.deleteMany({
      where: { userId: parseInt(userId) }
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: parseInt(userId) }
    });

    res.json({
      success: true,
      message: `User "${userToDelete.name}" (${userToDelete.email}) deleted successfully`,
      data: {
        deletedUser: {
          id: userToDelete.id,
          name: userToDelete.name,
          email: userToDelete.email,
          companyName: userToDelete.company.name,
          role: userToDelete.role
        }
      }
    });
  } catch (error) {
    console.error('Delete user globally error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user engagement analytics (Super Admin only)
 */
const getUserEngagementAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Calculate Daily Active Users (DAU) - users who logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dauResult = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    // Calculate Weekly Active Users (WAU) - users who logged in this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const wauResult = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: weekStart
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    // Calculate Monthly Active Users (MAU) - users who logged in this month
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    const mauResult = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: monthStart
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    // Task completion rate
    const totalTasks = await prisma.task.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const completedTasks = await prisma.task.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      }
    });

    // User retention - users who logged in both last week and this week
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastWeekUsers = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: lastWeekStart,
          lt: thisWeekStart
        }
      },
      select: { userId: true },
      distinct: ['userId']
    });

    const thisWeekUsers = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: thisWeekStart
        }
      },
      select: { userId: true },
      distinct: ['userId']
    });

    const lastWeekUserIds = new Set(lastWeekUsers.map(u => u.userId));
    const thisWeekUserIds = new Set(thisWeekUsers.map(u => u.userId));
    const retainedUsers = [...lastWeekUserIds].filter(id => thisWeekUserIds.has(id));

    // Feature usage statistics
    const featureUsage = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        createdAt: { gte: startDate },
        action: {
          in: ['TASK_CREATED', 'TASK_UPDATED', 'TASK_COMPLETED', 'COMMENT_ADDED', 'PROJECT_CREATED']
        }
      },
      _count: {
        action: true
      }
    });

    // User growth over time (daily signups)
    const userGrowth = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by day
    const dailySignups = {};
    userGrowth.forEach(user => {
      const day = user.createdAt.toISOString().split('T')[0];
      dailySignups[day] = (dailySignups[day] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        timeRange: `${days} days`,
        userActivity: {
          dailyActiveUsers: dauResult.length,
          weeklyActiveUsers: wauResult.length,
          monthlyActiveUsers: mauResult.length,
          retentionRate: lastWeekUsers.length > 0 ? (retainedUsers.length / lastWeekUsers.length * 100).toFixed(1) : 0
        },
        taskMetrics: {
          totalTasksCreated: totalTasks,
          totalTasksCompleted: completedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0
        },
        featureUsage: featureUsage.map(item => ({
          action: item.action,
          count: item._count.action,
          description: item.action.replace(/_/g, ' ').toLowerCase()
        })),
        growthMetrics: {
          newUsersThisPeriod: userGrowth.length,
          dailySignups: dailySignups
        }
      }
    });
  } catch (error) {
    console.error('Get user engagement analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  searchUsersGlobally,
  getSystemHealth,
  resetUserPassword,
  toggleCompanyStatus,
  deleteCompany,
  deleteUserGlobally,
  getUserEngagementAnalytics
};
