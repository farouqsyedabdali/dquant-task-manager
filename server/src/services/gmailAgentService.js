const { google } = require('googleapis');
const prisma = require('../lib/prisma');
const secureLogger = require('../middleware/secureLogger');
const { encryptToken, decryptToken } = require('../utils/tokenCrypto');
const {
  MIN_AUTO_CREATE_CONFIDENCE,
  headerValue,
  stripQuotedText,
  deterministicSkip,
  isSenderAlwaysSkipped,
  isSenderAlwaysAllowed,
  classifyAndExtractTasks,
  createTasksFromEmail
} = require('./emailAgentShared');

const PROVIDER = 'GOOGLE_GMAIL';
const MAX_MESSAGES_PER_SYNC = Number(process.env.GMAIL_AGENT_MAX_MESSAGES || 10);
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const GOOGLE_CALENDAR_READONLY_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const GOOGLE_CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

/** Can read primary calendar in the app (readonly or events scope). */
function accountHasGoogleCalendarReadScope(scopes) {
  if (!Array.isArray(scopes)) return false;
  return scopes.includes(GOOGLE_CALENDAR_READONLY_SCOPE) || scopes.includes(GOOGLE_CALENDAR_EVENTS_SCOPE);
}

/** Can create/update task events in Google Calendar. */
function accountHasGoogleCalendarWriteScope(scopes) {
  return Array.isArray(scopes) && scopes.includes(GOOGLE_CALENDAR_EVENTS_SCOPE);
}

/** @deprecated use accountHasGoogleCalendarReadScope */
function accountHasGoogleCalendarScope(scopes) {
  return accountHasGoogleCalendarReadScope(scopes);
}

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

async function authorizeGoogleOAuthClient(account) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: account.encryptedAccessToken ? decryptToken(account.encryptedAccessToken) : undefined,
    refresh_token: account.encryptedRefreshToken ? decryptToken(account.encryptedRefreshToken) : undefined,
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

  return oauth2Client;
}

async function buildGmailClient(account) {
  const auth = await authorizeGoogleOAuthClient(account);
  return google.gmail({ version: 'v1', auth });
}

function normalizeGoogleCalendarEvent(ev) {
  const allDay = Boolean(ev.start?.date && !ev.start?.dateTime);
  const start = allDay ? ev.start.date : ev.start?.dateTime;
  const end = allDay ? ev.end?.date : ev.end?.dateTime;
  return {
    id: ev.id,
    title: ev.summary || '(No title)',
    start,
    end: end || start,
    allDay,
    htmlLink: ev.htmlLink || null
  };
}

/**
 * @param {number} userId
 * @param {{ timeMin: string, timeMax: string }} range ISO datetimes for Calendar API
 * @returns {Promise<{ events: object[], calendarScopeGranted: boolean }>}
 */
async function listGoogleCalendarEventsForUser(userId, { timeMin, timeMax }) {
  const account = await prisma.connectedAccount.findFirst({
    where: { userId, provider: PROVIDER, status: { not: 'REVOKED' } },
    orderBy: { updatedAt: 'desc' }
  });

  if (!account || !account.encryptedRefreshToken) {
    return {
      events: [],
      calendarScopeGranted: false,
      googleAccountConnected: false,
      googleCalendarWriteEnabled: false
    };
  }

  if (!accountHasGoogleCalendarReadScope(account.scopes)) {
    return {
      events: [],
      calendarScopeGranted: false,
      googleAccountConnected: true,
      googleCalendarWriteEnabled: accountHasGoogleCalendarWriteScope(account.scopes)
    };
  }

  const auth = await authorizeGoogleOAuthClient(account);
  const calendar = google.calendar({ version: 'v3', auth });
  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
    showDeleted: false
  });

  const events = (data.items || []).map(normalizeGoogleCalendarEvent);
  return {
    events,
    calendarScopeGranted: true,
    googleAccountConnected: true,
    googleCalendarWriteEnabled: accountHasGoogleCalendarWriteScope(account.scopes)
  };
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
      auditAgentName: 'Gmail agent',
      auditSource: 'gmail_agent'
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

  return {
    account,
    recent,
    calendarScopeGranted: account ? accountHasGoogleCalendarReadScope(account.scopes) : false,
    googleCalendarWriteEnabled: account ? accountHasGoogleCalendarWriteScope(account.scopes) : false
  };
}

async function ensureTialzGoogleCalendar(accountRow) {
  if (accountRow.tialzGoogleCalendarId) return accountRow.tialzGoogleCalendarId;

  const auth = await authorizeGoogleOAuthClient(accountRow);
  const calendar = google.calendar({ version: 'v3', auth });
  const { data } = await calendar.calendars.insert({
    requestBody: {
      summary: 'Tialz',
      description: 'Tasks synced from Tialz. Toggle this calendar in Google Calendar to show or hide them.',
      timeZone: 'UTC'
    }
  });
  const calendarId = data.id;
  await prisma.connectedAccount.update({
    where: { id: accountRow.id },
    data: { tialzGoogleCalendarId: calendarId }
  });
  return calendarId;
}

