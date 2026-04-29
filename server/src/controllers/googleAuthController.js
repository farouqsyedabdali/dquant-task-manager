const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getAuthUrl, verifyToken, verifyIdToken, createOAuthState, parseOAuthState } = require('../services/googleAuthService');
const { upsertGmailAccountFromOAuth } = require('../services/gmailAgentService');

// Helper to get frontend URL
const getFrontendUrl = () => {
  return (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];
};

const findSingleUserByEmail = async (email) => {
  const users = await prisma.user.findMany({
    where: { email },
    include: { company: true },
    take: 2
  });

  if (users.length > 1) {
    return { ambiguous: true, user: null };
  }

  return { ambiguous: false, user: users[0] || null };
};

// Initiate Google OAuth flow
const initiateGoogleAuth = async (req, res) => {
  try {
    const { signupType } = req.query; // 'company' or 'personal'
    const authUrl = getAuthUrl();
    
    // Store signup type in a signed state parameter.
    const state = createOAuthState({ signupType });
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

    // Decode state to get signup type and check if this is incremental auth
    let signupType = null;
    let isIncrementalAuth = false;
    let isGmailAgentAuth = false;
    let gmailAgentUserId = null;
    if (state) {
      try {
        const decoded = parseOAuthState(state);
        signupType = decoded.signupType;
        isIncrementalAuth = decoded.isIncrementalAuth || false;
        isGmailAgentAuth = decoded.isGmailAgentAuth || false;
        gmailAgentUserId = decoded.userId ? Number(decoded.userId) : null;
      } catch (e) {
        return res.redirect(`${frontendUrl}/login?error=invalid_oauth_state`);
      }
    }

    // Verify token and get user info (now returns tokens too)
    const googleUser = await verifyToken(code);

    if (isGmailAgentAuth) {
      if (!gmailAgentUserId) {
        return res.redirect(`${frontendUrl}/settings?category=integrations&gmail=invalid_state`);
      }

      await upsertGmailAccountFromOAuth({
        userId: gmailAgentUserId,
        googleUser
      });

      return res.redirect(`${frontendUrl}/settings?category=integrations&gmail=connected`);
    }

    // Check if user already exists by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
      include: { company: true }
    });

    // If not found by googleId, check by email
    if (!user) {
      const result = await findSingleUserByEmail(googleUser.email);
      if (result.ambiguous) {
        return res.redirect(`${frontendUrl}/login?error=multiple_accounts_for_email`);
      }
      user = result.user;
    }

    // If user exists, handle login or incremental auth
    if (user) {
      // Handle incremental authorization FIRST (user is linking Google for contacts, not logging in)
      // This must be checked before the personal-only gate since company account users
      // can still link their Google account for contacts import.
      if (isIncrementalAuth) {
        // Link Google account and update tokens, but preserve original authProvider
        const updateData = {
          googleId: googleUser.googleId
        };

        if (googleUser.accessToken) {
          updateData.googleAccessToken = googleUser.accessToken;
          updateData.googleRefreshToken = googleUser.refreshToken;
          updateData.googleTokenExpiry = googleUser.tokenExpiry;
          updateData.googleContactsScope = googleUser.scopes.includes('https://www.googleapis.com/auth/contacts.readonly');
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });

        console.log('🔄 Incremental auth completed for user:', user.id, 'contacts scope:', updateData.googleContactsScope);
        // Redirect back to the frontend with success indicator
        return res.redirect(`${frontendUrl}/auth/google/callback?incremental=true&contacts=${updateData.googleContactsScope}`);
      }

      // For regular Google Sign-In (not contacts linking), only allow personal accounts
      if (!user.company.isPersonal) {
        return res.redirect(`${frontendUrl}/login?error=Google Sign-In is only available for personal accounts. Please sign in with your email and password.`);
      }

      // Update googleId and tokens if not set
      const updateData = {
        googleId: googleUser.googleId,
        authProvider: 'google'
      };

      // Always update tokens to ensure we have fresh ones
      if (googleUser.accessToken) {
        updateData.googleAccessToken = googleUser.accessToken;
        updateData.googleRefreshToken = googleUser.refreshToken;
        updateData.googleTokenExpiry = googleUser.tokenExpiry;
        // Update contacts scope based on granted scopes
        updateData.googleContactsScope = googleUser.scopes.includes('https://www.googleapis.com/auth/contacts.readonly');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });

      // Check if company is suspended
      if (user.company.markedForDeletion) {
        return res.redirect(`${frontendUrl}/login?error=company_suspended`);
      }

      // Generate JWT token for regular login
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
          isPersonal: true,
          autoArchivePeriod: 12
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
          isEmailVerified: googleUser.emailVerified || true,
          // Store Google tokens
          googleAccessToken: googleUser.accessToken,
          googleRefreshToken: googleUser.refreshToken,
          googleTokenExpiry: googleUser.tokenExpiry,
          googleContactsScope: googleUser.scopes.includes('https://www.googleapis.com/auth/contacts.readonly')
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
          isPersonal: true,
          autoArchivePeriod: 12
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
          isEmailVerified: googleUser.emailVerified || true,
          // Store Google tokens
          googleAccessToken: googleUser.accessToken,
          googleRefreshToken: googleUser.refreshToken,
          googleTokenExpiry: googleUser.tokenExpiry,
          googleContactsScope: googleUser.scopes.includes('https://www.googleapis.com/auth/contacts.readonly')
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

