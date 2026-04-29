const express = require('express');
const { body } = require('express-validator');
const axios = require('axios');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validators');
const { parseLocalDate } = require('../utils/dateUtils');
const {
  createAIActionPreview,
  executeAIAction,
  rejectAIAction,
  undoAIAction,
  SUPPORTED_ACTIONS
} = require('../services/aiActionRunner');

const router = express.Router();

// Apply authentication middleware to all AI routes
router.use(auth);

router.post('/actions/preview', async (req, res) => {
  try {
    const { actionType, input, sourceText } = req.body;
    const preview = await createAIActionPreview({ req, actionType, input, sourceText });
    res.json({ success: true, action: preview });
  } catch (error) {
    console.error('AI action preview error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to preview AI action' });
  }
});

router.post('/actions/execute', async (req, res) => {
  try {
    const { actionId } = req.body;
    if (!actionId) return res.status(400).json({ error: 'actionId is required' });
    const result = await executeAIAction({ req, actionId });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('AI action execute error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to execute AI action' });
  }
});

router.post('/actions/reject', async (req, res) => {
  try {
    const { actionId } = req.body;
    if (!actionId) return res.status(400).json({ error: 'actionId is required' });
    const action = await rejectAIAction({ req, actionId });
    res.json({ success: true, action });
  } catch (error) {
    console.error('AI action reject error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to reject AI action' });
  }
});

router.post('/actions/undo', async (req, res) => {
  try {
    const { actionId } = req.body;
    if (!actionId) return res.status(400).json({ error: 'actionId is required' });
    const result = await undoAIAction({ req, actionId });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('AI action undo error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to undo AI action' });
  }
});

// Helper: Try to extract JSON command(s) from AI response
function extractJsonCommands(text) {
  // Remove code block markers (``` or ```json)
  let cleaned = text.replace(/```json|```/g, '').trim();
  // Try to match an array of JSON objects or a single object
  const arrayMatch = cleaned.match(/\[.*?\]/s);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) { }
  }
  const objMatches = [...cleaned.matchAll(/\{[\s\S]*?\}/g)];
  if (objMatches.length > 0) {
    return objMatches.map(m => {
      try { return JSON.parse(m[0]); } catch { return null; }
    }).filter(Boolean);
  }
  return [];
}

const ROUTE_INTENT_ALLOWED = new Set(['create_task', 'add_update', 'add_subtask', 'create_project', 'chat']);

/**
 * Parse JSON from LLM for POST /ai/route-intent. Falls back to chat on parse errors.
 */
function parseRouteIntentResponse(rawText, fallbackMessage) {
  const cleaned = (rawText || '').replace(/```json|```/g, '').trim();
  let obj = null;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        obj = JSON.parse(m[0]);
      } catch {
        /* ignore */
      }
    }
  }
  if (!obj || typeof obj !== 'object') {
    return { intent: 'chat', text: fallbackMessage };
  }
  let intent = typeof obj.intent === 'string' ? obj.intent.trim() : 'chat';
  if (!ROUTE_INTENT_ALLOWED.has(intent)) intent = 'chat';
  const text =
    typeof obj.text === 'string' && obj.text.trim() ? obj.text.trim() : fallbackMessage;
  return { intent, text };
}

function sanitizeChatHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue;
    const role = m.role === 'assistant' || m.role === 'user' ? m.role : null;
    const content = typeof m.content === 'string' ? m.content.trim() : '';
    if (!role || !content) continue;
    out.push({ role, content: content.slice(0, 12000) });
  }
  return out.slice(-48);
}

