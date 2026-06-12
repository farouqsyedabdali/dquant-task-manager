const axios = require('axios');
const prisma = require('../lib/prisma');
const { DEFAULT_OPENROUTER_MODEL } = require('../config/openRouterDefaults');
const { parseLocalDate } = require('../utils/dateUtils');

const MIN_AUTO_CREATE_CONFIDENCE = Number(process.env.GMAIL_AGENT_MIN_CONFIDENCE || 0.72);
const DEFAULT_DUE_DATE_DAYS = 7;

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
  if (precedence && ['bulk', 'junk', 'list'].includes(precedence.toLowerCase())) return 'bulk_email';
  if (/\b(no-?reply|donotreply|notifications?|newsletter|marketing|promo)\b/i.test(lowerSender)) return 'automated_sender';
  if (/\b(unsubscribe|newsletter|digest|receipt|invoice paid|promotion|sale|deal)\b/i.test(lowerSubject)) return 'low_value_category';

  return null;
}

async function isSenderAlwaysSkipped({ userId, provider, senderEmail }) {
  const normalizedSender = String(senderEmail || '').trim().toLowerCase();
  if (!normalizedSender) return false;

  const rule = await prisma.emailSenderRule.findUnique({
    where: {
      userId_provider_senderEmail: {
        userId,
        provider,
        senderEmail: normalizedSender
      }
    },
    select: { alwaysSkip: true }
  });

  return Boolean(rule?.alwaysSkip);
}

async function classifyAndExtractTasks({ subject, cleanBody, senderEmail, account }) {
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      isActionable: false,
      confidence: 0,
      importance: 'LOW',
      reason: 'OPENROUTER_API_KEY is not configured',
      actions: []
    };
  }

  let taskLines = '(none)';
  if (account) {
    const userTasks = await prisma.task.findMany({
      where: {
        companyId: account.companyId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        OR: [{ assigneeId: account.userId }, { assignerId: account.userId }],
      },
      select: { 
        id: true, 
        title: true, 
        status: true, 
        priority: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: { content: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });
    if (userTasks.length > 0) {
      taskLines = userTasks.map(t => {
        const commentPreview = t.comments.length > 0 
          ? ` [Recent comments: ${t.comments.map(c => `"${c.content}"`).join(', ')}]` 
          : '';
        return `[id:${t.id}] ${t.title} (${t.status}, ${t.priority})${commentPreview}`;
      }).join('\n');
    }
  }

  const prompt = `
You are Tialz's email task agent. Decide if this email should automatically become tasks, update existing tasks, add subtasks, or add comments to tasks.

Active Tasks for user:
${taskLines}

Return ONLY valid JSON with this shape:
{
  "isActionable": boolean,
  "confidence": number,
  "importance": "LOW"|"MEDIUM"|"HIGH"|"URGENT",
  "reason": "short explanation",
  "actions": [
    {
      "actionType": "create_task",
      "title": "short task title",
      "description": "short helpful context",
      "priority": "LOW"|"MEDIUM"|"HIGH"|"URGENT",
      "dueDate": "YYYY-MM-DD or natural date string or null"
    },
    {
      "actionType": "update_task",
      "taskId": 123,
      "status": "TODO"|"IN_PROGRESS"|"COMPLETED"|"ON_HOLD"|"CANCELLED",
      "priority": "LOW"|"MEDIUM"|"HIGH"|"URGENT",
      "dueDate": "YYYY-MM-DD or natural date string or null"
    },
    {
      "actionType": "add_subtask",
      "parentTaskId": 123,
      "title": "short subtask title",
      "description": "short helpful context"
    },
    {
      "actionType": "add_comment",
      "taskId": 123,
      "content": "the comment text to add"
    }
  ]
}

Create or update tasks only for emails that represent real work: direct requests, commitments, follow-ups, approvals, meetings, deliverables, issues, or deadlines.
Ignore newsletters, marketing, automated digests, receipts, FYI-only messages, social notifications, and spam.
If uncertain, set isActionable=false or confidence below 0.72.
Use at most 5 actions.
`.trim();

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.EMAIL_AGENT_MODEL || process.env.OPENROUTER_CHAT_MODEL || DEFAULT_OPENROUTER_MODEL,
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
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 5) : []
    };
  } catch (error) {
    const status = error.response?.status;
    const details = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    throw new Error(`Email AI classification failed${status ? ` (${status})` : ''}: ${details}`);
  }
}