/**
 * Handle Google Sign-In for mobile apps.
 * Accepts idToken from Google Sign-In SDK, verifies it, and returns Tialz JWT.
 * POST /api/auth/google-id-token
 * Body: { idToken: "..." }
 */
const handleGoogleIdToken = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'idToken is required' });
    }

    const googleUser = await verifyIdToken(idToken);

    // Check if user already exists by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
      include: { company: true }
    });

    if (!user) {
      const result = await findSingleUserByEmail(googleUser.email);
      if (result.ambiguous) {
        return res.status(409).json({
          error: 'Multiple accounts use this email. Please sign in with email and password.',
          requiresEmailAuth: true
        });
      }
      user = result.user;
    }

    if (user) {
      // Only allow personal accounts to sign in via mobile Google
      if (!user.company.isPersonal) {
        return res.status(403).json({
          error: 'Google Sign-In is only available for personal accounts. Please sign in with your email and password.',
          requiresEmailAuth: true
        });
      }

      if (user.company.markedForDeletion) {
        return res.status(403).json({ error: 'Account suspended' });
      }

      // Update googleId if not set
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          authProvider: 'google'
        }
      });

      const token = jwt.sign(
        { userId: user.id, companyId: user.companyId, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userWithCompany = {
        ...user,
        companyName: user.company?.name,
        isPersonal: user.company?.isPersonal || false
      };
      delete userWithCompany.password;

      return res.json({
        token,
        user: userWithCompany
      });
    }

    // New user - create personal account (mobile Google is personal-only)
    const company = await prisma.company.create({
      data: {
        name: googleUser.name + "'s Personal",
        email: googleUser.email,
        passwordHash: null,
        googleId: googleUser.googleId,
        authProvider: 'google',
        isPersonal: true,
        autoArchivePeriod: 12
      }
    });

    const newUser = await prisma.user.create({
      data: {
        name: googleUser.name,
        email: googleUser.email,
        password: null,
        googleId: googleUser.googleId,
        authProvider: 'google',
        role: 'SYSDMIN',
        companyId: company.id,
        isEmailVerified: googleUser.emailVerified || true,
        googleAccessToken: googleUser.accessToken,
        googleRefreshToken: googleUser.refreshToken,
        googleTokenExpiry: googleUser.tokenExpiry,
        googleContactsScope: false
      },
      include: { company: true }
    });

    const token = jwt.sign(
      { userId: newUser.id, companyId: newUser.companyId, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userWithCompany = {
      ...newUser,
      companyName: newUser.company?.name,
      isPersonal: true
    };
    delete userWithCompany.password;

    return res.status(201).json({
      token,
      user: userWithCompany,
      newUser: true
    });
  } catch (error) {
    console.error('Google ID token auth error:', error);
    res.status(401).json({ error: 'Invalid or expired Google ID token' });
  }
};

module.exports = {
  initiateGoogleAuth,
  handleGoogleCallback,
  handleGoogleIdToken
};