function formatCurrentDateForPrompt() {
  return new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

function buildChatSystemPrompt(userName, userRole, companyName, userTasks) {
  const taskLines = userTasks.length
    ? userTasks
        .map((task, idx) => {
          const due = task.dueDate
            ? new Date(task.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'no due date';
          return `#${idx + 1}: [id:${task.id}] ${task.title} (${task.status}, ${task.priority} priority, due ${due}, assigned to ${task.assignee?.name || 'unassigned'})`;
        })
        .join('\n')
    : '(none)';

  return `
You are an AI assistant for a task management system called TIALZ.
You are in a multi-turn chat. Use the full conversation history to answer follow-ups (what the user asked earlier, what you already did, quoted email text, or agreed next steps). If they ask what they said first or to repeat earlier content, answer from the conversation. Do not reply with generic "I don't have enough context" when the answer is in the history; only ask for clarification when something is genuinely missing.

Style rules:
- Do NOT use emojis (no ✅, ⚠️, 🗑️, etc). Write clean, professional text.
- Use markdown for formatting: **bold** for emphasis, numbered lists for priorities/steps, bullet points for summaries. Keep it concise.
- When creating or changing work, output the JSON command and add a short line like "Here's what I've put together — review the action below." The UI will show a visual card for the user to approve or decline.
- Do not claim that you already changed something. The user must approve the action card first.
- For create/change requests, always include the JSON command even if a field is missing, vague, in the past, or needs clarification. The action runner will turn invalid drafts into blocked review cards. Do not replace the JSON command with only a clarification sentence.

If the user asks you to create or change tasks/projects/comments, output a JSON command (or an array of commands) in this format (on a new line):
{ "action": "create_task", "title": "...", "assignee": "...", "description": "...", "priority": "...", "dueDate": "YYYY-MM-DD or YYYY-MM-DDTHH:mm" }
{ "action": "update_task", "taskId": 123, "title": "task name if id is unknown", "status": "...", "priority": "...", "dueDate": "YYYY-MM-DD or YYYY-MM-DDTHH:mm", "description": "..." }
{ "action": "add_subtask", "parentTaskId": 123, "parentTaskTitle": "parent task if id is unknown", "title": "...", "description": "...", "priority": "...", "dueDate": "YYYY-MM-DD or YYYY-MM-DDTHH:mm" }
{ "action": "create_project", "name": "...", "description": "...", "dueDate": "YYYY-MM-DD or YYYY-MM-DDTHH:mm" }
{ "action": "update_project", "projectId": 123, "projectName": "project name if id is unknown", "name": "...", "description": "...", "status": "ACTIVE|ON_HOLD|COMPLETED|ARCHIVED", "dueDate": "YYYY-MM-DD or YYYY-MM-DDTHH:mm" }
{ "action": "add_comment", "taskId": 123, "title": "task name if id is unknown", "content": "..." }
{ "action": "list_tasks", "filter": { "status": "...", "priority": "...", "assignee": "..." } }
- For multiple actions, output an array of JSON commands.
- Prefer taskId/projectId when it is available in the active task context. If you only know a title, include the title and let the action runner resolve it.
- Parse natural language dates (e.g., "by Friday", "EOD tomorrow", "next Monday 3pm") and convert to ISO-like format (YYYY-MM-DD or YYYY-MM-DDTHH:mm) in the dueDate field when applicable.
- For references like "last task you created" or "second task in my list", use the user's recent tasks (provided below) and include the resolved title in the command.
- IMPORTANT: You are only shown active tasks (TODO and IN_PROGRESS status) to help you focus on the most relevant work. This improves accuracy when there are many tasks.
- For normal questions (what's due, priorities, summaries), answer in plain language using markdown and the task list below. Be concise and fast.
- Otherwise, just answer normally.

Current User Context:
- Name: ${userName}
- Role: ${userRole}
- Company: ${companyName || 'Unknown Company'}
- Current date/time: ${formatCurrentDateForPrompt()}

Active Tasks (${userTasks.length} - TODO and IN_PROGRESS only):
${taskLines}
`.trim();
}

async function runChatCommand(command, { userId, companyId, userTasks }) {
  if (command.action === 'create_task') {
    const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    let priority = 'MEDIUM';
    if (command.priority && typeof command.priority === 'string') {
      const upper = command.priority.trim().toUpperCase();
      if (allowedPriorities.includes(upper)) {
        priority = upper;
      }
    }

    let dueDate = null;
    let dueDateError = null;
    if (command.dueDate && typeof command.dueDate === 'string') {
      let finalDueDate = command.dueDate;
      if (!finalDueDate.includes('T')) {
        finalDueDate = `${finalDueDate}T23:59:00`;
      } else if (finalDueDate.includes('T') && !finalDueDate.includes(':')) {
        finalDueDate = `${finalDueDate}23:59:00`;
      }
      const dueDateObj = new Date(finalDueDate);
      if (isNaN(dueDateObj.getTime())) {
        dueDateError = 'Invalid date format. Please provide a valid date.';
      } else if (dueDateObj <= new Date()) {
        dueDateError = 'Due date must be in the future.';
      } else {
        dueDate = dueDateObj.toISOString();
      }
    }

    if (dueDateError) {
      return { __type: 'error', message: dueDateError };
    }

    return {
      __type: 'task_proposal',
      title: command.title || 'Untitled Task',
      description: command.description || '',
      priority,
      dueDate,
      assignee: command.assignee || null,
    };
  } else if (command.action === 'delete_task') {
    const task = await prisma.task.findFirst({
      where: {
        title: { equals: command.title, mode: 'insensitive' },
        companyId: companyId
      }
    });
    if (task) {
      await prisma.task.delete({ where: { id: task.id } });
      return `Task "${task.title}" has been deleted.`;
    } else {
      return `Could not find a task called "${command.title}".`;
    }
  } else if (command.action === 'update_task') {
    let title = command.title;
    if (title && title.toLowerCase().includes('last task')) {
      if (userTasks.length > 0) title = userTasks[0].title;
    } else if (title && title.toLowerCase().includes('second task')) {
      if (userTasks.length > 1) title = userTasks[1].title;
    }
    const task = await prisma.task.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        companyId: companyId
      }
    });
    if (task) {
      const updateData = {};
      if (command.status) {
        const allowedStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
        const status = command.status.trim().toUpperCase();
        if (allowedStatuses.includes(status)) updateData.status = status;
      }
      if (command.priority) {
        const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const priority = command.priority.trim().toUpperCase();
        if (allowedPriorities.includes(priority)) updateData.priority = priority;
      }
      if (command.dueDate && typeof command.dueDate === 'string') {
        const parsed = new Date(command.dueDate);
        if (!isNaN(parsed.getTime())) updateData.dueDate = parsed;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.task.update({ where: { id: task.id }, data: updateData });
        return `Task "${task.title}" updated${updateData.status ? ` — status: ${updateData.status}` : ''}${updateData.priority ? ` — priority: ${updateData.priority}` : ''}${updateData.dueDate ? ' — due date updated' : ''}.`;
      } else {
        return `No valid fields to update for task "${task.title}".`;
      }
    } else {
      return `Could not find a task called "${title}".`;
    }
  } else if (command.action === 'list_tasks') {
    const filter = command.filter || {};
    let where = { companyId };
    if (filter.status) {
      where.status = filter.status.trim().toUpperCase();
    }
    if (filter.priority) {
      where.priority = filter.priority.trim().toUpperCase();
    }
    if (filter.assignee) {
      const assignee = await prisma.user.findFirst({
        where: {
          name: { equals: filter.assignee, mode: 'insensitive' },
          companyId: companyId
        }
      });
      if (assignee) where.assigneeId = assignee.id;
    }
    where.OR = [
      { assigneeId: userId },
      { assignerId: userId }
    ];
    if (!filter.status) {
      where.status = {
        in: ['TODO', 'IN_PROGRESS']
      };
    }
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 20
    });
    if (tasks.length === 0) return 'No matching tasks found.';
    return 'Tasks:\n' + tasks.map(t => `- ${t.title} (${t.status}, ${t.priority})`).join('\n');
  }
  return null;
}