async function createTasksFromEmail({ account, ingestion, classification, cleanBody, auditAgentName, auditSource }) {
  const createdTaskIds = [];
  const loggedActions = [];

  for (const item of classification.actions || []) {
    const actionType = item.actionType || 'create_task';

    if (actionType === 'create_task') {
      const title = String(item.title || '').trim().slice(0, 200);
      if (!title) continue;

      const task = await prisma.task.create({
        data: {
          title,
          description: String(item.description || '').trim().slice(0, 1200) || null,
          priority: normalizePriority(item.priority || classification.importance),
          dueDate: resolveDueDate(item.dueDate),
          status: 'TODO',
          assignerId: account.userId,
          assigneeId: account.userId,
          companyId: account.companyId
        }
      });

      createdTaskIds.push(task.id);
      loggedActions.push({ actionType: 'create_task', taskId: task.id, title: task.title });

      await prisma.auditLog.create({
        data: {
          action: 'TASK_CREATED',
          entityType: 'Task',
          entityId: task.id,
          description: `${auditAgentName} created task "${task.title}"`,
          metadata: {
            source: auditSource,
            emailIngestionId: ingestion.id,
            messageId: ingestion.providerMessageId,
            senderEmail: ingestion.senderEmail
          },
          userId: account.userId,
          companyId: account.companyId
        }
      });
    } else if (actionType === 'update_task' && item.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: item.taskId, companyId: account.companyId }
      });
      if (task) {
        const updateData = {};
        if (item.status) updateData.status = item.status.trim().toUpperCase();
        if (item.priority) updateData.priority = normalizePriority(item.priority);
        if (item.dueDate) updateData.dueDate = resolveDueDate(item.dueDate);

        if (Object.keys(updateData).length > 0) {
          await prisma.task.update({ where: { id: task.id }, data: updateData });
          loggedActions.push({ actionType: 'update_task', taskId: task.id, updates: updateData });

          await prisma.auditLog.create({
            data: {
              action: 'TASK_UPDATED',
              entityType: 'Task',
              entityId: task.id,
              description: `${auditAgentName} updated task "${task.title}"`,
              metadata: { source: auditSource, emailIngestionId: ingestion.id, updates: updateData },
              userId: account.userId,
              companyId: account.companyId
            }
          });
        }
      }
    } else if (actionType === 'add_subtask' && item.parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: { id: item.parentTaskId, companyId: account.companyId }
      });
      if (parentTask) {
        const title = String(item.title || '').trim().slice(0, 200);
        if (title) {
          const subtask = await prisma.task.create({
            data: {
              title,
              description: String(item.description || '').trim().slice(0, 1200) || null,
              priority: normalizePriority(item.priority || classification.importance),
              dueDate: resolveDueDate(item.dueDate),
              status: 'TODO',
              assignerId: account.userId,
              assigneeId: account.userId,
              companyId: account.companyId,
              parentTaskId: parentTask.id
            }
          });
          createdTaskIds.push(subtask.id);
          loggedActions.push({ actionType: 'add_subtask', taskId: subtask.id, parentTaskId: parentTask.id, title: subtask.title });

          await prisma.auditLog.create({
            data: {
              action: 'SUBTASK_CREATED',
              entityType: 'Task',
              entityId: subtask.id,
              description: `${auditAgentName} created subtask "${subtask.title}" under "${parentTask.title}"`,
              metadata: { source: auditSource, emailIngestionId: ingestion.id },
              userId: account.userId,
              companyId: account.companyId
            }
          });
        }
      }
    } else if (actionType === 'add_comment' && item.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: item.taskId, companyId: account.companyId }
      });
      if (task) {
        const content = String(item.content || '').trim().slice(0, 2000);
        if (content) {
          const comment = await prisma.comment.create({
            data: {
              content,
              taskId: task.id,
              authorId: account.userId,
              companyId: account.companyId
            }
          });
          loggedActions.push({ actionType: 'add_comment', taskId: task.id, commentId: comment.id });

          await prisma.auditLog.create({
            data: {
              action: 'COMMENT_CREATED',
              entityType: 'Task',
              entityId: task.id,
              description: `${auditAgentName} added a comment from email`,
              metadata: { source: auditSource, emailIngestionId: ingestion.id },
              userId: account.userId,
              companyId: account.companyId
            }
          });
        }
      }
    }
  }

  return { createdTaskIds, actions: loggedActions };
}

