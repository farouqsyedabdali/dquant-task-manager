const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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

module.exports = {
  getAllCompanies,
  getCompanyById,
  searchUsersGlobally,
  getSystemHealth,
  resetUserPassword,
  toggleCompanyStatus
};