function stripJsonFromText(text) {
  let cleaned = text.replace(/```json[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/\[[\s\S]*?\]/g, (match) => {
    try { const arr = JSON.parse(match); if (Array.isArray(arr) && arr.length && arr[0].action) return ''; } catch {}
    return match;
  });
  cleaned = cleaned.replace(/\{[\s\S]*?\}/g, (match) => {
    try { const obj = JSON.parse(match); if (obj.action) return ''; } catch {}
    return match;
  });
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

async function finalizeAiChatText(aiText, { req, userId, companyId, userTasks, sourceText }) {
  const commands = extractJsonCommands(aiText);
  if (commands.length > 0) {
    const textParts = [];
    const proposals = [];
    for (const command of commands) {
      try {
        const actionType = normalizeActionName(command.action);
        if (SUPPORTED_ACTIONS.has(actionType)) {
          const { action, ...input } = command;
          const proposal = await createAIActionPreview({
            req,
            actionType,
            input,
            sourceText,
            sourceType: 'CHAT',
            sourceMetadata: { command }
          });
          proposals.push(proposal);
          continue;
        }

        const result = await runChatCommand(command, { userId, companyId, userTasks });
        if (!result) continue;
        if (result && typeof result === 'object' && result.__type === 'task_proposal') {
          proposals.push(result);
        } else if (result && typeof result === 'object' && result.__type === 'error') {
          textParts.push(result.message);
        } else if (typeof result === 'string') {
          textParts.push(result);
        }
      } catch (err) {
        textParts.push('Error processing command.');
      }
    }
    const prose = stripJsonFromText(aiText);
    const commandOutput = textParts.join('\n');
    const combined = [prose, commandOutput].filter(Boolean).join('\n\n');
    return { text: combined, proposals };
  } else {
    if (/^\s*\{[\s\S]*\}\s*$/.test(aiText) || /^\s*\[.*\]\s*$/s.test(aiText)) {
      return { text: '', proposals: [] };
    }
    return { text: aiText, proposals: [] };
  }
}

function normalizeActionName(action) {
  const normalized = String(action || '').trim().toLowerCase();
  if (normalized === 'add_update' || normalized === 'comment_task') return 'add_comment';
  if (normalized === 'create_subtask') return 'add_subtask';
  if (normalized === 'edit_task' || normalized === 'modify_task') return 'update_task';
  if (normalized === 'edit_project' || normalized === 'modify_project') return 'update_project';
  return normalized;
}

// POST /api/ai/chat
router.post('/chat',
  validators.aiText('message'),
  handleValidationErrors,
  async (req, res) => {
    const { message, history: rawHistory } = req.body;
    const history = sanitizeChatHistory(rawHistory);

    let responded = false;

    try {
      // Get user context
      const userId = req.user.id;
      const userRole = req.user.role;
      const companyId = req.user.companyId;
      const userName = req.user.name;

      // Fetch user's recent tasks for context (only TODO and IN_PROGRESS for better AI focus)
      const userTasks = await prisma.task.findMany({
        where: {
          companyId: companyId,
          status: {
            in: ['TODO', 'IN_PROGRESS']
          },
          OR: [
            { assigneeId: userId },
            { assignerId: userId }
          ]
        },
        include: {
          assignee: { select: { name: true } },
          assigner: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });

      const systemPrompt = buildChatSystemPrompt(
        userName,
        userRole,
        req.user.company?.name || 'Unknown Company',
        userTasks
      );

      const chatModel = process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.0-flash-001';
      const openrouterRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: chatModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        stream: true,
        max_tokens: 2048,
        temperature: 0.45
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0],
          'X-Title': process.env.SITE_NAME || 'Tialz Task Manager'
        },
        responseType: 'stream'
      });

      let fullContent = '';
      let buffer = '';
      openrouterRes.data.on('data', chunk => {
        buffer += chunk.toString();
        let lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              void handleAIResponse(fullContent.trim()).catch((err) => console.error('handleAIResponse', err));
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                fullContent += content;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      });
      openrouterRes.data.on('end', () => {
        if (!responded) {
          void handleAIResponse(fullContent.trim()).catch((err) => console.error('handleAIResponse', err));
        }
      });
      openrouterRes.data.on('error', err => {
        if (!responded) {
          responded = true;
          res.status(500).json({ error: 'OpenRouter API error' });
        }
      });

      async function handleAIResponse(aiText) {
        if (responded) return;
        responded = true;
        try {
          const result = await finalizeAiChatText(aiText, {
            req,
            userId,
            companyId,
            userTasks,
            sourceText: message
          });
          const payload = { response: result.text || '' };
          if (result.proposals && result.proposals.length > 0) {
            payload.proposals = result.proposals;
          }
          return res.json(payload);
        } catch (err) {
          console.error('AI chat finalize error:', err);
          return res.status(500).json({ error: 'Failed to process AI response' });
        }
      }

    } catch (err) {
      if (!responded) {
        responded = true;
        console.error('Ollama error:', err?.response?.data || err.message);
        res.status(500).json({ error: 'AI service error' });
      }
    }
  });

// POST /api/ai/route-intent — classify user message for quick actions vs general chat (client + shared aiQuickActions)
router.post(
  '/route-intent',
  validators.aiText('message'),
  handleValidationErrors,
  async (req, res) => {
    const { message } = req.body;
    const model =
      process.env.OPENROUTER_INTENT_MODEL ||
      process.env.OPENROUTER_CHAT_MODEL ||
      'google/gemini-2.0-flash-001';

    const system = `You are a strict classifier for TIALZ task management. Given ONE user message, output ONLY valid JSON (no markdown, no explanation) with this exact shape:
{"intent":"create_task"|"add_update"|"add_subtask"|"create_project"|"chat","text":"<string>"}

Definitions:
- create_task: A new standalone task, reminder, or todo (including deadlines and assignments).
- add_update: Log progress, a note, or a status change on an EXISTING task the user refers to.
- add_subtask: Add a child task under an existing parent task.
- create_project: A multi-task initiative, project, campaign, or event that implies multiple steps or tasks.
- chat: Questions, summaries, listing tasks, greetings, general conversation, or unclear intent.

Rules:
- Prefer the most specific intent. If the user only wants one action item, use create_task, not create_project.
- If unsure, use chat.
- "text" must be the full user message to forward to tools (trimmed). You may lightly normalize wording but keep meaning.

Return only the JSON object.`;

    try {
      const openrouterRes = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: message },
          ],
          max_tokens: 256,
          temperature: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0],
            'X-Title': process.env.SITE_NAME || 'Tialz Task Manager',
          },
        }
      );

      const raw = openrouterRes.data.choices?.[0]?.message?.content?.trim() || '';
      const { intent, text } = parseRouteIntentResponse(raw, message);
      return res.json({ intent, text });
    } catch (err) {
      console.error('route-intent error:', err?.response?.data || err.message);
      return res.status(500).json({ error: 'Intent routing failed' });
    }
  }
);

// POST /api/ai/extract-task
router.post('/extract-task',
  validators.aiText('text'),
  handleValidationErrors,
  async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    try {
      // Get user context
      const userId = req.user.id;
      const companyId = req.user.companyId;
      const userName = req.user.name;

      // System prompt specifically for task extraction
      const systemPrompt = `
You are an AI assistant specialized in extracting task information from text.
Analyze the provided text and extract relevant task details. Return a JSON object with the following structure:
{
  "title": "Brief task title (max 50 characters)",
  "description": "Detailed description (max 300 characters)",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "dueDate": "YYYY-MM-DD or null if not mentioned",
  "assignee": "Person's name if mentioned, or null"
}

Guidelines:
- Extract the main action/task from the text
- Include relevant context in the description
- Determine priority based on urgency cues (ASAP, urgent, by Friday, etc.)
- If no clear deadline, set dueDate to null
- If no specific person mentioned for assignment, set assignee to null
- Be concise but informative
- If the text doesn't contain a clear task, create a reasonable interpretation

Examples:
Input: "Hi John! Can you finish the marketing report by Friday? Thanks, Sarah"
Output: {"title": "Finish marketing report", "description": "Sarah requested completion of marketing report by Friday", "priority": "HIGH", "dueDate": "2024-01-19", "assignee": "John"}

Input: "Remember to update the website homepage"
Output: {"title": "Update website homepage", "description": "Update the website homepage", "priority": "MEDIUM", "dueDate": null, "assignee": null}
`;

      // Call OpenRouter for task extraction
      const openrouterRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'arcee-ai/trinity-large-preview:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract task information from this text: "${text}"` }
        ],
        stream: true,
        max_tokens: 1000,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0],
          'X-Title': process.env.SITE_NAME || 'Tialz Task Manager'
        },
        responseType: 'stream'
      });

      let fullContent = '';
      let buffer = '';
      let responseHandled = false; // Flag to ensure only one response is sent

      await new Promise((resolve, reject) => {
        // Timeout handler
        const timeoutId = setTimeout(() => {
          if (!responseHandled) {
            responseHandled = true;
            reject(new Error('AI service timeout'));
          }
        }, 30000);

        openrouterRes.data.on('data', chunk => {
          if (responseHandled) return; // Don't process if response already handled

          buffer += chunk.toString();
          let lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  fullContent += parsed.choices[0].delta.content;
                }
              } catch (e) {
                // Skip malformed JSON
              }
              if (data === '[DONE]' && !responseHandled) {
                responseHandled = true;
                clearTimeout(timeoutId);

                try {
                  // Extract JSON from the response
                  const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    const taskData = JSON.parse(jsonMatch[0]);

                    // Validate and clean the extracted data
                    // If no due date provided, set to 7 days from now as default
                    let dueDate = taskData.dueDate;
                    if (!dueDate) {
                      const defaultDate = new Date();
                      defaultDate.setDate(defaultDate.getDate() + 7);
                      defaultDate.setHours(23, 59, 0, 0);
                      dueDate = defaultDate.toISOString().slice(0, 16);
                    }

                    const cleanedTask = {
                      title: (taskData.title || '').substring(0, 50),
                      description: (taskData.description || '').substring(0, 300),
                      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(taskData.priority) ? taskData.priority : 'MEDIUM',
                      dueDate: dueDate,
                      assignee: taskData.assignee || null
                    };

                    res.json({ success: true, taskData: cleanedTask });
                    resolve();
                  } else {
                    // Fallback: create basic task from the text with default due date (7 days from now)
                    const defaultDate = new Date();
                    defaultDate.setDate(defaultDate.getDate() + 7);
                    defaultDate.setHours(23, 59, 0, 0);

                    const fallbackTask = {
                      title: text.substring(0, 50),
                      description: `Task extracted from: ${text.substring(0, 250)}`,
                      priority: 'MEDIUM',
                      dueDate: defaultDate.toISOString().slice(0, 16),
                      assignee: null
                    };
                    res.json({ success: true, taskData: fallbackTask });
                    resolve();
                  }
                } catch (parseError) {
                  console.error('Failed to parse AI response:', parseError);
                  reject(new Error('Failed to extract task data'));
                }
              }
            }
          }
        });

        openrouterRes.data.on('error', (err) => {
          if (!responseHandled) {
            responseHandled = true;
            clearTimeout(timeoutId);
            console.error('AI service error:', err);
            reject(new Error('AI service error'));
          }
        });
      });

    } catch (err) {
      console.error('Task extraction error:', err);

      // Try to read the actual error response body from the stream
      if (err.response?.data && typeof err.response.data.read === 'function') {
        try {
          let errorBody = '';
          err.response.data.on('data', chunk => {
            errorBody += chunk.toString();
          });
          err.response.data.on('end', () => {
            console.error('OpenRouter actual error message:', errorBody);
          });
        } catch (readError) {
          console.error('Could not read error stream:', readError);
        }
      }

      console.error('OpenRouter error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        headers: err.response?.headers
      });
      return res.status(500).json({ error: 'Failed to extract task data' });
    }
  });

