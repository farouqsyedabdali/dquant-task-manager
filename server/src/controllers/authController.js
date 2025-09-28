const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const login = async (req, res) => {
  try {
    const { email, password, companyEmail } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // First, find the company by email
    let company = null;
    if (companyEmail) {
      company = await prisma.company.findUnique({
        where: { email: companyEmail }
      });
    }

    // If no company email provided, try to find user by email across all companies
    let user = null;
    if (company) {
      // Find user within the specific company
      user = await prisma.user.findFirst({
        where: { 
          email: email,
          companyId: company.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
          companyId: true
        }
      });
    } else {
      // Find user across all companies (for backward compatibility)
      user = await prisma.user.findFirst({
        where: { email: email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
          companyId: true
        }
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get company info
    const userCompany = await prisma.company.findUnique({
      where: { id: user.companyId }
    });

    const token = jwt.sign(
      { 
        userId: user.id,
        companyId: user.companyId,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: userCompany.name,
        isPersonal: userCompany.isPersonal
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'EMPLOYEE', companyId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Check if user already exists in this company
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: email,
        companyId: companyId
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists in this company' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        createdAt: true
      }
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const userWithCompany = {
      ...req.user,
      companyName: req.user.company?.name,
      isPersonal: req.user.company?.isPersonal || false
    };
    res.json({ user: userWithCompany });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.user;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found' });
    }

    // Check if user is SYSDMIN
    if (req.user.role !== 'SYSDMIN') {
      return res.status(403).json({ error: 'Only System Administrators can delete companies' });
    }

    // Delete all data associated with the company
    await prisma.$transaction(async (tx) => {
      // Delete all comments
      await tx.comment.deleteMany({
        where: { companyId }
      });

      // Delete all tasks
      await tx.task.deleteMany({
        where: { companyId }
      });

      // Delete all users
      await tx.user.deleteMany({
        where: { companyId }
      });

      // Delete the company
      await tx.company.delete({
        where: { id: companyId }
      });
    });

    res.json({ message: 'Company and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const registerCompany = async (req, res) => {
  try {
    const { name, email, adminName, adminEmail, password } = req.body;

    if (!name || !email || !adminName || !adminEmail || !password) {
      return res.status(400).json({ error: 'Company name, company email, admin name, admin email, and password are required' });
    }

    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email }
    });

    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this email already exists' });
    }

    // Check if admin email already exists in any company
    const existingUser = await prisma.user.findFirst({
      where: { email: adminEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Admin email already exists in another company' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        subscriptionPlan: 'free'
      }
    });

    // Create system administrator user for the company
    const sysAdminUser = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'SYSDMIN',
        companyId: company.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true
      }
    });

    res.status(201).json({ 
      message: 'Company registered successfully', 
      company: {
        id: company.id,
        name: company.name,
        email: company.email
      },
      sysAdminUser
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const registerPersonal = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create personal company and user
    const result = await prisma.$transaction(async (tx) => {
      // Create a personal company
      const company = await tx.company.create({
        data: {
          name: `${name}'s Personal Tasks`,
          email: email.toLowerCase(),
          passwordHash: '', // Personal companies don't need a password
          isPersonal: true
        }
      });

      // Create the user as SYSDMIN
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'SYSDMIN',
          companyId: company.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              isPersonal: true
            }
          }
        }
      });

      return { user, company };
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.user.id, 
        companyId: result.user.companyId,
        role: result.user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Personal account created successfully',
      data: {
        token,
        user: {
          ...result.user,
          isPersonal: result.user.company.isPersonal
        }
      }
    });
  } catch (error) {
    console.error('Personal registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  login,
  register,
  registerCompany,
  registerPersonal,
  deleteCompany,
  getMe
}; 