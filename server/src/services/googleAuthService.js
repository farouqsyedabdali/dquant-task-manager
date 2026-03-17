const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get Google OAuth URL (basic scopes only)
const getAuthUrl = () => {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    prompt: 'consent'
  });
};

// Get Google OAuth URL with contacts scope (incremental authorization)
const getContactsAuthUrl = () => {
  const state = Buffer.from(JSON.stringify({ isIncrementalAuth: true })).toString('base64');

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/contacts.readonly'
    ],
    prompt: 'consent',
    include_granted_scopes: true, // This enables incremental authorization
    state // Pass incremental auth flag
  });
};

// Verify Google ID token directly (for mobile apps - no code exchange)
// The mobile app sends the idToken from Google Sign-In SDK; we verify it and return user info
const verifyIdToken = async (idToken) => {
  try {
    // Support multiple client IDs (web, iOS, Android) - mobile may use platform-specific client IDs
    const audiences = [process.env.GOOGLE_CLIENT_ID]
      .concat(process.env.GOOGLE_IOS_CLIENT_ID ? [process.env.GOOGLE_IOS_CLIENT_ID] : [])
      .concat(process.env.GOOGLE_ANDROID_CLIENT_ID ? [process.env.GOOGLE_ANDROID_CLIENT_ID] : [])
      .filter(Boolean);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: audiences
    });

    const payload = ticket.getPayload();

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
      // Mobile flow has no access/refresh tokens - those come from web OAuth redirect only
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      scopes: []
    };
  } catch (error) {
    console.error('Google ID token verification error:', error);
    throw new Error('Invalid or expired Google ID token');
  }
};

// Verify Google OAuth authorization code (for web - exchange code for tokens)
const verifyToken = async (code) => {
  try {
    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
      // Include token information for storage
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes: tokens.scope ? tokens.scope.split(' ') : []
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Failed to verify Google token');
  }
};

module.exports = {
  getAuthUrl,
  getContactsAuthUrl,
  verifyToken,
  verifyIdToken
};


