const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

// Apply authentication middleware to all AI routes
router.use(auth);

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Get user context
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

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
        assignee: {
          select: { name: true }
        },
        assigner: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10 // Get last 10 tasks
    });

    // Create context-aware prompt
    const userContext = `
You are an AI assistant for a task management system. 

Current User Context:
- Name: ${req.user.name}
- Role: ${userRole}
- Company: ${req.user.company?.name || 'Unknown Company'}

Recent Tasks (${userTasks.length}):
${userTasks.map(task => `- ${task.title} (${task.status}, ${task.priority} priority, assigned to ${task.assignee?.name || 'unassigned'})`).join('\n')}

Instructions:
- Be helpful and professional
- You can help with task creation, management, and analysis
- If asked to create tasks, provide specific details
- If asked about tasks, reference the user's actual tasks
- Keep responses concise but informative

User Message: ${message}
`;

    // Stream from Ollama local server with context
    const ollamaRes = await axios.post('http://localhost:11434/api/chat', {
      model: 'gemma3',
      messages: [
        { role: 'system', content: userContext }
      ]
    }, { responseType: 'stream' });

    let fullContent = '';
    let buffer = '';
    ollamaRes.data.on('data', chunk => {
      buffer += chunk.toString();
      let lines = buffer.split('\n');
      buffer = lines.pop(); // last line may be incomplete
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message && typeof data.message.content === 'string') {
            fullContent += data.message.content;
          }
          if (data.done) {
            res.json({ response: fullContent.trim() });
          }
        } catch (e) {
          // Ignore JSON parse errors for incomplete lines
        }
      }
    });
    ollamaRes.data.on('end', () => {
      if (!res.headersSent) {
        res.json({ response: fullContent.trim() });
      }
    });
    ollamaRes.data.on('error', err => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'AI service error' });
      }
    });
  } catch (err) {
    console.error('Ollama error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'AI service error' });
  }
});

module.exports = router; 