const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getAuthUrl, verifyToken } = require('../services/googleAuthService');

// Helper to get frontend URL
const getFrontendUrl = () => {
  return (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];
};

// Initiate Google OAuth flow
const initiateGoogleAuth = async (req, res) => {
  try {
    const { signupType } = req.query; // 'company' or 'personal'
    const authUrl = getAuthUrl();
    
    // Store signup type in state parameter
    const state = Buffer.from(JSON.stringify({ signupType })).toString('base64');
    const urlWithState = `${authUrl}&state=${state}`;
    
    res.redirect(urlWithState);
  } catch (error) {
    console.error('Google auth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate Google authentication' });
  }
};

// Handle Google OAuth callback
const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const frontendUrl = getFrontendUrl();
    
    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=oauth_cancelled`);
    }

    // Decode state to get signup type
    let signupType = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        signupType = decoded.signupType;
      } catch (e) {
        // State might not be in expected format
      }
    }

    // Verify token and get user info
    const googleUser = await verifyToken(code);

    // Check if user already exists by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
      include: { company: true }
    });

    // If not found by googleId, check by email
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: googleUser.email },
        include: { company: true }
      });
    }

    // If user exists, log them in
    if (user) {
      // Check if this is a company account - Google OAuth is only for personal accounts
      if (!user.company.isPersonal) {
        return res.redirect(`${frontendUrl}/login?error=Google Sign-In is only available for personal accounts. Please sign in with your email and password.`);
      }

      // Update googleId if not set
      if (!user.googleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            googleId: googleUser.googleId,
            authProvider: 'google'
          }
        });
      }

      // Check if company is suspended
      if (user.company.markedForDeletion) {
        return res.redirect(`${frontendUrl}/login?error=company_suspended`);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          companyId: user.companyId,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Redirect to frontend with token
      return res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);
    }

    // User doesn't exist - need to create account
    // Google OAuth is only for personal accounts
    // If signupType is 'company', redirect to error
    if (signupType === 'company') {
      return res.redirect(`${frontendUrl}/company-signup?error=Google sign-up is only available for personal accounts. Please use the form below to create a company account.`);
    }
    
    // Default to personal account creation
    if (signupType === 'personal' || !signupType) {
      // Create personal account
      const company = await prisma.company.create({
        data: {
          name: googleUser.name + "'s Personal",
          email: googleUser.email,
          passwordHash: null,
          googleId: googleUser.googleId,
          authProvider: 'google',
          isPersonal: true
        }
      });

      const newUser = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          password: null,
          googleId: googleUser.googleId,
          authProvider: 'google',
          role: 'SYSDMIN', // Personal accounts get SYSDMIN role (same as regular signup)
          companyId: company.id,
          isEmailVerified: googleUser.emailVerified || true
        },
        include: { company: true }
      });

      const token = jwt.sign(
        { 
          userId: newUser.id,
          companyId: newUser.companyId,
          role: newUser.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&newUser=true`);
    } else {
      // No signup type - default to personal account
      const company = await prisma.company.create({
        data: {
          name: googleUser.name + "'s Personal",
          email: googleUser.email,
          passwordHash: null,
          googleId: googleUser.googleId,
          authProvider: 'google',
          isPersonal: true
        }
      });

      const newUser = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          password: null,
          googleId: googleUser.googleId,
          authProvider: 'google',
          role: 'SYSDMIN', // Personal accounts get SYSDMIN role (same as regular signup)
          companyId: company.id,
          isEmailVerified: googleUser.emailVerified || true
        },
        include: { company: true }
      });

      const token = jwt.sign(
        { 
          userId: newUser.id,
          companyId: newUser.companyId,
          role: newUser.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&newUser=true`);
    }
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = getFrontendUrl();
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};

module.exports = {
  initiateGoogleAuth,
  handleGoogleCallback
};

