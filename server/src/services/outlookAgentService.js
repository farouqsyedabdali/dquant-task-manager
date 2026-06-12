const axios = require('axios');
const prisma = require('../lib/prisma');
const secureLogger = require('../middleware/secureLogger');
const { encryptToken, decryptToken } = require('../utils/tokenCrypto');
const { refreshAccessToken, OUTLOOK_AGENT_SCOPES } = require('./microsoftAuthService');
const {
  MIN_AUTO_CREATE_CONFIDENCE,
  stripQuotedText,
  deterministicSkip,
  isSenderAlwaysSkipped,
  isSenderAlwaysAllowed,
  classifyAndExtractTasks,
  createTasksFromEmail
} = require('./emailAgentShared');
const { scheduleGoogleCalendarSyncForTask } = require('./gmailAgentService');

const PROVIDER = 'MICROSOFT_OUTLOOK';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const MAX_MESSAGES_PER_SYNC = Number(process.env.GMAIL_AGENT_MAX_MESSAGES || process.env.OUTLOOK_AGENT_MAX_MESSAGES || 10);

function parseScopesFromTokenPayload(tokenPayload) {
  const raw = tokenPayload.scope || tokenPayload.scopes;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') return raw.split(' ').map((s) => s.trim()).filter(Boolean);
  return OUTLOOK_AGENT_SCOPES.split(/\s+/).filter(Boolean);
}

function scopeIncludesMailRead(scopes) {
  const normalized = scopes.map((s) => s.toLowerCase());
  return normalized.some((s) => s === 'mail.read' || s.includes('mail.read'));
}

function graphMessageToHeaders(message) {
  const list = message.internetMessageHeaders || [];
  return list.map((h) => ({ name: h.name, value: h.value }));
}

