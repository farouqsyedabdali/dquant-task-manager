const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logAuditActionDirect } = require('../middleware/auditLogger');
const emailService = require('../services/emailService');
const employeeInvitationEmail = require('../templates/employeeInvitationEmail');

const prisma = require('../lib/prisma');

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
        department: true,
        position: true,
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
        companyId: companyId
        // Include all users regardless of role (admins can be assigned tasks too)
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true // Include role for potential future filtering
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
    const { name, email, role = 'EMPLOYEE', department = 'Default Department', position = 'Default Position' } = req.body;
    const companyId = req.user.companyId;
    const currentUserRole = req.user.role;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
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

    // Generate invitation token and expiry (24 hours)
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user (without password - will be set during invitation completion)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role,
        department,
        position,
        companyId,
        invitationToken,
        invitationExpires,
        invitationSentAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        invitationToken: true,
        invitationExpires: true,
        invitationSentAt: true
      }
    });

    // Get company name for email
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true }
    });

    // Send invitation email
    try {
      const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].replace(/\/$/, '');
      const invitationUrl = `${clientUrl}/employee-setup/${invitationToken}`;

      // Debug logging
      console.log('🎯 Employee Invitation Debug (createEmployee):');
      console.log('  CLIENT_URL env var:', process.env.CLIENT_URL);
      console.log('  clientUrl used:', clientUrl);
      console.log('  invitationUrl generated:', invitationUrl);

      const emailTemplate = employeeInvitationEmail(
        newUser.name,
        req.user.name,
        company?.name || 'Your Company',
        invitationUrl
      );

      await emailService.sendEmail({
        to: newUser.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the user creation if email fails, but log it
    }

    // Log audit action
    await logAuditActionDirect(req, 'USER_CREATED', 'User', {
      entityId: newUser.id,
      newUserName: newUser.name,
      metadata: {
        userEmail: newUser.email,
        userRole: newUser.role,
        createdBy: req.user.name,
        invitationSent: true
      }
    });

    res.status(201).json({
      ...newUser,
      invitationStatus: 'sent'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Resend employee invitation
const resendEmployeeInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const currentUserRole = req.user.role;

    // Only admins and sysadmins can resend invitations
    if (!['ADMIN', 'SYSDMIN'].includes(currentUserRole)) {
      return res.status(403).json({ error: 'Only administrators can resend invitations' });
    }

    // Get the user
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(id),
        companyId: companyId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if user already has a password (already completed setup)
    if (user.password) {
      return res.status(400).json({ error: 'Employee has already completed account setup' });
    }

    // Generate new invitation token and expiry
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new invitation
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        invitationToken,
        invitationExpires,
        invitationSentAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        invitationToken: true,
        invitationExpires: true,
        invitationSentAt: true
      }
    });

    // Get company name for email
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true }
    });

    // Send invitation email
    try {
      const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].replace(/\/$/, '');
      const invitationUrl = `${clientUrl}/employee-setup/${invitationToken}`;

      // Debug logging
      console.log('🎯 Employee Invitation Debug (resendEmployeeInvitation):');
      console.log('  CLIENT_URL env var:', process.env.CLIENT_URL);
      console.log('  clientUrl used:', clientUrl);
      console.log('  invitationUrl generated:', invitationUrl);

      const emailTemplate = employeeInvitationEmail(
        updatedUser.name,
        req.user.name,
        company?.name || 'Your Company',
        invitationUrl
      );

      await emailService.sendEmail({
        to: updatedUser.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      return res.status(500).json({ error: 'Failed to send invitation email' });
    }

    // Log audit action
    await logAuditActionDirect(req, 'USER_INVITATION_RESENT', 'User', {
      entityId: updatedUser.id,
      userName: updatedUser.name,
      metadata: {
        userEmail: updatedUser.email,
        resentBy: req.user.name
      }
    });

    res.json({
      message: 'Invitation resent successfully',
      user: updatedUser,
      invitationStatus: 'resent'
    });

  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user (including role changes)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, position } = req.body;
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
        ...(role && { role }),
        ...(department && { department }),
        ...(position && { position })
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

// Reset user password (admin/sysadmin can reset passwords for their company users)
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const companyId = req.user.companyId;
    const currentUserRole = req.user.role;

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password is required and must be at least 6 characters long' });
    }

    // Check if user exists and belongs to the company
    const userToReset = await prisma.user.findFirst({
      where: {
        id: parseInt(id),
        companyId: companyId
      }
    });

    if (!userToReset) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent resetting SYSDMIN passwords (only SYSDMIN can reset other SYSDMIN passwords)
    if (userToReset.role === 'SYSDMIN' && currentUserRole !== 'SYSDMIN') {
      return res.status(403).json({ error: 'Only System Administrators can reset other System Administrators\' passwords' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    // Log audit action
    await logAuditActionDirect(req, 'PASSWORD_CHANGED', 'User', {
      entityId: updatedUser.id,
      userName: updatedUser.name,
      metadata: {
        userEmail: updatedUser.email,
        userRole: updatedUser.role,
        resetBy: req.user.name,
        resetByRole: req.user.role
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Reset user password error:', error);
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
  resetUserPassword,
  deleteCompany,
  resendEmployeeInvitation
}; 