const express = require('express');
const axios = require('axios');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

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

    // System prompt for AI (now includes due date awareness and focuses on active tasks)
    const systemPrompt = `
You are an AI assistant for a task management system.
If the user asks you to create, delete, update, or list tasks, output a JSON command (or an array of commands) in this format (on a new line):
{ "action": "create_task", "title": "...", "assignee": "...", "description": "...", "priority": "...", "dueDate": "YYYY-MM-DD or YYYY-MM-DDTHH:mm" }
{ "action": "delete_task", "title": "..." }
{ "action": "update_task", "title": "...", "status": "...", "priority": "...", "dueDate": "YYYY-MM-DD or YYYY-MM-DDTHH:mm" }
{ "action": "list_tasks", "filter": { "status": "...", "priority": "...", "assignee": "..." } }
- For multiple actions, output an array of JSON commands.
- Parse natural language dates (e.g., "by Friday", "EOD tomorrow", "next Monday 3pm") and convert to ISO-like format (YYYY-MM-DD or YYYY-MM-DDTHH:mm) in the dueDate field when applicable.
- For references like "last task you created" or "second task in my list", use the user's recent tasks (provided below) and include the resolved title in the command.
- IMPORTANT: You are only shown active tasks (TODO and IN_PROGRESS status) to help you focus on the most relevant work. This improves accuracy when there are many tasks.
- Otherwise, just answer normally.

Current User Context:
- Name: ${userName}
- Role: ${userRole}
- Company: ${req.user.company?.name || 'Unknown Company'}

Active Tasks (${userTasks.length} - TODO and IN_PROGRESS only):
${userTasks.map((task, idx) => `#${idx+1}: ${task.title} (${task.status}, ${task.priority} priority, assigned to ${task.assignee?.name || 'unassigned'})`).join('\n')}
`;

    // Stream from OpenRouter API with Gemma 3 27B
    const openrouterRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'google/gemma-3-27b-it:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
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
            handleAIResponse(fullContent.trim());
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
        handleAIResponse(fullContent.trim());
      }
    });
    openrouterRes.data.on('error', err => {
      if (!responded) {
        responded = true;
        res.status(500).json({ error: 'OpenRouter API error' });
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
        // Parse due date if provided
        let dueDate = null;
        if (command.dueDate && typeof command.dueDate === 'string') {
          const parsed = new Date(command.dueDate);
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed;
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
            dueDate,
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
            return `✏️ Task "${task.title}" updated${updateData.status ? ` (status: ${updateData.status})` : ''}${updateData.priority ? ` (priority: ${updateData.priority})` : ''}${updateData.dueDate ? ' (due date updated)' : ''}.`;
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
        // Only show tasks user can see and focus on active tasks (TODO and IN_PROGRESS)
        where.OR = [
          { assigneeId: userId },
          { assignerId: userId }
        ];
        // If no specific status filter, default to active tasks only
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
  } catch (err) {
    if (!responded) {
      responded = true;
      console.error('Ollama error:', err?.response?.data || err.message);
      res.status(500).json({ error: 'AI service error' });
    }
  }
});

// POST /api/ai/extract-task
router.post('/extract-task', async (req, res) => {
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
      model: 'google/gemma-3-27b-it:free',
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
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
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
                  const cleanedTask = {
                    title: (taskData.title || '').substring(0, 50),
                    description: (taskData.description || '').substring(0, 300),
                    priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(taskData.priority) ? taskData.priority : 'MEDIUM',
                    dueDate: taskData.dueDate || null,
                    assignee: taskData.assignee || null
                  };
                  
                  res.json({ success: true, taskData: cleanedTask });
                  resolve();
                } else {
                  // Fallback: create basic task from the text
                  const fallbackTask = {
                    title: text.substring(0, 50),
                    description: `Task extracted from: ${text.substring(0, 250)}`,
                    priority: 'MEDIUM',
                    dueDate: null,
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
    return res.status(500).json({ error: 'Failed to extract task data' });
  }
});

// POST /api/ai/identify-task-update
router.post('/identify-task-update', async (req, res) => {
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
      model: 'google/gemma-3-27b-it:free',
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
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
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

module.exports = router; 