async function findGoogleConnectedAccountForUser(userId) {
  return prisma.connectedAccount.findFirst({
    where: {
      userId,
      provider: PROVIDER,
      status: { not: 'REVOKED' },
      encryptedRefreshToken: { not: null }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Remove event from Google; optionally clear task sync fields in DB (when clearTaskFields true).
 */
async function deleteGoogleCalendarEventForTask(task, { clearTaskFields = true } = {}) {
  if (!task.googleCalendarEventId && !task.googleCalendarSyncedUserId) {
    return;
  }
  if (!task.googleCalendarEventId || !task.googleCalendarSyncedUserId) {
    if (clearTaskFields && task.id) {
      await prisma.task.update({
        where: { id: task.id },
        data: { googleCalendarEventId: null, googleCalendarSyncedUserId: null }
      });
    }
    return;
  }

  const account = await findGoogleConnectedAccountForUser(task.googleCalendarSyncedUserId);
  if (!account?.tialzGoogleCalendarId || !accountHasGoogleCalendarWriteScope(account.scopes)) {
    if (clearTaskFields && task.id) {
      await prisma.task.update({
        where: { id: task.id },
        data: { googleCalendarEventId: null, googleCalendarSyncedUserId: null }
      });
    }
    return;
  }

  try {
    const auth = await authorizeGoogleOAuthClient(account);
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: account.tialzGoogleCalendarId,
      eventId: task.googleCalendarEventId
    });
  } catch (err) {
    secureLogger.error('Google Calendar event delete failed', {
      taskId: task.id,
      message: err.message
    });
  }

  if (clearTaskFields && task.id) {
    await prisma.task.update({
      where: { id: task.id },
      data: { googleCalendarEventId: null, googleCalendarSyncedUserId: null }
    });
  }
}

function pickCalendarSyncUserId(task) {
  if (task.assigneeId) return task.assigneeId;
  return task.assignerId;
}

function buildEventSummary(task) {
  const prefix = task.status === 'COMPLETED' ? '[Tialz] ✓ ' : '[Tialz] ';
  if (task.status === 'CANCELLED') return `${prefix}(cancelled) ${task.title}`;
  return `${prefix}${task.title}`;
}

async function syncTaskToGoogleCalendarById(taskId) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  const shouldNotSync =
    task.isDraft ||
    task.archived ||
    !task.dueDate ||
    task.status === 'CANCELLED';

  if (shouldNotSync) {
    await deleteGoogleCalendarEventForTask(task, { clearTaskFields: true });
    return;
  }

  const targetUserId = pickCalendarSyncUserId(task);
  const account = await findGoogleConnectedAccountForUser(targetUserId);

  if (!account || !accountHasGoogleCalendarWriteScope(account.scopes)) {
    await deleteGoogleCalendarEventForTask(task, { clearTaskFields: true });
    return;
  }

  if (
    task.googleCalendarSyncedUserId &&
    task.googleCalendarEventId &&
    task.googleCalendarSyncedUserId !== targetUserId
  ) {
    const prev = {
      id: task.id,
      googleCalendarEventId: task.googleCalendarEventId,
      googleCalendarSyncedUserId: task.googleCalendarSyncedUserId
    };
    await deleteGoogleCalendarEventForTask(prev, { clearTaskFields: true });
    const reloaded = await prisma.task.findUnique({ where: { id: taskId } });
    if (!reloaded) return;
    Object.assign(task, reloaded);
  }

  const calendarId = await ensureTialzGoogleCalendar(account);
  const reloadedAccount = await prisma.connectedAccount.findUnique({ where: { id: account.id } });
  const auth = await authorizeGoogleOAuthClient(reloadedAccount);
  const calendar = google.calendar({ version: 'v3', auth });

  const startAt = new Date(task.dueDate);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  const requestBody = {
    summary: buildEventSummary(task),
    description:
      (task.description || '').slice(0, 8000) +
      (task.description && task.description.length > 8000 ? '\n…' : ''),
    start: { dateTime: startAt.toISOString(), timeZone: 'UTC' },
    end: { dateTime: endAt.toISOString(), timeZone: 'UTC' },
    extendedProperties: { private: { tialzTaskId: String(task.id) } }
  };

  try {
    if (task.googleCalendarEventId) {
      await calendar.events.patch({
        calendarId,
        eventId: task.googleCalendarEventId,
        requestBody
      });
      await prisma.task.update({
        where: { id: task.id },
        data: { googleCalendarSyncedUserId: targetUserId }
      });
    } else {
      const { data } = await calendar.events.insert({
        calendarId,
        requestBody
      });
      await prisma.task.update({
        where: { id: task.id },
        data: {
          googleCalendarEventId: data.id,
          googleCalendarSyncedUserId: targetUserId
        }
      });
    }
  } catch (err) {
    secureLogger.error('Google Calendar task sync failed', { taskId: task.id, message: err.message });
  }
}

function scheduleGoogleCalendarSyncForTask(taskId) {
  setImmediate(() => {
    syncTaskToGoogleCalendarById(taskId).catch((err) => {
      secureLogger.error('Google Calendar task sync scheduler error', {
        taskId,
        message: err.message
      });
    });
  });
}

module.exports = {
  PROVIDER,
  GMAIL_SCOPE,
  GOOGLE_CALENDAR_READONLY_SCOPE,
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  accountHasGoogleCalendarScope,
  accountHasGoogleCalendarReadScope,
  accountHasGoogleCalendarWriteScope,
  upsertGmailAccountFromOAuth,
  getGmailAgentStatus,
  listGoogleCalendarEventsForUser,
  syncAllGmailAccounts,
  syncGmailAccount,
  syncTaskToGoogleCalendarById,
  scheduleGoogleCalendarSyncForTask,
  deleteGoogleCalendarEventForTask
};
