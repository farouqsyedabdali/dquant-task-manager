const axios = require('axios');
const prisma = require('../lib/prisma');
const emailService = require('../services/emailService');
const secureLogger = require('../middleware/secureLogger');
const { parseLocalDate } = require('../utils/dateUtils');
const { DEFAULT_OPENROUTER_MODEL } = require('../config/openRouterDefaults');
const { scheduleGoogleCalendarSyncForTask } = require('../services/gmailAgentService');

const PERSONAL_MONTHLY_LIMIT = 100;
const BUSINESS_MONTHLY_LIMIT = 300;
const MAX_TASKS_PER_EMAIL = 10;
const DEFAULT_DUE_DATE_DAYS = 7;

const OPENROUTER_STRUCTURED_MODEL =
  process.env.OPENROUTER_STRUCTURED_MODEL ||
  process.env.OPENROUTER_CHAT_MODEL ||
  DEFAULT_OPENROUTER_MODEL;

function getMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function getPlanDetails(company) {
  const isPersonal = Boolean(company?.isPersonal);

  return {
    planType: isPersonal ? 'personal' : 'business',
    monthlyLimit: isPersonal ? PERSONAL_MONTHLY_LIMIT : BUSINESS_MONTHLY_LIMIT
  };
}

function normalizePriority(priority) {
  const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const normalized = String(priority || '').trim().toUpperCase();

  return allowedPriorities.includes(normalized) ? normalized : 'MEDIUM';
}

function getDefaultDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + DEFAULT_DUE_DATE_DAYS);
  dueDate.setHours(23, 59, 0, 0);
  return dueDate;
}

function resolveDueDate(input) {
  if (!input || typeof input !== 'string') {
    return getDefaultDueDate();
  }

  try {
    const parsed = parseLocalDate(input.trim());

    if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
      return getDefaultDueDate();
    }

    return parsed;
  } catch (error) {
    return getDefaultDueDate();
  }
}

function buildTaskDescription(description, subject, cleanBody) {
  const parts = [];
  const trimmedDescription = typeof description === 'string' ? description.trim() : '';
  const trimmedSubject = typeof subject === 'string' ? subject.trim() : '';
  const trimmedBody = typeof cleanBody === 'string' ? cleanBody.trim() : '';

  if (trimmedDescription) {
    parts.push(trimmedDescription);
  }

  if (trimmedSubject) {
    parts.push(`Source email subject: ${trimmedSubject}`);
  }

  if (trimmedBody) {
    parts.push(`Source email excerpt: ${trimmedBody.slice(0, 600)}`);
  }

  return parts.join('\n\n').slice(0, 1000) || null;
}

function extractTaskArray(content) {
  const cleaned = String(content || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }

  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const parsedObject = JSON.parse(objectMatch[0]);
    if (Array.isArray(parsedObject.tasks)) {
      return parsedObject.tasks;
    }
  }

  return [];
}

async function extractTasksFromEmail(subject, cleanBody) {
  const prompt = `
You extract actionable tasks from inbound emails for a task manager.

Return ONLY a JSON array. Do not include markdown, prose, or code fences.

Each item must use this shape:
{
  "title": "Short actionable task title",
  "description": "Optional concise task summary",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "dueDate": "YYYY-MM-DD or YYYY-MM-DDTHH:mm or null"
}

Rules:
- Return only genuinely actionable tasks.
- Ignore greetings, signatures, pleasantries, and non-actionable discussion.
- Keep titles under 200 characters.
- Keep descriptions under 300 characters.
- If no due date is mentioned, set dueDate to null.
- If no clear priority is mentioned, use MEDIUM.
- Return an empty array if no actionable tasks exist.
`.trim();

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: OPENROUTER_STRUCTURED_MODEL,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `Email subject: ${subject}\n\nEmail body:\n${cleanBody}`
        }
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

  const content = response.data?.choices?.[0]?.message?.content || '';
  const extractedTasks = extractTaskArray(content);

  return extractedTasks
    .filter(task => task && typeof task === 'object')
    .slice(0, MAX_TASKS_PER_EMAIL)
    .map(task => ({
      title: String(task.title || '').trim().slice(0, 200),
      description: typeof task.description === 'string' ? task.description.trim().slice(0, 300) : '',
      priority: normalizePriority(task.priority),
      dueDate: resolveDueDate(task.dueDate)
    }))
    .filter(task => task.title);
}