async function isSenderAlwaysAllowed({ userId, provider, senderEmail }) {
  const normalizedSender = String(senderEmail || '').trim().toLowerCase();
  if (!normalizedSender) return false;

  const rule = await prisma.emailSenderRule.findUnique({
    where: {
      userId_provider_senderEmail: {
        userId,
        provider,
        senderEmail: normalizedSender
      }
    },
    select: { alwaysAllow: true }
  });

  return Boolean(rule?.alwaysAllow);
}

async function handleIngestionAction({ userId, companyId, ingestionId, action }) {
  const ingestion = await prisma.emailIngestion.findFirst({
    where: { id: Number(ingestionId), userId, companyId }
  });
  if (!ingestion) throw new Error('Email ingestion not found');

  if (action === 'skip_once') {
    const updated = await prisma.emailIngestion.update({
      where: { id: ingestion.id },
      data: { status: 'SKIPPED' }
    });
    return { success: true, ingestion: updated };
  }

  // For allow_once and always_allow
  const account = await prisma.connectedAccount.findFirst({
    where: { id: ingestion.connectedAccountId, userId }
  });
  if (!account) throw new Error('Connected account not found');

  let classification = ingestion.extractedActions;
  if (!classification || Object.keys(classification).length === 0 || !classification.actions) {
    const cleanBody = stripQuotedText(ingestion.snippet || '');
    classification = await classifyAndExtractTasks({
      subject: ingestion.subject || '',
      cleanBody,
      senderEmail: ingestion.senderEmail || '',
      account
    });
  }

  const created = await createTasksFromEmail({
    account,
    ingestion,
    classification,
    cleanBody: stripQuotedText(ingestion.snippet || ''),
    auditAgentName: ingestion.provider === 'GOOGLE_GMAIL' ? 'Gmail agent' : ingestion.provider === 'MICROSOFT_OUTLOOK' ? 'Outlook agent' : 'Hostinger agent',
    auditSource: ingestion.provider === 'GOOGLE_GMAIL' ? 'gmail_agent' : ingestion.provider === 'MICROSOFT_OUTLOOK' ? 'outlook_agent' : 'hostinger_agent'
  });

  const updatedIngestion = await prisma.emailIngestion.update({
    where: { id: ingestion.id },
    data: {
      status: created.createdTaskIds.length > 0 ? 'TASK_CREATED' : 'SKIPPED',
      extractedActions: classification,
      createdTaskIds: created.createdTaskIds
    }
  });

  if (action === 'always_allow') {
    await prisma.emailSenderRule.upsert({
      where: {
        userId_provider_senderEmail: {
          userId,
          provider: ingestion.provider,
          senderEmail: ingestion.senderEmail.toLowerCase()
        }
      },
      create: {
        userId,
        companyId,
        provider: ingestion.provider,
        senderEmail: ingestion.senderEmail.toLowerCase(),
        alwaysSkip: false,
        alwaysAllow: true
      },
      update: {
        alwaysSkip: false,
        alwaysAllow: true
      }
    });
  }

  return { success: true, ingestion: updatedIngestion, createdTaskIds: created.createdTaskIds };
}

module.exports = {
  MIN_AUTO_CREATE_CONFIDENCE,
  getDefaultDueDate,
  resolveDueDate,
  normalizePriority,
  parseJsonObject,
  headerValue,
  stripQuotedText,
  deterministicSkip,
  isSenderAlwaysSkipped,
  isSenderAlwaysAllowed,
  classifyAndExtractTasks,
  createTasksFromEmail,
  handleIngestionAction
};
