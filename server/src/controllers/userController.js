const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { logAuditActionDirect } = require('../middleware/auditLogger');

const prisma = new PrismaClient();

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    const users = await prisma.user.findMany({
      where: {
        companyId: companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get employees for task assignment (available to all authenticated users)
const getEmployeesForAssignment = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    const employees = await prisma.user.findMany({
      where: {
        companyId: companyId,
        role: 'EMPLOYEE'
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const user = await prisma.user.findFirst({
      where: { 
        id: parseInt(id),
        companyId: companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, role = 'EMPLOYEE' } = req.body;
    const companyId = req.user.companyId;
    const currentUserRole = req.user.role;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate role
    if (!['EMPLOYEE', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be EMPLOYEE or ADMIN' });
    }

    // Only SYSDMIN can create ADMIN users
    if (role === 'ADMIN' && currentUserRole !== 'SYSDMIN') {
      return res.status(403).json({ error: 'Only System Administrators can create Admin users' });
    }

    // Check if email already exists in the company
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        companyId: companyId
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists in this company' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log audit action
    await logAuditActionDirect(req, 'USER_CREATED', 'User', {
      entityId: newUser.id,
      newUserName: newUser.name,
      metadata: {
        userEmail: newUser.email,
        userRole: newUser.role,
        createdBy: req.user.name
      }
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user (including role changes)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const companyId = req.user.companyId;
    const currentUserRole = req.user.role;

    // Check if user exists and belongs to the company
    const userToUpdate = await prisma.user.findFirst({
      where: {
        id: parseInt(id),
        companyId: companyId
      }
    });

    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent updating SYSDMIN users (only SYSDMIN can update them)
    if (userToUpdate.role === 'SYSDMIN' && currentUserRole !== 'SYSDMIN') {
      return res.status(403).json({ error: 'Only System Administrators can update other System Administrators' });
    }

    // Validate role if provided
    if (role && !['EMPLOYEE', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be EMPLOYEE or ADMIN' });
    }

    // Only SYSDMIN can change roles to ADMIN
    if (role === 'ADMIN' && currentUserRole !== 'SYSDMIN') {
      return res.status(403).json({ error: 'Only System Administrators can assign Admin roles' });
    }

    // Log audit action before update
    const changes = [];
    if (name && name !== userToUpdate.name) {
      changes.push(`name from "${userToUpdate.name}" to "${name}"`);
    }
    if (email && email !== userToUpdate.email) {
      changes.push(`email from "${userToUpdate.email}" to "${email}"`);
    }
    if (role && role !== userToUpdate.role) {
      changes.push(`role from "${userToUpdate.role}" to "${role}"`);
    }

    if (changes.length > 0) {
      await logAuditActionDirect(req, 'USER_UPDATED', 'User', {
        entityId: userToUpdate.id,
        userName: userToUpdate.name,
        oldValues: {
          name: userToUpdate.name,
          email: userToUpdate.email,
          role: userToUpdate.role
        },
        newValues: {
          name: name || userToUpdate.name,
          email: email || userToUpdate.email,
          role: role || userToUpdate.role
        },
        metadata: {
          changes: changes.join(', '),
          updatedBy: req.user.name
        }
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user (employee or admin, but not sysadmin)
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // Prevent self-deletion
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists and belongs to the company
    const userToDelete = await prisma.user.findFirst({
      where: {
        id: parseInt(id),
        companyId: companyId
      }
    });

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of SYSDMIN users (only SYSDMIN can delete them)
    if (userToDelete.role === 'SYSDMIN' && currentUserRole !== 'SYSDMIN') {
      return res.status(403).json({ error: 'Only System Administrators can delete other System Administrators' });
    }

    // Check if user has any assigned tasks
    const assignedTasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: parseInt(id) },
          { assignerId: parseInt(id) }
        ]
      }
    });

    if (assignedTasks.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with assigned tasks. Please reassign or complete all tasks first.' 
      });
    }

    // Log audit action before deletion
    await logAuditActionDirect(req, 'USER_DELETED', 'User', {
      entityId: userToDelete.id,
      userName: userToDelete.name,
      oldValues: {
        name: userToDelete.name,
        email: userToDelete.email,
        role: userToDelete.role
      },
      metadata: {
        deletedBy: req.user.name,
        assignedTasksCount: assignedTasks.length
      }
    });

    // Delete user
    await prisma.user.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete company (only SYSDMIN can do this)
const deleteCompany = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const currentUserRole = req.user.role;

    // Only SYSDMIN can delete the company
    if (currentUserRole !== 'SYSDMIN') {
      return res.status(403).json({ error: 'Only System Administrators can delete the company' });
    }

    // Mark company for deletion (soft delete)
    await prisma.company.update({
      where: { id: companyId },
      data: { markedForDeletion: true }
    });

    res.json({ message: 'Company marked for deletion. All data will be permanently removed within 30 days.' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllUsers,
  getEmployeesForAssignment,
  getUserById,
  createEmployee,
  updateUser,
  deleteEmployee,
  deleteCompany
}; 