async function sendUpgradeRequiredEmail(user, planDetails, taskCount) {
  const subject = 'Task limit reached for email processing';
  const text = [
    `Hi ${user.name},`,
    '',
    `We received an email for automatic task creation, but your ${planDetails.planType} plan has reached its monthly limit of ${planDetails.monthlyLimit} created tasks.`,
    `Current count this month: ${taskCount}.`,
    '',
    'Please upgrade your plan to continue creating tasks from inbound emails.',
    '',
    'Tialz'
  ].join('\n');

  await emailService.sendEmail({
    to: user.email,
    subject,
    text,
    html: text.replace(/\n/g, '<br>')
  });
}

async function createTasksFromEmail({ user, senderEmail, subject, cleanBody }) {
  const extractedTasks = await extractTasksFromEmail(subject, cleanBody);

  if (extractedTasks.length === 0) {
    secureLogger.info('Inbound email produced no tasks', {
      userId: user.id,
      companyId: user.companyId,
      senderEmail
    });
    return;
  }

  for (const extractedTask of extractedTasks) {
    const createdTask = await prisma.task.create({
      data: {
        title: extractedTask.title,
        description: buildTaskDescription(extractedTask.description, subject, cleanBody),
        priority: extractedTask.priority,
        dueDate: extractedTask.dueDate,
        status: 'TODO',
        assignerId: user.id,
        assigneeId: user.id,
        companyId: user.companyId
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'TASK_CREATED',
        entityType: 'Task',
        entityId: createdTask.id,
        description: `AI email ingestion created task "${createdTask.title}"`,
        metadata: {
          source: 'internal_email_agent',
          senderEmail,
          emailSubject: subject
        },
        userId: user.id,
        companyId: user.companyId
      }
    });

    scheduleGoogleCalendarSyncForTask(createdTask.id);
  }

  secureLogger.info('Inbound email tasks created successfully', {
    userId: user.id,
    companyId: user.companyId,
    createdCount: extractedTasks.length
  });
}

const processInboundEmail = async (req, res) => {
  const authorization = req.header('authorization');
  const expectedAuthorization = `Bearer ${process.env.SYSTEM_API_KEY}`;

  if (!process.env.SYSTEM_API_KEY) {
    secureLogger.error('SYSTEM_API_KEY is missing for internal email endpoint');
    return res.status(500).json({ error: 'SYSTEM_API_KEY is not configured' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    secureLogger.error('OPENROUTER_API_KEY is missing for internal email endpoint');
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured' });
  }

  if (authorization !== expectedAuthorization) {
    return res.status(401).json({ error: 'Invalid system authorization' });
  }

  try {
    const { senderEmail, subject, cleanBody } = req.body;

    const matchingUsers = await prisma.user.findMany({
      where: {
        email: senderEmail.toLowerCase()
      },
      include: {
        company: true
      },
      take: 2
    });
    const user = matchingUsers[0];

    if (!user) {
      secureLogger.warn('Inbound email ignored because sender was not found', {
        senderEmail
      });

      return res.status(202).json({
        accepted: false,
        status: 'ignored',
        reason: 'user_not_found'
      });
    }

    if (matchingUsers.length > 1) {
      secureLogger.warn('Inbound email ignored because sender email matched multiple tenants', {
        senderEmail
      });

      return res.status(202).json({
        accepted: false,
        status: 'ignored',
        reason: 'ambiguous_sender_email'
      });
    }

    const planDetails = getPlanDetails(user.company);
    const { start, end } = getMonthRange();

    const monthlyTaskCount = await prisma.task.count({
      where: {
        assignerId: user.id,
        isDraft: false,
        createdAt: {
          gte: start,
          lt: end
        }
      }
    });

    if (monthlyTaskCount >= planDetails.monthlyLimit) {
      await sendUpgradeRequiredEmail(user, planDetails, monthlyTaskCount);

      return res.status(202).json({
        accepted: false,
        status: 'skipped',
        reason: 'monthly_limit_exceeded',
        planType: planDetails.planType
      });
    }

    setImmediate(() => {
      createTasksFromEmail({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          companyId: user.companyId
        },
        senderEmail,
        subject,
        cleanBody
      }).catch(error => {
        secureLogger.error('Background inbound email processing failed', {
          userId: user.id,
          senderEmail,
          message: error.message
        });
      });
    });

    return res.status(202).json({
      accepted: true,
      status: 'queued'
    });
  } catch (error) {
    secureLogger.error('Failed to handle inbound email request', {
      message: error.message
    });
    return res.status(500).json({ error: 'Failed to process inbound email request' });
  }
};

module.exports = {
  processInboundEmail
};
