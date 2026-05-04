const axios = require('axios');
const { createOAuthState } = require('./googleAuthService');

const OUTLOOK_AGENT_SCOPES = [
  'offline_access',
  'openid',
  'profile',
  'email',
  'User.Read',
  'Mail.Read'
].join(' ');

function getAuthorityHost() {
  const tenant = process.env.MICROSOFT_AUTHORITY_TENANT || 'common';
  return `https://login.microsoftonline.com/${tenant}`;
}

function getOutlookAgentAuthUrl(userId) {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_REDIRECT_URI) {
    throw new Error('Microsoft OAuth is not configured');
  }

  const state = createOAuthState({ isOutlookAgentAuth: true, userId });

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    response_mode: 'query',
    scope: OUTLOOK_AGENT_SCOPES,
    prompt: 'consent',
    state
  });

  return `${getAuthorityHost()}/oauth2/v2.0/authorize?${params.toString()}`;
}

async function exchangeAuthorizationCode(code) {
  const tokenUrl = `${getAuthorityHost()}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    scope: OUTLOOK_AGENT_SCOPES
  });

  const { data } = await axios.post(tokenUrl, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return data;
}

async function refreshAccessToken(refreshToken) {
  const tokenUrl = `${getAuthorityHost()}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: OUTLOOK_AGENT_SCOPES
  });

  const { data } = await axios.post(tokenUrl, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return data;
}

async function fetchGraphMe(accessToken) {
  const { data } = await axios.get('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return data;
}

module.exports = {
  OUTLOOK_AGENT_SCOPES,
  getOutlookAgentAuthUrl,
  exchangeAuthorizationCode,
  refreshAccessToken,
  fetchGraphMe
};
