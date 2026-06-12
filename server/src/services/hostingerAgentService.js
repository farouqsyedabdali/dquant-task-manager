const { ImapFlow } = require('imapflow');
const prisma = require('../lib/prisma');
const secureLogger = require('../middleware/secureLogger');
const { encryptToken, decryptToken } = require('../utils/tokenCrypto');
const {
  MIN_AUTO_CREATE_CONFIDENCE,
  stripQuotedText,
  deterministicSkip,
  isSenderAlwaysSkipped,
  isSenderAlwaysAllowed,
  classifyAndExtractTasks,
  createTasksFromEmail,
} = require('./emailAgentShared');

const PROVIDER = 'HOSTINGER_IMAP';
const MAX_MESSAGES_PER_SYNC = Number(
  process.env.HOSTINGER_AGENT_MAX_MESSAGES || process.env.GMAIL_AGENT_MAX_MESSAGES || 10
);

// Hostinger IMAP server presets (Titan Email)
const IMAP_HOSTS = ['imap.hostinger.com', 'imap.titan.email'];
const IMAP_PORT = 993;

/**
 * Try connecting to known Hostinger IMAP hosts with the given credentials.
 * Returns the host that worked, or throws.
 */
async function validateImapCredentials(email, password) {
  let lastError = null;

  for (const host of IMAP_HOSTS) {
    const client = new ImapFlow({
      host,
      port: IMAP_PORT,
      secure: true,
      auth: { user: email, pass: password },
      logger: false,
      greetTimeout: 10000,
      socketTimeout: 10000,
    });

    try {
      await client.connect();
      await client.logout();
      return { host, port: IMAP_PORT };
    } catch (err) {
      lastError = err;
      try { await client.logout(); } catch (_) { /* ignore */ }
    }
  }

  throw new Error(
    lastError?.message || 'Could not connect to Hostinger email. Please check your email and password.'
  );
}

/**
 * Create or update a ConnectedAccount for Hostinger IMAP.
 * The password is stored in the encryptedAccessToken field (encrypted with AES-256-GCM).
 */
async function upsertHostingerAccount({ userId, email, password, host }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });
  if (!user) throw new Error('User not found for Hostinger connection');

  const encryptedPassword = encryptToken(password);

  return prisma.connectedAccount.upsert({
    where: {
      provider_userId_email: {
        provider: PROVIDER,
        userId,
        email: email.toLowerCase(),
      },
    },
    create: {
      provider: PROVIDER,
      email: email.toLowerCase(),
      encryptedAccessToken: encryptedPassword,
      encryptedRefreshToken: null,
      scopes: [host || IMAP_HOSTS[0]],
      status: 'ACTIVE',
      syncEnabled: true,
      userId,
      companyId: user.companyId,
    },
    update: {
      encryptedAccessToken: encryptedPassword,
      scopes: [host || IMAP_HOSTS[0]],
      status: 'ACTIVE',
      syncEnabled: true,
      lastError: null,
    },
  });
}

/**
 * Build an IMAP client for the given account, connected and ready.
 */
async function buildImapClient(account) {
  const password = decryptToken(account.encryptedAccessToken);
  const host = account.scopes?.[0] || IMAP_HOSTS[0];

  const client = new ImapFlow({
    host,
    port: IMAP_PORT,
    secure: true,
    auth: { user: account.email, pass: password },
    logger: false,
    greetTimeout: 15000,
    socketTimeout: 30000,
  });

  await client.connect();
  return client;
}

/**
 * Parse headers from raw header text into the {name, value} format used by emailAgentShared.
 */
function parseHeadersFromRaw(rawHeaders) {
  if (!rawHeaders) return [];
  const headers = [];
  const lines = rawHeaders.split(/\r?\n/);
  let current = null;

  for (const line of lines) {
    if (/^\s/.test(line) && current) {
      // continuation line
      current.value += ' ' + line.trim();
    } else {
      if (current) headers.push(current);
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        current = {
          name: line.slice(0, colonIdx).trim(),
          value: line.slice(colonIdx + 1).trim(),
        };
      } else {
        current = null;
      }
    }
  }
  if (current) headers.push(current);
  return headers;
}