// POST /api/ai/identify-task-update
router.post('/identify-task-update',
  validators.aiText('text'),
  handleValidationErrors,
  async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    try {
      // Get user context
      const userId = req.user.id;
      const companyId = req.user.companyId;
      const userName = req.user.name;

      // Fetch user's recent tasks for context (only TODO and IN_PROGRESS for better AI focus)
      const userTasks = await prisma.task.findMany({
        where: {
          companyId: companyId,
          status: {
            in: ['TODO', 'IN_PROGRESS']
          },
          OR: [
            { assigneeId: userId },
            { assignerId: userId }
          ]
        },
        include: {
          assignee: { select: { name: true } },
          assigner: { select: { name: true } },
          comments: {
            select: { content: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 20
      });

      // System prompt for task update identification
      const systemPrompt = `
You are an AI assistant specialized in identifying task updates and matching them to existing tasks.
Analyze the provided text and determine which existing task it relates to, then generate an appropriate update comment.

IMPORTANT: You are only shown active tasks (TODO and IN_PROGRESS status) to help you focus on the most relevant work. This improves accuracy when there are many tasks.

Available Active Tasks:
${userTasks.map((task, idx) => `
Task #${task.id}: "${task.title}"
- Description: ${task.description || 'No description'}
- Status: ${task.status}
- Priority: ${task.priority}
- Assigned to: ${task.assignee?.name}
- Recent comments: ${task.comments.map(c => `"${c.content}"`).join(', ') || 'None'}
`).join('\n')}

Return a JSON object with this structure:
{
  "taskFound": true/false,
  "taskId": number or null,
  "confidence": 0.0-1.0,
  "updateType": "progress|completion|issue|info|status_change|meeting|deadline",
  "updateContent": "The comment to add to the task",
  "suggestedActions": ["change_status", "change_priority", "add_subtask", etc.],
  "reasoning": "Why this text matches the identified task"
}

Guidelines:
- Match based on keywords, context, people mentioned, project names, deadlines
- If no clear match (confidence < 0.6), set taskFound to false
- Generate natural, professional update comments
- Identify the type of update (progress, completion, issue, etc.)
- Suggest relevant actions based on the update content
- Include specific details from the text in the update
- For completion updates, be extra careful to match the right task and provide clear completion details

Examples:
Input: "Hi John, the marketing report is 80% complete. Should be done by Friday."
Output: {"taskFound": true, "taskId": 123, "confidence": 0.9, "updateType": "progress", "updateContent": "Progress update: Marketing report is 80% complete and on track for Friday completion.", "suggestedActions": ["change_status"], "reasoning": "Matches marketing report task based on title and mentions John who is the assignee"}

Input: "The server deployment failed due to configuration issues. Need to troubleshoot."
Output: {"taskFound": true, "taskId": 456, "confidence": 0.85, "updateType": "issue", "updateContent": "Issue reported: Server deployment failed due to configuration issues. Troubleshooting required.", "suggestedActions": ["change_priority", "add_subtask"], "reasoning": "Matches server deployment task, indicates a blocking issue"}

Input: "Finished the website redesign. All pages updated and tested successfully."
Output: {"taskFound": true, "taskId": 789, "confidence": 0.95, "updateType": "completion", "updateContent": "Task completed: Website redesign finished. All pages updated and tested successfully.", "suggestedActions": ["change_status"], "reasoning": "Matches website redesign task, indicates successful completion"}
`;

      // Call OpenRouter for task update identification
      const openrouterRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'arcee-ai/trinity-large-preview:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this text for task updates: "${text}"` }
        ],
        stream: true,
        max_tokens: 1000,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0],
          'X-Title': process.env.SITE_NAME || 'Tialz Task Manager'
        },
        responseType: 'stream'
      });

      let fullContent = '';
      let buffer = '';
      let responseHandled = false;

      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (!responseHandled) {
            responseHandled = true;
            reject(new Error('AI service timeout'));
          }
        }, 30000);

        openrouterRes.data.on('data', chunk => {
          if (responseHandled) return;

          buffer += chunk.toString();
          let lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  fullContent += parsed.choices[0].delta.content;
                }
              } catch (e) {
                // Skip malformed JSON
              }
              if (data === '[DONE]' && !responseHandled) {
                responseHandled = true;
                clearTimeout(timeoutId);

                try {
                  // Extract JSON from the response
                  const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    const updateData = JSON.parse(jsonMatch[0]);

                    // Validate the response
                    const validatedUpdate = {
                      taskFound: updateData.taskFound || false,
                      taskId: updateData.taskId || null,
                      confidence: Math.min(Math.max(updateData.confidence || 0, 0), 1),
                      updateType: updateData.updateType || 'info',
                      updateContent: (updateData.updateContent || '').substring(0, 500),
                      suggestedActions: Array.isArray(updateData.suggestedActions) ? updateData.suggestedActions : [],
                      reasoning: (updateData.reasoning || '').substring(0, 200),
                      originalText: text
                    };

                    // Verify task exists and user has access
                    if (validatedUpdate.taskFound && validatedUpdate.taskId) {
                      const task = userTasks.find(t => t.id === validatedUpdate.taskId);
                      if (!task) {
                        validatedUpdate.taskFound = false;
                        validatedUpdate.taskId = null;
                        validatedUpdate.reasoning = 'Task not found in user accessible tasks';
                      }
                    }

                    res.json({ success: true, updateData: validatedUpdate });
                    resolve();
                  } else {
                    // Fallback: no task found
                    const fallbackUpdate = {
                      taskFound: false,
                      taskId: null,
                      confidence: 0,
                      updateType: 'info',
                      updateContent: `Update from external source: ${text.substring(0, 300)}`,
                      suggestedActions: ['create_new_task'],
                      reasoning: 'No matching task found for this update',
                      originalText: text
                    };
                    res.json({ success: true, updateData: fallbackUpdate });
                    resolve();
                  }
                } catch (parseError) {
                  console.error('Failed to parse AI response:', parseError);
                  reject(new Error('Failed to identify task update'));
                }
              }
            }
          }
        });

        openrouterRes.data.on('error', (err) => {
          if (!responseHandled) {
            responseHandled = true;
            clearTimeout(timeoutId);
            console.error('AI service error:', err);
            reject(new Error('AI service error'));
          }
        });
      });

    } catch (err) {
      console.error('Task update identification error:', err);
      return res.status(500).json({ error: 'Failed to identify task update' });
    }
  });

