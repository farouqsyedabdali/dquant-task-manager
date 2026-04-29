const axios = require('axios');
const { google } = require('googleapis');
const prisma = require('../lib/prisma');
const secureLogger = require('../middleware/secureLogger');
const { parseLocalDate } = require('../utils/dateUtils');
const { encryptToken, decryptToken } = require('../utils/tokenCrypto');

const PROVIDER = 'GOOGLE_GMAIL';
const MAX_MESSAGES_PER_SYNC = Number(process.env.GMAIL_AGENT_MAX_MESSAGES || 10);
const MIN_AUTO_CREATE_CONFIDENCE = Number(process.env.GMAIL_AGENT_MIN_CONFIDENCE || 0.72);
const DEFAULT_DUE_DATE_DAYS = 7;
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getDefaultDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + DEFAULT_DUE_DATE_DAYS);
  dueDate.setHours(23, 59, 0, 0);
  return dueDate;
}

function resolveDueDate(input) {
  if (!input || typeof input !== 'string') return getDefaultDueDate();
  const parsed = parseLocalDate(input.trim());
  if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) return getDefaultDueDate();
  return parsed;
}

function normalizePriority(priority) {
  const allowed = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
  const normalized = String(priority || 'MEDIUM').trim().toUpperCase();
  return allowed.has(normalized) ? normalized : 'MEDIUM';
}

function parseJsonObject(content) {
  const cleaned = String(content || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

function headerValue(headers, name) {
  const header = headers.find((item) => item.name?.toLowerCase() === name.toLowerCase());
  return header?.value || '';
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

function stripQuotedText(body) {
  if (!body) return '';
  let text = body;
  text = text.split(/\nOn .+?wrote:\s*$/im)[0];
  text = text.split(/\n-{2,}\s*Original Message\s*-{2,}/i)[0];
  text = text.split(/\nBegin forwarded message:/i)[0];
  text = text.split(/\nFrom:\s+.+/i)[0] || text;
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join('\n')
    .trim()
    .slice(0, 12000);
}

function deterministicSkip({ headers, senderEmail, subject }) {
  const lowerSender = String(senderEmail || '').toLowerCase();
  const lowerSubject = String(subject || '').toLowerCase();
  const listUnsubscribe = headerValue(headers, 'List-Unsubscribe');
  const autoSubmitted = headerValue(headers, 'Auto-Submitted');
  const precedence = headerValue(headers, 'Precedence');

  if (listUnsubscribe) return 'newsletter_or_marketing';
  if (autoSubmitted && autoSubmitted.toLowerCase() !== 'no') return 'automated_email';
  if (['bulk', 'junk', 'list'].includes(precedence.toLowerCase())) return 'bulk_email';
  if (/\b(no-?reply|donotreply|notifications?|newsletter|marketing|promo)\b/i.test(lowerSender)) return 'automated_sender';
  if (/\b(unsubscribe|newsletter|digest|receipt|invoice paid|promotion|sale|deal)\b/i.test(lowerSubject)) return 'low_value_category';

  return null;
}

async function classifyAndExtractTasks({ subject, cleanBody, senderEmail }) {
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      isActionable: false,
      confidence: 0,
      importance: 'LOW',
      reason: 'OPENROUTER_API_KEY is not configured',
      tasks: []
    };
  }

  const prompt = `
You are Tialz's email task agent. Decide if this email should automatically become tasks.

Return ONLY valid JSON with this shape:
{
  "isActionable": boolean,
  "confidence": number,
  "importance": "LOW"|"MEDIUM"|"HIGH"|"URGENT",
  "reason": "short explanation",
  "tasks": [
    {
      "title": "short task title",
      "description": "short helpful context",
      "priority": "LOW"|"MEDIUM"|"HIGH"|"URGENT",
      "dueDate": "YYYY-MM-DD or natural date string or null"
    }
  ]
}

Create tasks only for emails that represent real work: direct requests, commitments, follow-ups, approvals, meetings, deliverables, issues, or deadlines.
Ignore newsletters, marketing, automated digests, receipts, FYI-only messages, social notifications, and spam.
If uncertain, set isActionable=false or confidence below 0.72.
Use at most 5 tasks.
`.trim();

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.EMAIL_AGENT_MODEL || process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `From: ${senderEmail}\nSubject: ${subject}\n\n${cleanBody}` }
        ],
        temperature: 0.1,
        max_tokens: 1200
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0],
          'X-Title': process.env.SITE_NAME || 'Tialz Task Manager'
        }
      }
    );

    const parsed = parseJsonObject(response.data?.choices?.[0]?.message?.content || '') || {};
    return {
      isActionable: Boolean(parsed.isActionable),
      confidence: Number(parsed.confidence || 0),
      importance: normalizePriority(parsed.importance),
      reason: String(parsed.reason || '').slice(0, 500),
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 5) : []
    };
  } catch (error) {
    const status = error.response?.status;
    const details = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    throw new Error(`Email AI classification failed${status ? ` (${status})` : ''}: ${details}`);
  }
}

