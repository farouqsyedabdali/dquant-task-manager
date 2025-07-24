const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

// Apply authentication middleware to all AI routes
router.use(auth);

// Helper: Try to extract JSON command(s) from AI response
function extractJsonCommands(text) {
  // Remove code block markers (``` or ```json)
  let cleaned = text.replace(/```json|```/g, '').trim();
  // Try to match an array of JSON objects or a single object
  const arrayMatch = cleaned.match(/\[.*?\]/s);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {}
  }
  const objMatches = [...cleaned.matchAll(/\{[\s\S]*?\}/g)];
  if (objMatches.length > 0) {
    return objMatches.map(m => {
      try { return JSON.parse(m[0]); } catch { return null; }
    }).filter(Boolean);
  }
  return [];
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let responded = false;

  try {
    // Get user context
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;
    const userName = req.user.name;

    // Fetch user's recent tasks for context
    const userTasks = await prisma.task.findMany({
      where: {
        companyId: companyId,
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

    // System prompt for AI
    const systemPrompt = `
You are an AI assistant for a task management system.
If the user asks you to create, delete, update, or list tasks, output a JSON command (or an array of commands) in this format (on a new line):
{ "action": "create_task", "title": "...", "assignee": "...", "description": "...", "priority": "..." }
{ "action": "delete_task", "title": "..." }
{ "action": "update_task", "title": "...", "status": "...", "priority": "..." }
{ "action": "list_tasks", "filter": { "status": "...", "priority": "...", "assignee": "..." } }
- For multiple actions, output an array of JSON commands.
- For references like "last task you created" or "second task in my list", use the user's recent tasks (provided below) and include the resolved title in the command.
- Otherwise, just answer normally.

Current User Context:
- Name: ${userName}
- Role: ${userRole}
- Company: ${req.user.company?.name || 'Unknown Company'}

Recent Tasks (${userTasks.length}):
${userTasks.map((task, idx) => `#${idx+1}: ${task.title} (${task.status}, ${task.priority} priority, assigned to ${task.assignee?.name || 'unassigned'})`).join('\n')}
`;

    // Stream from Ollama local server with context
    const ollamaRes = await axios.post('http://localhost:11434/api/chat', {
      model: 'gemma3',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    }, { responseType: 'stream' });

    let fullContent = '';
    let buffer = '';
    ollamaRes.data.on('data', chunk => {
      buffer += chunk.toString();
      let lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message && typeof data.message.content === 'string') {
            fullContent += data.message.content;
          }
          if (data.done) {
            handleAIResponse(fullContent.trim());
          }
        } catch (e) {}
      }
    });
    ollamaRes.data.on('end', () => {
      if (!responded) {
        handleAIResponse(fullContent.trim());
      }
    });
    ollamaRes.data.on('error', err => {
      if (!responded) {
        responded = true;
        res.status(500).json({ error: 'AI service error' });
      }
    });

    // Handle AI response: check for JSON command and execute if needed
    async function handleAIResponse(aiText) {
      if (responded) return;
      responded = true;
      // Multi-action support: parse array or single command
      const commands = extractJsonCommands(aiText);
      if (commands.length > 0) {
        let results = [];
        for (const command of commands) {
          try {
            const result = await handleSingleCommand(command);
            if (result) results.push(result);
          } catch (err) {
            results.push('⚠️ Error processing command.');
          }
        }
        // If all results are from list_tasks, join and return only those (suppress JSON)
        if (results.length > 0 && results.every(r => typeof r === 'string' && (r.startsWith('Tasks:') || r.startsWith('No matching tasks found.')))) {
          return res.json({ response: results.join('\n') });
        }
        // Otherwise, join all results (for create/delete/update, etc.)
        return res.json({ response: results.join('\n') });
      } else {
        // If the AI's response is just a JSON command (code block), suppress it
        if (/^\s*\{[\s\S]*\}\s*$/.test(aiText) || /^\s*\[.*\]\s*$/s.test(aiText)) {
          return res.json({ response: '' });
        }
        // No command, just return the AI's response
        return res.json({ response: aiText });
      }
    }

    // Handle a single command (create, delete, update, list)
    async function handleSingleCommand(command) {
      if (command.action === 'create_task') {
        // Find assignee by name (if provided)
        let assigneeId = null;
        if (command.assignee) {
          const assignee = await prisma.user.findFirst({
            where: {
              name: { equals: command.assignee, mode: 'insensitive' },
              companyId: companyId
            }
          });
          if (assignee) assigneeId = assignee.id;
        }
        // Validate priority
        const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        let priority = 'MEDIUM';
        if (command.priority && typeof command.priority === 'string') {
          const upper = command.priority.trim().toUpperCase();
          if (allowedPriorities.includes(upper)) {
            priority = upper;
          }
        }
        // Create the task
        const newTask = await prisma.task.create({
          data: {
            title: command.title || 'Untitled Task',
            description: command.description || '',
            priority,
            assignerId: userId,
            assigneeId: assigneeId || userId,
            companyId
          }
        });
        return `✅ Task "${newTask.title}" created${assigneeId ? ` and assigned to ${command.assignee}` : ''}.`;
      } else if (command.action === 'delete_task') {
        // Find the task by title
        const task = await prisma.task.findFirst({
          where: {
            title: { equals: command.title, mode: 'insensitive' },
            companyId: companyId
          }
        });
        if (task) {
          await prisma.task.delete({ where: { id: task.id } });
          return `🗑️ Task "${task.title}" deleted.`;
        } else {
          return `⚠️ Task "${command.title}" not found.`;
        }
      } else if (command.action === 'update_task') {
        // Reference resolution: support "last task", "second task", etc.
        let title = command.title;
        if (title && title.toLowerCase().includes('last task')) {
          if (userTasks.length > 0) title = userTasks[0].title;
        } else if (title && title.toLowerCase().includes('second task')) {
          if (userTasks.length > 1) title = userTasks[1].title;
        }
        // Find the task by title
        const task = await prisma.task.findFirst({
          where: {
            title: { equals: title, mode: 'insensitive' },
            companyId: companyId
          }
        });
        if (task) {
          const updateData = {};
          if (command.status) {
            const allowedStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
            const status = command.status.trim().toUpperCase();
            if (allowedStatuses.includes(status)) updateData.status = status;
          }
          if (command.priority) {
            const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
            const priority = command.priority.trim().toUpperCase();
            if (allowedPriorities.includes(priority)) updateData.priority = priority;
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.task.update({ where: { id: task.id }, data: updateData });
            return `✏️ Task "${task.title}" updated${updateData.status ? ` (status: ${updateData.status})` : ''}${updateData.priority ? ` (priority: ${updateData.priority})` : ''}.`;
          } else {
            return `⚠️ No valid fields to update for task "${task.title}".`;
          }
        } else {
          return `⚠️ Task "${title}" not found.`;
        }
      } else if (command.action === 'list_tasks') {
        // List or summarize tasks with filters
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
              companyId
            }
          });
          if (assignee) where.assigneeId = assignee.id;
        }
        // Only show tasks user can see
        where.OR = [
          { assigneeId: userId },
          { assignerId: userId }
        ];
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
  } catch (err) {
    if (!responded) {
      responded = true;
      console.error('Ollama error:', err?.response?.data || err.message);
      res.status(500).json({ error: 'AI service error' });
    }
  }
});

module.exports = router; 