// POST /api/ai/suggest-project-ideas
router.post('/suggest-project-ideas',
  validators.aiText('text'),
  handleValidationErrors,
  async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;
      const userName = req.user.name;

      // Context-aware system prompt for AI to generate 6 unique project/event ideas
      const systemPrompt = `You are an AI assistant that generates relevant project or event ideas from text.

CRITICAL RULE: First determine if the text is about a PERSONAL EVENT or CORPORATE/TECHNICAL PROJECT.

PERSONAL EVENT indicators:
- Social gatherings (movie night, BBQ, birthday party, hangout, dinner party)
- Casual invitations ("want to hang out", "come over", "let's get together")
- Personal activities (vacation planning, home improvement, personal goals)
- Informal language, friendly tone

CORPORATE/TECHNICAL indicators:
- Building software, apps, platforms, systems
- Technical terms (API, database, backend, frontend, integration)
- Business initiatives, professional work
- Formal business language

FOR PERSONAL EVENTS - Generate ideas about ORGANIZING THE EVENT:
✅ CORRECT format: "Organize a movie night", "Plan Friday movie night", "Coordinate movie selection"
✅ CORRECT descriptions: "Plan and organize a casual movie night with friends"
❌ WRONG format: "Movie Night Scheduler App", "Collaborative Movie Lister Tool", "Movie Night Bot"
❌ WRONG descriptions: "App to poll availability", "Tool for friends to suggest", "Bot to integrate"

FOR CORPORATE/TECHNICAL - Generate ideas about BUILDING PROJECTS:
✅ CORRECT: "Create backend for React app", "API Integration Project", "Database Migration System"

EXAMPLES:

Input: "Hey, want to do a movie night Friday?"
✅ CORRECT suggestions:
- "Organize a movie night"
- "Plan Friday movie night"
- "Coordinate movie selection"
- "Organize movie snacks"
- "Plan movie night setup"
- "Coordinate movie night timing"

❌ WRONG suggestions (DO NOT GENERATE THESE):
- "Movie Night Scheduler App"
- "Collaborative Movie Lister Tool"
- "Movie Night Food Order Bot"

Input: "Create a backend API for our React app"
✅ CORRECT suggestions:
- "Create backend for React app"
- "API Integration Project"
- "Database schema design"

Return ONLY a JSON array with 6 ideas:
[
  {
    "id": "unique_id_1",
    "name": "Project or Event Name (NO apps/tools/bots for personal events!)",
    "description": "Brief description (max 100 chars, about the event/activity, NOT about building software)",
    "icon": "🎯",
    "color": "#3b82f6",
    "relevanceScore": 0.95
  },
  ...
]

STRICT RULES:
- For personal events: Names should be like "Organize X", "Plan X", "Coordinate X" - NEVER "X App", "X Tool", "X Bot", "X Platform", "X Manager", "X System"
- Descriptions should be about organizing/planning the event, NOT about building software
- If you see words like "app", "tool", "bot", "platform", "manager", "system" in your suggestions for personal events, you're doing it WRONG
- relevanceScore: 0.0-1.0 (1.0 = perfect match)
- Sort by relevanceScore (highest first)
- Use appropriate emoji icons
- Use hex colors: #3b82f6, #10b981, #f59e0b, #ec4899, #8b5cf6, #06b6d4`;

      // Context-aware API call: analyze text context and generate appropriate suggestions
      const openrouterRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'arcee-ai/trinity-large-preview:free',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user', content: `Analyze this text and generate 6 context-appropriate project or event ideas.

CRITICAL: Is this a PERSONAL EVENT or CORPORATE/TECHNICAL?

If PERSONAL EVENT (movie night, BBQ, birthday, hangout, casual invitation):
- Generate ideas like: "Organize a movie night", "Plan Friday movie night", "Coordinate movie selection"
- DO NOT generate: "Movie Night Scheduler App", "Movie Lister Tool", "Movie Bot", "Movie Platform", "Movie Manager"
- Focus on organizing/planning the event itself, NOT building software

If TECHNICAL/CORPORATE (building software, APIs, databases):
- Generate ideas like: "Create backend for React app", "API Integration Project"

Text: "${text.substring(0, 500)}"

Remember: For personal events, suggest ORGANIZING the event, NOT building apps/tools/bots/platforms to manage it.` }
        ],
        temperature: 0.4, // Slightly higher for more creative context interpretation
        max_tokens: 1000   // Increased for better context analysis
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = openrouterRes.data.choices[0].message.content;

      // Extract JSON array from response
      let suggestions = [];
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found');
        }
      } catch (parseError) {
        console.warn('Failed to parse AI response, using fallback:', parseError);
        // Fallback: Generate simple ideas from text keywords
        const keywords = text.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 6);
        const fallbackIcons = ['🎯', '📋', '🚀', '💡', '⚡', '🎨'];
        const fallbackColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

        suggestions = keywords.map((keyword, idx) => ({
          id: `fallback_${idx + 1}`,
          name: keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' Project',
          description: `Project related to ${keyword}`,
          icon: fallbackIcons[idx] || '📋',
          color: fallbackColors[idx] || '#3b82f6',
          relevanceScore: 0.7 - (idx * 0.1)
        }));
      }

      // Ensure we have exactly 6 suggestions
      const finalSuggestions = suggestions.slice(0, 6).map((suggestion, idx) => {
        // Validate and sanitize
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
        return {
          id: suggestion.id || `idea_${idx + 1}`,
          name: (suggestion.name || `Project Idea ${idx + 1}`).substring(0, 50),
          description: (suggestion.description || 'A project idea').substring(0, 100),
          icon: suggestion.icon || '📋',
          color: suggestion.color || colors[idx % colors.length],
          relevanceScore: Math.min(Math.max(suggestion.relevanceScore || 0.5, 0), 1)
        };
      });

      // Fill remaining slots if needed
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
      const icons = ['🎯', '📋', '🚀', '💡', '⚡', '🎨'];
      while (finalSuggestions.length < 6) {
        finalSuggestions.push({
          id: `idea_${finalSuggestions.length + 1}`,
          name: `Project Idea ${finalSuggestions.length + 1}`,
          description: 'A project idea based on your text',
          icon: icons[finalSuggestions.length] || '📋',
          color: colors[finalSuggestions.length] || '#3b82f6',
          relevanceScore: 0.5 - (finalSuggestions.length * 0.05)
        });
      }

      res.json({
        success: true,
        ideas: finalSuggestions.slice(0, 6)
      });

    } catch (err) {
      console.error('Project ideas suggestion error:', err);
      // Fallback: Return generic ideas
      const fallbackIcons = ['🎯', '📋', '🚀', '💡', '⚡', '🎨'];
      const fallbackColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
      const fallbackIdeas = Array.from({ length: 6 }, (_, idx) => ({
        id: `fallback_${idx + 1}`,
        name: `Project Idea ${idx + 1}`,
        description: 'A project idea based on your text',
        icon: fallbackIcons[idx],
        color: fallbackColors[idx],
        relevanceScore: 0.5 - (idx * 0.05)
      }));

      res.json({
        success: true,
        ideas: fallbackIdeas
      });
    }
  });

// POST /api/ai/create-project-from-idea
router.post('/create-project-from-idea',
  // Debug: Log raw request before validation
  (req, res, next) => {
    console.log('🚀 Raw create-project-from-idea request:', {
      body: req.body,
      textLength: req.body.text?.length || 0,
      selectedIdea: req.body.selectedIdea,
      selectedIdeaType: typeof req.body.selectedIdea,
      selectedIdeaId: req.body.selectedIdea?.id,
      selectedIdeaIdType: typeof req.body.selectedIdea?.id
    });
    next();
  },
  validators.aiText('text'),
  body('selectedIdea')
    .isObject()
    .withMessage('selectedIdea must be an object')
    .custom((value) => {
      if (!value || typeof value !== 'object') {
        throw new Error('selectedIdea must be an object');
      }
      // Check if id exists (allowing strings, numbers, or 0)
      if (value.id === undefined || value.id === null || value.id === '') {
        throw new Error('selectedIdea.id is required');
      }
      // ID can be string (like 'project_idea_1') or number
      if (typeof value.id !== 'string' && typeof value.id !== 'number') {
        throw new Error('selectedIdea.id must be a string or number');
      }
      return true;
    }),
  body('projectName')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      return value ? String(value).trim() : value;
    })
    .custom((value) => {
      if (!value) return true; // Allow null/empty
      if (value.length > 200) {
        throw new Error('Project name must be less than 200 characters');
      }
      return true;
    }),
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => {
      return value ? String(value).trim() : value;
    })
    .custom((value) => {
      if (!value) return true; // Allow null/empty
      // Check if it's a valid ISO 8601 date
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Due date must be a valid ISO 8601 date');
      }
      return true;
    }),
  handleValidationErrors,
  async (req, res) => {
    const { text, selectedIdea, projectName, dueDate } = req.body;

    if (!text || !selectedIdea || !selectedIdea.id) {
      return res.status(400).json({ error: 'Text and selectedIdea are required' });
    }

    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;
      const userName = req.user.name;

      // Use selected idea data (AI-generated or fallback)
      const ideaName = selectedIdea.name || 'Project';
      const ideaDescription = selectedIdea.description || '';
      const ideaIcon = selectedIdea.icon || '📋';
      const ideaColor = selectedIdea.color || '#3b82f6';

      // Parse project due date if provided
      let projectDueDateForAI = null;
      if (dueDate) {
        try {
          const parsed = new Date(dueDate);
          if (!isNaN(parsed.getTime())) {
            projectDueDateForAI = parsed.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        } catch (e) {
          // Ignore invalid dates
        }
      }

      // Optimized system prompt for AI to generate project with tasks
      const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const systemPrompt = `You are an AI assistant that creates projects with tasks from ideas.

Selected Project Idea: ${ideaName}
Idea Description: ${ideaDescription}

User's Original Text: "${text}"
Today's Date: ${todayStr}
${projectDueDateForAI ? `Project Due Date: ${projectDueDateForAI} (MUST be after ${todayStr}, and ALL task dates must be BETWEEN ${todayStr} and ${projectDueDateForAI})` : 'No project due date specified - you must set a projectDueDate that is in the future'}

Generate a complete project with EXACTLY 17-23 actionable tasks (aim for 19-21 tasks) based on the idea and text.

Return ONLY a JSON object:
{
  "projectName": "Specific project name (extract from text or use idea name)",
  "projectDescription": "Detailed description (2-3 sentences, max 200 chars)",
  "tasks": [
    {
      "title": "Task title (max 60 chars, actionable)",
      "description": "Task details (max 150 chars) or null",
      "priority": "HIGH|MEDIUM|LOW|URGENT",
      "dueDate": "YYYY-MM-DD or null"
    }
  ],
  "projectDueDate": "YYYY-MM-DD or null"
}

Guidelines:
- Generate EXACTLY 17-23 tasks (aim for 19-21 tasks)
- Tasks should be specific, actionable, and ordered logically
- Extract dates from text (e.g., "by Friday" = calculate date, "March 15th" = 2026-03-15). Always use the current year (2026) when dates don't include a year.
- CRITICAL: Project due date MUST be in the future (after today's date: ${new Date().toISOString().split('T')[0]})
- CRITICAL: All task due dates MUST be in the future AND before the project due date
- CRITICAL: Task dates must be between today (${new Date().toISOString().split('T')[0]}) and the project due date (${projectDueDateForAI || 'N/A'})
- If project due date is provided, distribute task dates evenly between today and the project due date, with earlier tasks having earlier dates
- Set priority based on urgency cues in text
- Make tasks relevant to the idea and text context
- If no dates in text, set dueDate to null
- Break down the project into detailed phases with multiple tasks per phase
- Return dates in YYYY-MM-DD format only (no time component)`;

      // Optimized API call
      const openrouterRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'arcee-ai/trinity-large-preview:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create project "${ideaName}" from: "${text.substring(0, 500)}"` }
        ],
        temperature: 0.3, // Lower for faster, more consistent responses
        max_tokens: 3500  // Increased to accommodate 17-20 tasks
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = openrouterRes.data.choices[0].message.content;

      // Extract JSON from response
      let projectData = null;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          projectData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON object found');
        }
      } catch (parseError) {
        console.warn('Failed to parse AI response, using fallback:', parseError);
        // Fallback: Generate basic project with default tasks (17-20 tasks)
        projectData = {
          projectName: projectName || ideaName,
          projectDescription: ideaDescription || 'A project based on your idea',
          tasks: [
            { title: 'Define project scope and objectives', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Conduct initial research and analysis', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Create project timeline and milestones', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Identify required resources and budget', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Assemble project team and assign roles', description: null, priority: 'MEDIUM', dueDate: null },
            { title: 'Set up project management tools and systems', description: null, priority: 'MEDIUM', dueDate: null },
            { title: 'Develop detailed project plan', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Create initial project documentation', description: null, priority: 'MEDIUM', dueDate: null },
            { title: 'Conduct kickoff meeting with stakeholders', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Begin project execution phase', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Monitor progress and track milestones', description: null, priority: 'MEDIUM', dueDate: null },
            { title: 'Address any issues or blockers', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Conduct regular status reviews', description: null, priority: 'MEDIUM', dueDate: null },
            { title: 'Update project documentation as needed', description: null, priority: 'LOW', dueDate: null },
            { title: 'Review and refine project deliverables', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Conduct quality assurance checks', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Prepare final project deliverables', description: null, priority: 'HIGH', dueDate: null },
            { title: 'Conduct project review and lessons learned', description: null, priority: 'MEDIUM', dueDate: null },
            { title: 'Complete project documentation', description: null, priority: 'MEDIUM', dueDate: null },
            { title: 'Finalize and close project', description: null, priority: 'HIGH', dueDate: null }
          ],
          projectDueDate: dueDate || null
        };
      }

      // Parse dates
      let projectDueDateObj = null;
      const now = new Date();
      const currentYear = now.getFullYear();

      // Helper function to fix date if it's in the past - ensures date is in the future
      const fixDateToFuture = (dateStr) => {
        if (!dateStr) return null;
        try {
          const parsed = parseLocalDate(dateStr);
          if (isNaN(parsed.getTime())) {
            return null;
          }

          // If date is in the past, move it to the future
          if (parsed <= now) {
            // If it's a date-only format (YYYY-MM-DD), try to fix the year first
            if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
              const [year, month, day] = dateStr.split('-').map(Number);
              // Try current year first
              parsed.setFullYear(currentYear, month - 1, day);
              if (parsed <= now) {
                // If still in the past, use next year
                parsed.setFullYear(currentYear + 1, month - 1, day);
              }
            } else {
              // For other formats, add enough days to make it future
              const daysToAdd = Math.ceil((now - parsed) / (1000 * 60 * 60 * 24)) + 1;
              parsed.setDate(parsed.getDate() + daysToAdd);
            }
          }

          // Set to end of day
          parsed.setHours(23, 59, 0, 0);
          return parsed;
        } catch (e) {
          return null;
        }
      };

      if (projectData.projectDueDate) {
        projectDueDateObj = fixDateToFuture(projectData.projectDueDate);
      }
      if (dueDate && !projectDueDateObj) {
        projectDueDateObj = fixDateToFuture(dueDate);
      }

      // Default to 7 days after current date if no due date found
      if (!projectDueDateObj) {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        defaultDate.setHours(23, 59, 0, 0);
        projectDueDateObj = defaultDate;
      }

      // Final validation: ensure project due date is in the future
      if (projectDueDateObj <= now) {
        // Force to 7 days from now
        projectDueDateObj = new Date();
        projectDueDateObj.setDate(projectDueDateObj.getDate() + 7);
        projectDueDateObj.setHours(23, 59, 0, 0);
      }

      // Ensure the date is valid
      if (isNaN(projectDueDateObj.getTime())) {
        // Fallback: 7 days from now
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 7);
        fallbackDate.setHours(23, 59, 0, 0);
        projectDueDateObj = fallbackDate;
      }

      // Validate tasks array
      if (!Array.isArray(projectData.tasks) || projectData.tasks.length === 0) {
        // Fallback tasks if AI didn't generate any (17-20 tasks)
        projectData.tasks = [
          { title: 'Define project scope and objectives', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Conduct initial research and analysis', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Create project timeline and milestones', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Identify required resources and budget', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Assemble project team and assign roles', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Set up project management tools and systems', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Develop detailed project plan', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Create initial project documentation', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Conduct kickoff meeting with stakeholders', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Begin project execution phase', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Monitor progress and track milestones', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Address any issues or blockers', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Conduct regular status reviews', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Update project documentation as needed', description: null, priority: 'LOW', dueDate: null },
          { title: 'Review and refine project deliverables', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Conduct quality assurance checks', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Prepare final project deliverables', description: null, priority: 'HIGH', dueDate: null },
          { title: 'Conduct project review and lessons learned', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Complete project documentation', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Finalize and close project', description: null, priority: 'HIGH', dueDate: null }
        ];
      }

      // Ensure we have 17-23 tasks (prefer 19-21)
      let tasksToCreate = projectData.tasks;
      if (tasksToCreate.length < 17) {
        // If AI generated fewer than 17, pad with generic tasks
        const additionalTasks = [
          { title: 'Review project progress', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Update stakeholders on status', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Refine project approach', description: null, priority: 'MEDIUM', dueDate: null },
          { title: 'Optimize workflow processes', description: null, priority: 'LOW', dueDate: null },
          { title: 'Document lessons learned', description: null, priority: 'LOW', dueDate: null },
          { title: 'Plan next phase activities', description: null, priority: 'MEDIUM', dueDate: null }
        ];
        tasksToCreate = [...tasksToCreate, ...additionalTasks.slice(0, 17 - tasksToCreate.length)];
      } else if (tasksToCreate.length > 23) {
        // Limit to 23 max
        tasksToCreate = tasksToCreate.slice(0, 23);
      }

      // Create project
      const project = await prisma.project.create({
        data: {
          name: projectName || projectData.projectName || ideaName,
          description: (projectData.projectDescription || ideaDescription).substring(0, 500),
          color: ideaColor,
          icon: ideaIcon,
          dueDate: projectDueDateObj,
          ownerId: userId,
          companyId,
          tasks: {
            create: tasksToCreate.map((task, index) => {
              let taskDueDate = null;
              if (task.dueDate) {
                try {
                  // Parse date using parseLocalDate for proper handling
                  const dateStr = task.dueDate.split('T')[0]; // Remove time if present
                  const parsed = parseLocalDate(dateStr);

                  if (!isNaN(parsed.getTime())) {
                    // Set to end of day
                    parsed.setHours(23, 59, 0, 0);

                    // CRITICAL: Task date must be between today and project due date
                    // If task date is in the past, set it to tomorrow (minimum)
                    if (parsed <= now) {
                      // Set to tomorrow at 11:59 PM
                      parsed.setTime(now.getTime());
                      parsed.setDate(parsed.getDate() + 1);
                      parsed.setHours(23, 59, 0, 0);
                    }

                    // CRITICAL: Task date must be between today and project due date
                    // First, ensure it's in the future (already done above)
                    // Then, ensure it's before project due date
                    if (projectDueDateObj && parsed >= projectDueDateObj) {
                      // If task date is on or after project date, set it to 1 day before project date
                      const adjustedDate = new Date(projectDueDateObj);
                      adjustedDate.setDate(adjustedDate.getDate() - 1);
                      adjustedDate.setHours(23, 59, 0, 0);
                      // Ensure it's still in the future and before project due date
                      if (adjustedDate <= now) {
                        // If 1 day before project is still in the past, calculate a date between now and project
                        // Use a date that's 1/4 of the way from now to project due date
                        const daysDiff = Math.ceil((projectDueDateObj - now) / (1000 * 60 * 60 * 24));
                        if (daysDiff > 1) {
                          adjustedDate.setTime(now.getTime());
                          adjustedDate.setDate(adjustedDate.getDate() + Math.max(1, Math.floor(daysDiff / 4)));
                          adjustedDate.setHours(23, 59, 0, 0);
                        } else {
                          // If project is too soon, use tomorrow (but this shouldn't happen if validation is correct)
                          adjustedDate.setTime(now.getTime());
                          adjustedDate.setDate(adjustedDate.getDate() + 1);
                          adjustedDate.setHours(23, 59, 0, 0);
                        }
                      }
                      // Final check: ensure adjusted date is before project due date
                      if (adjustedDate >= projectDueDateObj) {
                        // If still not before project, use 1 day before project
                        adjustedDate.setTime(projectDueDateObj.getTime());
                        adjustedDate.setDate(adjustedDate.getDate() - 1);
                        adjustedDate.setHours(23, 59, 0, 0);
                      }
                      taskDueDate = adjustedDate;
                    } else {
                      // Task date is valid (in future and before project due date)
                      taskDueDate = parsed;
                    }
                  } else {
                    taskDueDate = null;
                  }
                } catch (e) {
                  taskDueDate = null;
                }
              }

              return {
                title: (task.title || `Task ${index + 1}`).substring(0, 200),
                description: task.description ? task.description.substring(0, 1000) : null,
                priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(task.priority)
                  ? task.priority
                  : 'MEDIUM',
                status: 'TODO',
                assignerId: userId,
                assigneeId: userId, // Default to self-assignment
                companyId,
                isDraft: true,
                dueDate: taskDueDate
              };
            })
          }
        },
        include: {
          tasks: true,
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PROJECT_CREATED',
          entityType: 'Project',
          entityId: project.id,
          description: `Created project "${project.name}" from AI-generated idea`,
          userId,
          companyId,
          metadata: {
            projectName: project.name,
            ideaName: ideaName,
            aiGenerated: true,
            taskCount: tasksToCreate.length
          }
        }
      });

      res.json({
        success: true,
        project: project
      });

    } catch (err) {
      console.error('Create project from idea error:', err);

      // Provide more specific error message for date validation errors
      if (err.message && (err.message.includes('due date') || err.message.includes('date') || err.message.includes('future'))) {
        res.status(400).json({ error: 'Failed to create project. Please ensure all your due dates are in the future.' });
      } else {
        res.status(500).json({ error: 'Failed to create project from idea' });
      }
    }
  });

module.exports = router; 