async function upsertGmailAccountFromOAuth({ userId, googleUser }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
  if (!user) throw new Error('User not found for Gmail connection');
  if (!googleUser.scopes?.includes(GMAIL_SCOPE)) {
    throw new Error('Gmail read permission was not granted');
  }

  const existing = await prisma.connectedAccount.findFirst({
    where: { provider: PROVIDER, userId, email: googleUser.email }
  });

  const encryptedAccessToken = encryptToken(googleUser.accessToken);
  const encryptedRefreshToken = googleUser.refreshToken
    ? encryptToken(googleUser.refreshToken)
    : existing?.encryptedRefreshToken || null;

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
      encryptedRefreshToken,
      tokenExpiry: googleUser.tokenExpiry,
      scopes: googleUser.scopes || [],
      status: 'ACTIVE',
      syncEnabled: true,
      userId,
      companyId: user.companyId
    },
    update: {
      encryptedAccessToken,
      encryptedRefreshToken,
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
        encryptedRefreshToken: credentials.refresh_token ? encryptToken(credentials.refresh_token) : account.encryptedRefreshToken,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : account.tokenExpiry,
        status: 'ACTIVE',
        lastError: null
      }
    });
    oauth2Client.setCredentials(credentials);
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

async function createTasksFromEmail({ account, ingestion, classification, cleanBody }) {
  const createdTaskIds = [];
  const actions = [];

  for (const item of classification.tasks || []) {
    const title = String(item.title || '').trim().slice(0, 200);
    if (!title) continue;

    const task = await prisma.task.create({
      data: {
        title,
        description: [
          String(item.description || '').trim(),
          ingestion.subject ? `Source email subject: ${ingestion.subject}` : null,
          cleanBody ? `Source email excerpt: ${cleanBody.slice(0, 700)}` : null
        ].filter(Boolean).join('\n\n').slice(0, 1200),
        priority: normalizePriority(item.priority || classification.importance),
        dueDate: resolveDueDate(item.dueDate),
        status: 'TODO',
        assignerId: account.userId,
        assigneeId: account.userId,
        companyId: account.companyId
      }
    });

    createdTaskIds.push(task.id);
    actions.push({ actionType: 'create_task', taskId: task.id, title: task.title });

    await prisma.auditLog.create({
      data: {
        action: 'TASK_CREATED',
        entityType: 'Task',
        entityId: task.id,
        description: `Gmail agent created task "${task.title}"`,
        metadata: {
          source: 'gmail_agent',
          emailIngestionId: ingestion.id,
          messageId: ingestion.providerMessageId,
          senderEmail: ingestion.senderEmail
        },
        userId: account.userId,
        companyId: account.companyId
      }
    });
  }

  return { createdTaskIds, actions };
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
    if (!classification.isActionable || classification.confidence < MIN_AUTO_CREATE_CONFIDENCE || classification.tasks.length === 0) {
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

    const created = await createTasksFromEmail({ account, ingestion, classification, cleanBody });
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
