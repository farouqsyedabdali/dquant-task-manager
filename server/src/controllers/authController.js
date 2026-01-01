const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const emailService = require('../services/emailService');
const emailVerificationEmail = require('../templates/emailVerificationEmail');

const login = async (req, res) => {
  try {
    const { email, password, companyEmail } = req.body;
    console.log('🔐 LOGIN ATTEMPT:', { email, companyEmail, timestamp: new Date().toISOString() });

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
          companyId: true,
          isEmailVerified: true,
          authProvider: true
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
          companyId: true,
          isEmailVerified: true,
          authProvider: true
        }
      });
    }

    if (!user) {
      console.log('❌ USER NOT FOUND:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('👤 USER FOUND:', { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      companyId: user.companyId,
      isEmailVerified: user.isEmailVerified
    });

    // Check if user uses Google auth
    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({ 
        error: 'This account uses Google Sign-In. Please sign in with Google.',
        requiresGoogleAuth: true
      });
    }

    // Check password only if user has password
    if (user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('❌ INVALID PASSWORD for user:', user.email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified (only for accounts created after verification feature was added)
    // If emailVerificationCode exists, it means the account was created with verification enabled
    // Old accounts won't have this code, so they can log in without verification
    if (user.isEmailVerified === false && user.emailVerificationCode) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in. Check your inbox for a verification email.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Get company info
    const userCompany = await prisma.company.findUnique({
      where: { id: user.companyId }
    });

    // Check if company is suspended
    if (userCompany.markedForDeletion) {
      console.log('🚫 COMPANY SUSPENDED:', {
        companyId: userCompany.id,
        companyName: userCompany.name,
        userEmail: user.email,
        isPersonal: userCompany.isPersonal
      });
      
      // Different messages for personal vs company accounts
      const errorMessage = userCompany.isPersonal 
        ? `Your account has been suspended. Please contact support to restore access.`
        : `Your company's account has been suspended. Please contact support to restore access.`;
      
      return res.status(403).json({ 
        error: errorMessage,
        companySuspended: true,
        companyName: userCompany.name,
        isPersonal: userCompany.isPersonal
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        companyId: user.companyId,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ LOGIN SUCCESS:', { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      companyId: user.companyId,
      companyName: userCompany.name
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: userCompany.name,
        isPersonal: userCompany.isPersonal,
        isEmailVerified: user.isEmailVerified
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
      isPersonal: req.user.company?.isPersonal || false,
      autoArchivePeriod: req.user.company?.autoArchivePeriod || null
    };
    res.json({ user: userWithCompany });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateAutoArchivePeriod = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { autoArchivePeriod } = req.body;

    // Validate autoArchivePeriod (must be 3, 6, 9, 12, or null)
    if (autoArchivePeriod !== null && ![3, 6, 9, 12].includes(autoArchivePeriod)) {
      return res.status(400).json({ error: 'Auto archive period must be 3, 6, 9, or 12 months, or null to disable' });
    }

    // Check if user is SYSDMIN or ADMIN
    if (req.user.role !== 'SYSDMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can update auto-archive settings' });
    }

    // Update company autoArchivePeriod
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { autoArchivePeriod }
    });

    res.json({ 
      message: 'Auto-archive period updated successfully',
      autoArchivePeriod: updatedCompany.autoArchivePeriod
    });
  } catch (error) {
    console.error('Update auto-archive period error:', error);
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
      // Delete all notifications (must be first - has foreign key constraint)
      await tx.notification.deleteMany({
        where: { companyId }
      });

      // Delete all task shares
      await tx.taskShare.deleteMany({
        where: { companyId }
      });

      // Delete all task collaborators
      await tx.taskCollaborator.deleteMany({
        where: { companyId }
      });

      // Delete all task co-assignees
      await tx.taskCoAssignee.deleteMany({
        where: { companyId }
      });

      // Delete all template tasks (before deleting project templates)
      await tx.templateTask.deleteMany({
        where: {
          template: { companyId }
        }
      });

      // Delete all project templates
      await tx.projectTemplate.deleteMany({
        where: { companyId }
      });

      // Delete all projects (project members will cascade delete)
      await tx.project.deleteMany({
        where: { companyId }
      });

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

      // Delete the company (audit logs will cascade delete)
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
        subscriptionPlan: 'free',
        autoArchivePeriod: 12
      }
    });

    // Generate email verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create system administrator user for the company
    const sysAdminUser = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'SYSDMIN',
        companyId: company.id,
        isEmailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true
      }
    });

    // Send verification email (only if email sending is enabled)
    if (process.env.ENABLE_EMAIL_VERIFICATION !== 'false') {
      try {
        const emailData = emailVerificationEmail(sysAdminUser.name, verificationCode);
        
        await emailService.sendEmail({
          to: sysAdminUser.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        console.log('✅ Verification email sent to:', sysAdminUser.email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email sending fails
      }
    } else {
      console.log('⚠️  Email verification disabled in development mode');
    }

    res.status(201).json({ 
      message: 'Company registered successfully. Please check your email to verify your account.', 
      company: {
        id: company.id,
        name: company.name,
        email: company.email
      },
      sysAdminUser: {
        ...sysAdminUser,
        isEmailVerified: false
      }
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

    // Generate email verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create personal company and user
    const result = await prisma.$transaction(async (tx) => {
      // Create a personal company
      const company = await tx.company.create({
        data: {
          name: `${name}'s Personal Tasks`,
          email: email.toLowerCase(),
          passwordHash: '', // Personal companies don't need a password
          isPersonal: true,
          autoArchivePeriod: 12
        }
      });

      // Create the user as SYSDMIN
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'SYSDMIN',
          companyId: company.id,
          isEmailVerified: false,
          emailVerificationCode: verificationCode,
          emailVerificationExpires: verificationExpires
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

    // Send verification email (only if email sending is enabled)
    if (process.env.ENABLE_EMAIL_VERIFICATION !== 'false') {
      try {
        const emailData = emailVerificationEmail(result.user.name, verificationCode);
        
        await emailService.sendEmail({
          to: result.user.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        console.log('✅ Verification email sent to:', result.user.email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email sending fails
      }
    } else {
      console.log('⚠️  Email verification disabled in development mode');
    }

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
      message: 'Personal account created successfully. Please check your email to verify your account.',
      data: {
        token,
        user: {
          ...result.user,
          isPersonal: result.user.company.isPersonal,
          isEmailVerified: false
        }
      }
    });
  } catch (error) {
    console.error('Personal registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Forgot password - send verification code
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        company: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset code has been sent.' 
      });
    }

    // Generate verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with verification code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expiresAt
      }
    });

    // Send email with verification code
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Password Reset Code</h2>
            <p>Hello ${user.name},</p>
            <p>You requested a password reset for your account. Use the following code to reset your password:</p>
            <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #4F46E5; margin: 0; font-size: 32px; letter-spacing: 4px;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>${user.company.name} Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset code has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify password reset code
const verifyPasswordResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Find user and verify code
    const user = await prisma.user.findFirst({
      where: { 
        email,
        emailVerificationCode: code,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    res.json({ 
      success: true, 
      message: 'Verification code is valid' 
    });
  } catch (error) {
    console.error('Verify password reset code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password with verification code
const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Find user and verify code
    const user = await prisma.user.findFirst({
      where: { 
        email,
        emailVerificationCode: code,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear verification code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerificationCode: null,
        emailVerificationExpires: null
      }
    });

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
  } catch (error) {
    console.error('Reset password with code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Complete employee account setup (set password after invitation)
const completeEmployeeSetup = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Invitation token and password are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find user by invitation token
    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        invitationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    // Check if user already has a password (already completed setup)
    if (user.password) {
      return res.status(400).json({ error: 'Account setup has already been completed' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with password and clear invitation data
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        invitationToken: null,
        invitationExpires: null,
        invitationSentAt: null,
        isEmailVerified: true // Mark email as verified since they completed setup
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        department: true,
        position: true
      }
    });

    // Get company info for JWT
    const company = await prisma.company.findUnique({
      where: { id: updatedUser.companyId },
      select: { id: true, name: true, isPersonal: true }
    });

    // Generate JWT token
    const token_payload = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      companyId: updatedUser.companyId,
      companyName: company.name,
      isPersonal: company.isPersonal,
      department: updatedUser.department,
      position: updatedUser.position
    };

    const jwt_token = jwt.sign(token_payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    console.log('✅ EMPLOYEE SETUP COMPLETED:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      company: company.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Account setup completed successfully',
      token: jwt_token,
      user: {
        ...updatedUser,
        company: company
      }
    });

  } catch (error) {
    console.error('Complete employee setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  login,
  register,
  registerCompany,
  registerPersonal,
  deleteCompany,
  getMe,
  updateAutoArchivePeriod,
  forgotPassword,
  verifyPasswordResetCode,
  resetPasswordWithCode,
  completeEmployeeSetup
}; 