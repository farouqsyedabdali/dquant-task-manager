const { google } = require('googleapis');
const prisma = require('../lib/prisma');
const secureLogger = require('../middleware/secureLogger');
const { encryptToken, decryptToken } = require('../utils/tokenCrypto');
const {
  MIN_AUTO_CREATE_CONFIDENCE,
  headerValue,
  stripQuotedText,
  deterministicSkip,
  classifyAndExtractTasks,
  createTasksFromEmail
} = require('./emailAgentShared');

const PROVIDER = 'GOOGLE_GMAIL';
const MAX_MESSAGES_PER_SYNC = Number(process.env.GMAIL_AGENT_MAX_MESSAGES || 10);
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function decodeBase64Url(data) {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function getMessageBody(payload) {
  if (!payload) return '';
  if (payload.body?.data && (payload.mimeType || '').startsWith('text/')) {
    return decodeBase64Url(payload.body.data);
  }

  const parts = payload.parts || [];
  const plain = parts.find((part) => part.mimeType === 'text/plain');
  if (plain?.body?.data) return decodeBase64Url(plain.body.data);

  const html = parts.find((part) => part.mimeType === 'text/html');
  if (html?.body?.data) {
    return decodeBase64Url(html.body.data)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(div|p|li|tr|h[1-6])[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  for (const part of parts) {
    const nested = getMessageBody(part);
    if (nested) return nested;
  }

  return '';
}

async function upsertGmailAccountFromOAuth({ userId, googleUser }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
  if (!user) throw new Error('User not found for Gmail connection');
  if (!googleUser.scopes?.includes(GMAIL_SCOPE)) {
    throw new Error('Gmail read permission was not granted');
  }

  const encryptedAccessToken = encryptToken(googleUser.accessToken);
  const encryptedRefreshToken = googleUser.refreshToken
    ? encryptToken(googleUser.refreshToken)
    : undefined;

  const existing = await prisma.connectedAccount.findFirst({
    where: { provider: PROVIDER, userId, email: googleUser.email }
  });

  const refreshForUpsert = encryptedRefreshToken || existing?.encryptedRefreshToken || null;

  return prisma.connectedAccount.upsert({
    where: {
      provider_userId_email: {
        provider: PROVIDER,
        userId,
        email: googleUser.email
      }
    },
    create: {
      provider: PROVIDER,
      email: googleUser.email,
      encryptedAccessToken,
      encryptedRefreshToken: refreshForUpsert,
      tokenExpiry: googleUser.tokenExpiry,
      scopes: googleUser.scopes || [],
      status: 'ACTIVE',
      syncEnabled: true,
      userId,
      companyId: user.companyId
    },
    update: {
      encryptedAccessToken,
      encryptedRefreshToken: refreshForUpsert,
      tokenExpiry: googleUser.tokenExpiry,
      scopes: googleUser.scopes || [],
      status: 'ACTIVE',
      syncEnabled: true,
      lastError: null
    }
  });
}

async function buildGmailClient(account) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: decryptToken(account.encryptedAccessToken),
    refresh_token: decryptToken(account.encryptedRefreshToken),
    expiry_date: account.tokenExpiry?.getTime()
  });

  if (!account.tokenExpiry || account.tokenExpiry <= new Date(Date.now() + 60_000)) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        encryptedAccessToken: encryptToken(credentials.access_token),
        encryptedRefreshToken: credentials.refresh_token
          ? encryptToken(credentials.refresh_token)
          : account.encryptedRefreshToken,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : account.tokenExpiry,
        status: 'ACTIVE',
        lastError: null
      }
    });
    oauth2Client.setCredentials(credentials);
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

async function processGmailMessage(account, messageId) {
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

  const gmail = await buildGmailClient(account);
  const { data: message } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });

  const headers = message.payload?.headers || [];
  const subject = headerValue(headers, 'Subject') || '(No subject)';
  const from = headerValue(headers, 'From');
  const senderEmail = (from.match(/<([^>]+)>/)?.[1] || from).trim().toLowerCase();
  const senderName = from.replace(/<[^>]+>/, '').replace(/"/g, '').trim();
  const receivedAt = message.internalDate ? new Date(Number(message.internalDate)) : null;
  const cleanBody = stripQuotedText(getMessageBody(message.payload) || message.snippet || '');

  let ingestion = await prisma.emailIngestion.create({
    data: {
      provider: PROVIDER,
      providerMessageId: message.id,
      threadId: message.threadId,
      senderEmail,
      senderName,
      subject,
      snippet: message.snippet || cleanBody.slice(0, 200),
      receivedAt,
      connectedAccountId: account.id,
      userId: account.userId,
      companyId: account.companyId,
      rawMetadata: {
        labelIds: message.labelIds || [],
        from,
        to: headerValue(headers, 'To')
      }
    }
  });

  const skipReason = deterministicSkip({ headers, senderEmail, subject });
  if (skipReason) {
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
    const classification = await classifyAndExtractTasks({ subject, cleanBody, senderEmail });
    if (
      !classification.isActionable ||
      classification.confidence < MIN_AUTO_CREATE_CONFIDENCE ||
      classification.tasks.length === 0
    ) {
      return prisma.emailIngestion.update({
        where: { id: ingestion.id },
        data: {
          status: 'SKIPPED',
          classification: classification.isActionable ? 'LOW_CONFIDENCE_ACTIONABLE' : 'NON_ACTIONABLE',
          confidence: classification.confidence,
          reason: classification.reason,
          extractedActions: classification
        }
      });
    }

    const created = await createTasksFromEmail({
      account,
      ingestion,
      classification,
      cleanBody,
      auditAgentName: 'Gmail agent',
      auditSource: 'gmail_agent'
    });
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
    secureLogger.error('Gmail agent failed to process message', {
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

async function syncGmailAccount(account) {
  const gmail = await buildGmailClient(account);
  const { data } = await gmail.users.messages.list({
    userId: 'me',
    maxResults: MAX_MESSAGES_PER_SYNC,
    q: 'newer_than:7d -category:promotions -category:social'
  });

  const messages = data.messages || [];
  let processed = 0;
  for (const message of messages) {
    await processGmailMessage(account, message.id);
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

async function syncAllGmailAccounts() {
  const accounts = await prisma.connectedAccount.findMany({
    where: {
      provider: PROVIDER,
      status: 'ACTIVE',
      syncEnabled: true,
      encryptedRefreshToken: { not: null }
    },
    orderBy: { lastSyncedAt: 'asc' },
    take: Number(process.env.GMAIL_AGENT_ACCOUNTS_PER_TICK || 10)
  });

  for (const account of accounts) {
    try {
      await syncGmailAccount(account);
    } catch (error) {
      secureLogger.error('Gmail account sync failed', { accountId: account.id, message: error.message });
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

async function getGmailAgentStatus(userId) {
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
  GMAIL_SCOPE,
  upsertGmailAccountFromOAuth,
  getGmailAgentStatus,
  syncAllGmailAccounts,
  syncGmailAccount
};
