const prisma = require('../lib/prisma');
const { createAllowedTaskFromEmail } = require('./emailAgentShared');

function serviceError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeSenderEmail(senderEmail) {
  return String(senderEmail || '').trim().toLowerCase();
}

async function listSkipSenders({ userId, provider }) {
  return prisma.emailSenderRule.findMany({
    where: { userId, provider, alwaysSkip: true },
    orderBy: { senderEmail: 'asc' },
    select: { id: true, senderEmail: true, createdAt: true }
  });
}

async function convertIngestionToTask({ ingestion, auditAgentName, auditSource, scheduleTask }) {
  if (Array.isArray(ingestion.createdTaskIds) && ingestion.createdTaskIds.length > 0) {
    return { ingestion, createdTaskIds: [], alreadyConverted: true };
  }

  const created = await createAllowedTaskFromEmail({
    account: ingestion.connectedAccount,
    ingestion,
    cleanBody: ingestion.snippet || '',
    auditAgentName,
    auditSource
  });

  for (const taskId of created.createdTaskIds) {
    if (scheduleTask) scheduleTask(taskId);
  }

  const updated = await prisma.emailIngestion.update({
    where: { id: ingestion.id },
    data: {
      status: 'TASK_CREATED',
      classification: 'ACTIONABLE',
      confidence: 1,
      reason: 'allowed_by_user',
      extractedActions: created.actions,
      createdTaskIds: created.createdTaskIds,
      error: null
    }
  });

  return { ingestion: updated, createdTaskIds: created.createdTaskIds, alreadyConverted: false };
}

async function allowIngestionOnce({ userId, provider, ingestionId, auditAgentName, auditSource, scheduleTask }) {
  const id = Number(ingestionId);
  if (!id) throw serviceError('Invalid email ingestion id');

  const ingestion = await prisma.emailIngestion.findFirst({
    where: { id, userId, provider },
    include: { connectedAccount: true }
  });
  if (!ingestion) throw serviceError('Email ingestion not found', 404);
  if (ingestion.status !== 'SKIPPED') {
    throw serviceError('Only skipped emails can be allowed once');
  }

  return convertIngestionToTask({ ingestion, auditAgentName, auditSource, scheduleTask });
}

async function allowSenderAlways({ user, provider, senderEmail, auditAgentName, auditSource, scheduleTask }) {
  const normalizedSender = normalizeSenderEmail(senderEmail);
  if (!normalizedSender) throw serviceError('senderEmail is required');

  await prisma.emailSenderRule.upsert({
    where: {
      userId_provider_senderEmail: {
        userId: user.id,
        provider,
        senderEmail: normalizedSender
      }
    },
    create: {
      userId: user.id,
      companyId: user.companyId,
      provider,
      senderEmail: normalizedSender,
      alwaysSkip: false
    },
    update: { alwaysSkip: false }
  });

  const ingestions = await prisma.emailIngestion.findMany({
    where: {
      userId: user.id,
      provider,
      senderEmail: normalizedSender,
      status: 'SKIPPED'
    },
    include: { connectedAccount: true },
    orderBy: { createdAt: 'asc' }
  });

  const createdTaskIds = [];
  for (const ingestion of ingestions) {
    const converted = await convertIngestionToTask({
      ingestion,
      auditAgentName,
      auditSource,
      scheduleTask
    });
    createdTaskIds.push(...converted.createdTaskIds);
  }

  const skipSenders = await listSkipSenders({ userId: user.id, provider });
  return { createdTaskIds, convertedCount: createdTaskIds.length, skipSenders };
}

module.exports = {
  allowIngestionOnce,
  allowSenderAlways,
  listSkipSenders
};
