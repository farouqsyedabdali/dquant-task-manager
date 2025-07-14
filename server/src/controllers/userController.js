const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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
    const { name, email, password } = req.body;
    const companyId = req.user.companyId;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
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

    // Create new employee
    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'EMPLOYEE',
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

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Check if user exists and belongs to the company
    const employee = await prisma.user.findFirst({
      where: {
        id: parseInt(id),
        companyId: companyId,
        role: 'EMPLOYEE'
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee has any assigned tasks
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
        error: 'Cannot delete employee with assigned tasks. Please reassign or complete all tasks first.' 
      });
    }

    // Delete employee
    await prisma.user.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllUsers,
  getEmployeesForAssignment,
  getUserById,
  createEmployee,
  deleteEmployee
}; 