/**
 * Process a single IMAP message through the shared email classification pipeline.
 */
async function processImapMessage(account, msgData) {
  const messageId = msgData.uid ? `imap-${account.id}-${msgData.uid}` : `imap-${account.id}-${Date.now()}`;

  // Check if already processed
  const existing = await prisma.emailIngestion.findUnique({
    where: {
      provider_providerMessageId_userId: {
        provider: PROVIDER,
        providerMessageId: messageId,
        userId: account.userId,
      },
    },
  });
  if (existing && existing.status !== 'ERROR') return existing;
  if (existing?.status === 'ERROR') {
    await prisma.emailIngestion.delete({ where: { id: existing.id } });
  }

  // Extract fields from the fetched message
  const envelope = msgData.envelope || {};
  const subject = envelope.subject || '(No subject)';
  const fromAddr = envelope.from?.[0] || {};
  const senderEmail = (fromAddr.address || '').trim().toLowerCase();
  const senderName = fromAddr.name || '';
  const receivedAt = envelope.date ? new Date(envelope.date) : null;

  // Parse body
  const bodyText = msgData.bodyText || '';
  const cleanBody = stripQuotedText(bodyText);

  // Parse headers
  const headers = parseHeadersFromRaw(msgData.rawHeaders || '');

  // Create ingestion record
  let ingestion = await prisma.emailIngestion.create({
    data: {
      provider: PROVIDER,
      providerMessageId: messageId,
      threadId: null,
      senderEmail,
      senderName,
      subject,
      snippet: (bodyText || '').slice(0, 200),
      receivedAt,
      connectedAccountId: account.id,
      userId: account.userId,
      companyId: account.companyId,
      rawMetadata: {
        from: fromAddr,
        to: envelope.to || [],
      },
    },
  });

  // Check always-skip sender
  const alwaysSkipped = await isSenderAlwaysSkipped({
    userId: account.userId,
    provider: PROVIDER,
    senderEmail,
  });
  if (alwaysSkipped) {
    return prisma.emailIngestion.update({
      where: { id: ingestion.id },
      data: {
        status: 'SKIPPED',
        classification: 'NON_ACTIONABLE',
        confidence: 1,
        reason: 'always_skip_sender',
      },
    });
  }

  const alwaysAllowed = await isSenderAlwaysAllowed({
    userId: account.userId,
    provider: PROVIDER,
    senderEmail
  });

  // Deterministic skip (newsletter, bulk, etc.)
  const skipReason = deterministicSkip({ headers, senderEmail, subject });
  if (skipReason && !alwaysAllowed) {
    return prisma.emailIngestion.update({
      where: { id: ingestion.id },
      data: {
        status: 'SKIPPED',
        classification: 'NON_ACTIONABLE',
        confidence: 1,
        reason: skipReason,
      },
    });
  }

  // AI classification
  try {
    const classification = await classifyAndExtractTasks({
      subject,
      cleanBody,
      senderEmail,
      account,
    });

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
          classification: classification.isActionable
            ? 'LOW_CONFIDENCE_ACTIONABLE'
            : 'NON_ACTIONABLE',
          confidence: classification.confidence,
          reason: alwaysAllowed && classification.actions.length === 0 ? 'always_allow_no_actions' : classification.reason,
          extractedActions: classification,
        },
      });
    }

    const created = await createTasksFromEmail({
      account,
      ingestion,
      classification,
      cleanBody,
      auditAgentName: 'Hostinger agent',
      auditSource: 'hostinger_agent',
    });

    ingestion = await prisma.emailIngestion.update({
      where: { id: ingestion.id },
      data: {
        status: created.createdTaskIds.length > 0 ? 'TASK_CREATED' : 'SKIPPED',
        classification: 'ACTIONABLE',
        confidence: classification.confidence,
        reason: classification.reason,
        extractedActions: created.actions,
        createdTaskIds: created.createdTaskIds,
      },
    });
    return ingestion;
  } catch (error) {
    secureLogger.error('Hostinger agent failed to process message', {
      accountId: account.id,
      messageId,
      message: error.message,
    });
    return prisma.emailIngestion.update({
      where: { id: ingestion.id },
      data: { status: 'ERROR', error: error.message },
    });
  }
}

