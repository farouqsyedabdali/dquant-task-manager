const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const emailVerificationEmail = require('../templates/emailVerificationEmail');

const prisma = new PrismaClient();

// Send verification email
const sendVerificationEmail = async (req, res) => {
  try {
    console.log('📨 Send verification email request received');
    const { email } = req.body;
    console.log('Request body:', req.body);

    if (!email) {
      console.log('❌ No email provided in request');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('🔍 Looking for user with email:', email);
    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: { company: true }
    });

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', { id: user.id, email: user.email, isVerified: user.isEmailVerified });

    if (user.isEmailVerified) {
      console.log('⚠️ Email already verified');
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('🔐 Generated verification code:', verificationCode);

    // Update user with verification code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires
      }
    });
    console.log('💾 Updated user with verification code');

    // Send verification email
    console.log('📧 Preparing to send verification email');
    const emailData = emailVerificationEmail(user.name, verificationCode);
    const result = await emailService.sendEmail({
      to: user.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    if (!result?.success) {
      console.error('❌ Email send failed:', result?.error);
      return res.status(500).json({ error: result?.error || 'Failed to send verification email' });
    }

    console.log('✅ Verification email sent successfully to:', user.email);
    res.json({ 
      message: 'Verification email sent successfully',
      email: user.email 
    });

  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
};

// Verify email with code
const verifyEmail = async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({ error: 'Verification code and email are required' });
    }

    // Find user with valid code
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        emailVerificationCode: code,
        emailVerificationExpires: {
          gt: new Date()
        }
      },
      include: { company: true }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification code' 
      });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null
      }
    });

    res.json({ 
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: true,
        company: user.company
      }
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

// Check verification status
const checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        emailVerificationExpires: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      hasValidCode: user.emailVerificationExpires && user.emailVerificationExpires > new Date()
    });

  } catch (error) {
    console.error('Check verification status error:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
};

module.exports = {
  sendVerificationEmail,
  verifyEmail,
  checkVerificationStatus
};