function getBodyFromGraphMessage(message) {
  const body = message.body;
  if (!body?.content) {
    return String(message.bodyPreview || '').trim();
  }
  const contentType = String(body.contentType || '').toLowerCase();
  if (contentType === 'text') {
    return String(body.content || '').trim();
  }
  return String(body.content || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(div|p|li|tr|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function upsertOutlookAccountFromOAuth({ userId, tokenPayload, profile }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
  if (!user) throw new Error('User not found for Outlook connection');

  const scopes = parseScopesFromTokenPayload(tokenPayload);
  if (!scopeIncludesMailRead(scopes)) {
    throw new Error('Mail read permission was not granted');
  }

  const email = String(profile.mail || profile.userPrincipalName || '').trim().toLowerCase();
  if (!email) throw new Error('Could not resolve Microsoft account email');

  if (!tokenPayload.refresh_token) {
    throw new Error('Microsoft did not return a refresh token; try reconnecting with consent');
  }

  const encryptedAccessToken = encryptToken(tokenPayload.access_token);
  const encryptedRefreshToken = encryptToken(tokenPayload.refresh_token);
  const expirySeconds = Number(tokenPayload.expires_in || 3600);
  const tokenExpiry = new Date(Date.now() + expirySeconds * 1000);

  return prisma.connectedAccount.upsert({
    where: {
      provider_userId_email: {
        provider: PROVIDER,
        userId,
        email
      }
    },
    create: {
      provider: PROVIDER,
      email,
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiry,
      scopes,
      status: 'ACTIVE',
      syncEnabled: true,
      userId,
      companyId: user.companyId
    },
    update: {
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiry,
      scopes,
      status: 'ACTIVE',
      syncEnabled: true,
      lastError: null
    }
  });
}

async function ensureFreshAccessToken(account) {
  if (account.tokenExpiry && account.tokenExpiry > new Date(Date.now() + 60_000)) {
    return account;
  }

  const refresh = decryptToken(account.encryptedRefreshToken);
  if (!refresh) throw new Error('Outlook connection is missing a refresh token');

  const tokenPayload = await refreshAccessToken(refresh);

  const encryptedAccessToken = encryptToken(tokenPayload.access_token);
  const expirySeconds = Number(tokenPayload.expires_in || 3600);
  const tokenExpiry = new Date(Date.now() + expirySeconds * 1000);
  const scopes = parseScopesFromTokenPayload(tokenPayload);

  const data = {
    encryptedAccessToken,
    tokenExpiry,
    scopes: scopes.length ? scopes : account.scopes,
    status: 'ACTIVE',
    lastError: null
  };
  if (tokenPayload.refresh_token) {
    data.encryptedRefreshToken = encryptToken(tokenPayload.refresh_token);
  }

  return prisma.connectedAccount.update({
    where: { id: account.id },
    data
  });
}

async function graphGet(account, path) {
  const fresh = await ensureFreshAccessToken(account);
  const accessToken = decryptToken(fresh.encryptedAccessToken);
  const url = path.startsWith('http') ? path : `${GRAPH_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return { data, account: fresh };
}

async function processOutlookMessage(account, messageId) {
  const existing = await prisma.emailIngestion.findUnique({
    where: {
      provider_providerMessageId_userId: {
        provider: PROVIDER,
        providerMessageId: messageId,
        userId: account.userId
      }
    }
  });
  if (existing && existing.status !== 'ERROR') return existing;
  if (existing?.status === 'ERROR') {
    await prisma.emailIngestion.delete({ where: { id: existing.id } });
  }

  const select =
    'id,conversationId,subject,body,bodyPreview,receivedDateTime,from,toRecipients,internetMessageHeaders';
  const { data: message, account: refreshed } = await graphGet(
    account,
    `/me/messages/${encodeURIComponent(messageId)}?$select=${select}`
  );
  account = refreshed;

  const headers = graphMessageToHeaders(message);
  const subject = message.subject || '(No subject)';
  const fromAddr = message.from?.emailAddress;
  const senderEmail = String(fromAddr?.address || '').trim().toLowerCase();
  const senderName = String(fromAddr?.name || '').trim();
  const receivedAt = message.receivedDateTime ? new Date(message.receivedDateTime) : null;
  const rawBody = getBodyFromGraphMessage(message);
  const cleanBody = stripQuotedText(rawBody || message.bodyPreview || '');

  let ingestion = await prisma.emailIngestion.create({
    data: {
      provider: PROVIDER,
      providerMessageId: message.id,
      threadId: message.conversationId || null,
      senderEmail,
      senderName,
      subject,
      snippet: String(message.bodyPreview || cleanBody).slice(0, 200),
      receivedAt,
      connectedAccountId: account.id,
      userId: account.userId,
      companyId: account.companyId,
      rawMetadata: {
        from: message.from,
        to: message.toRecipients
      }
    }
  });

  const alwaysSkipped = await isSenderAlwaysSkipped({
    userId: account.userId,
    provider: PROVIDER,
    senderEmail
  });
  if (alwaysSkipped) {
    return prisma.emailIngestion.update({
      where: { id: ingestion.id },
      data: {
        status: 'SKIPPED',
        classification: 'NON_ACTIONABLE',
        confidence: 1,
        reason: 'always_skip_sender'
      }
    });
  }

  const alwaysAllowed = await isSenderAlwaysAllowed({
    userId: account.userId,
    provider: PROVIDER,
    senderEmail
  });

  const skipReason = deterministicSkip({ headers, senderEmail, subject });
  if (skipReason && !alwaysAllowed) {
    return prisma.emailIngestion.update({
      where: { id: ingestion.id },
      data: {
        status: 'SKIPPED',
        classification: 'NON_ACTIONABLE',
        confidence: 1,
        reason: skipReason
      }
    });
  }

  try {
    const classification = await classifyAndExtractTasks({ subject, cleanBody, senderEmail, account });
    
    const shouldBypassConfidence = alwaysAllowed && classification.actions.length > 0;
    
    if (
      !shouldBypassConfidence && (
        !classification.isActionable ||
        classification.confidence < MIN_AUTO_CREATE_CONFIDENCE ||
        classification.actions.length === 0
      )
    ) {
      const status = classification.isActionable && classification.actions.length > 0 ? 'NEEDS_REVIEW' : 'SKIPPED';
      return prisma.emailIngestion.update({
        where: { id: ingestion.id },
        data: {
          status,
          classification: classification.isActionable ? 'LOW_CONFIDENCE_ACTIONABLE' : 'NON_ACTIONABLE',
          confidence: classification.confidence,
          reason: alwaysAllowed && classification.actions.length === 0 ? 'always_allow_no_actions' : classification.reason,
          extractedActions: classification
        }
      });
    }

    const created = await createTasksFromEmail({
      account,
      ingestion,
      classification,
      cleanBody,
      auditAgentName: 'Outlook agent',
      auditSource: 'outlook_agent'
    });
    for (const tid of created.createdTaskIds) {
      scheduleGoogleCalendarSyncForTask(tid);
    }
    ingestion = await prisma.emailIngestion.update({
      where: { id: ingestion.id },
      data: {
        status: created.createdTaskIds.length > 0 ? 'TASK_CREATED' : 'SKIPPED',
        classification: 'ACTIONABLE',
        confidence: classification.confidence,
        reason: classification.reason,
        extractedActions: created.actions,
        createdTaskIds: created.createdTaskIds
      }
    });
    return ingestion;
  } catch (error) {
    secureLogger.error('Outlook agent failed to process message', {
      accountId: account.id,
      messageId,
      message: error.message
    });
    return prisma.emailIngestion.update({
      where: { id: ingestion.id },
      data: { status: 'ERROR', error: error.message }
    });
  }
}

async function syncOutlookAccount(account) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const query = new URLSearchParams({
    $top: String(MAX_MESSAGES_PER_SYNC),
    $orderby: 'receivedDateTime desc',
    $filter: `receivedDateTime ge ${sevenDaysAgo}`
  });
  const path = `/me/messages?${query.toString()}`;

  const { data, account: refreshed } = await graphGet(account, path);
  account = refreshed;

  const messages = data.value || [];
  let processed = 0;
  for (const message of messages) {
    await processOutlookMessage(account, message.id);
    processed += 1;
  }

  await prisma.connectedAccount.update({
    where: { id: account.id },
    data: {
      lastSyncedAt: new Date(),
      lastError: null,
      status: 'ACTIVE'
    }
  });

  return { processed };
}

async function syncAllOutlookAccounts() {
  const accounts = await prisma.connectedAccount.findMany({
    where: {
      provider: PROVIDER,
      status: 'ACTIVE',
      syncEnabled: true,
      encryptedRefreshToken: { not: null }
    },
    orderBy: { lastSyncedAt: 'asc' },
    take: Number(process.env.GMAIL_AGENT_ACCOUNTS_PER_TICK || process.env.OUTLOOK_AGENT_ACCOUNTS_PER_TICK || 10)
  });

  for (const account of accounts) {
    try {
      await syncOutlookAccount(account);
    } catch (error) {
      secureLogger.error('Outlook account sync failed', { accountId: account.id, message: error.message });
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: {
          status: 'ERROR',
          lastError: error.message,
          lastSyncedAt: new Date()
        }
      });
    }
  }

  return { accountsProcessed: accounts.length };
}

async function getOutlookAgentStatus(userId) {
  const account = await prisma.connectedAccount.findFirst({
    where: { userId, provider: PROVIDER },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      email: true,
      status: true,
      syncEnabled: true,
      lastSyncedAt: true,
      lastError: true,
      scopes: true,
      createdAt: true
    }
  });

  const recent = account
    ? await prisma.emailIngestion.findMany({
        where: { connectedAccountId: account.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          subject: true,
          senderEmail: true,
          status: true,
          classification: true,
          confidence: true,
          reason: true,
          createdTaskIds: true,
          receivedAt: true,
          createdAt: true
        }
      })
    : [];

  return { account, recent };
}

module.exports = {
  PROVIDER,
  upsertOutlookAccountFromOAuth,
  getOutlookAgentStatus,
  syncAllOutlookAccounts,
  syncOutlookAccount
};