/**
 * Sync a single Hostinger IMAP account — fetch last 7 days of inbox.
 */
async function syncHostingerAccount(account) {
  const client = await buildImapClient(account);

  try {
    const lock = await client.getMailboxLock('INBOX');
    let processed = 0;

    try {
      // Search for messages from the last 7 days
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const messages = await client.search({ since }, { uid: true });
      const uids = messages.slice(-MAX_MESSAGES_PER_SYNC); // take the most recent N

      for (const uid of uids) {
        try {
          // Fetch envelope, body text, and headers for each message
          const msg = await client.fetchOne(uid, {
            envelope: true,
            bodyStructure: true,
            source: { start: 0, maxLength: 64000 }, // raw source up to 64KB
          }, { uid: true });

          // Parse the raw source for body and headers
          let bodyText = '';
          let rawHeaders = '';
          if (msg.source) {
            const sourceStr = msg.source.toString('utf8');
            const headerBodySplit = sourceStr.indexOf('\r\n\r\n');
            if (headerBodySplit > 0) {
              rawHeaders = sourceStr.slice(0, headerBodySplit);
              const rawBody = sourceStr.slice(headerBodySplit + 4);
              // Strip HTML if present
              bodyText = rawBody
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/?(div|p|li|tr|h[1-6])[^>]*>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            }
          }

          await processImapMessage(account, {
            uid,
            envelope: msg.envelope,
            bodyText,
            rawHeaders,
          });
          processed += 1;
        } catch (msgErr) {
          secureLogger.error('Hostinger agent failed to process single message', {
            accountId: account.id,
            uid,
            message: msgErr.message,
          });
        }
      }
    } finally {
      lock.release();
    }

    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        lastSyncedAt: new Date(),
        lastError: null,
        status: 'ACTIVE',
      },
    });

    return { processed };
  } finally {
    try { await client.logout(); } catch (_) { /* ignore */ }
  }
}

/**
 * Sync all active Hostinger IMAP accounts (called by the scheduler).
 */
async function syncAllHostingerAccounts() {
  const accounts = await prisma.connectedAccount.findMany({
    where: {
      provider: PROVIDER,
      status: 'ACTIVE',
      syncEnabled: true,
      encryptedAccessToken: { not: null },
    },
    orderBy: { lastSyncedAt: 'asc' },
    take: Number(
      process.env.HOSTINGER_AGENT_ACCOUNTS_PER_TICK ||
        process.env.GMAIL_AGENT_ACCOUNTS_PER_TICK ||
        10
    ),
  });

  for (const account of accounts) {
    try {
      await syncHostingerAccount(account);
    } catch (error) {
      secureLogger.error('Hostinger account sync failed', {
        accountId: account.id,
        message: error.message,
      });
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: {
          status: 'ERROR',
          lastError: error.message,
          lastSyncedAt: new Date(),
        },
      });
    }
  }

  return { accountsProcessed: accounts.length };
}

/**
 * Get the status of the Hostinger agent for a user.
 */
async function getHostingerAgentStatus(userId) {
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
      createdAt: true,
    },
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
          createdAt: true,
        },
      })
    : [];

  return { account, recent };
}

module.exports = {
  PROVIDER,
  validateImapCredentials,
  upsertHostingerAccount,
  getHostingerAgentStatus,
  syncAllHostingerAccounts,
  syncHostingerAccount,
};
