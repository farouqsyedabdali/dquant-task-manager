const { parseOAuthState } = require('../services/googleAuthService');
const { exchangeAuthorizationCode, fetchGraphMe } = require('../services/microsoftAuthService');
const { upsertOutlookAccountFromOAuth } = require('../services/outlookAgentService');

const getFrontendUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];

const handleMicrosoftCallback = async (req, res) => {
  const frontendUrl = getFrontendUrl();

  try {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      console.error('Microsoft OAuth error:', error, errorDescription);
      return res.redirect(`${frontendUrl}/settings?category=integrations&outlook=error`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/settings?category=integrations&outlook=cancelled`);
    }

    let outlookAgentUserId = null;
    if (state) {
      try {
        const decoded = parseOAuthState(state);
        if (decoded.isOutlookAgentAuth) {
          outlookAgentUserId = decoded.userId ? Number(decoded.userId) : null;
        }
      } catch (e) {
        return res.redirect(`${frontendUrl}/settings?category=integrations&outlook=invalid_state`);
      }
    }

    if (!outlookAgentUserId) {
      return res.redirect(`${frontendUrl}/settings?category=integrations&outlook=invalid_state`);
    }

    const tokenPayload = await exchangeAuthorizationCode(code);
    const profile = await fetchGraphMe(tokenPayload.access_token);

    await upsertOutlookAccountFromOAuth({
      userId: outlookAgentUserId,
      tokenPayload,
      profile
    });

    return res.redirect(`${frontendUrl}/settings?category=integrations&outlook=connected`);
  } catch (err) {
    console.error('Microsoft callback error:', err);
    return res.redirect(`${frontendUrl}/settings?category=integrations&outlook=error`);
  }
};

module.exports = {
  handleMicrosoftCallback
};
