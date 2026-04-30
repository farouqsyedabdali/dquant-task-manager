const prisma = require('../lib/prisma');
const { parseLocalDate } = require('../utils/dateUtils');
const { logAuditActionDirect } = require('../middleware/auditLogger');
const {
  SUPPORTED_ACTIONS,
  buildValidationErrors,
  collectProjectUpdates,
  collectTaskUpdates,
  normalizeActionType,
  normalizePreviewInput,
  normalizePriority,
  normalizeProjectStatus,
  optionalString
} = require('./aiActionSchemas');
const {
  canUpdateTask,
  isAdmin,
  resolveAssigneeReference,
  resolveProjectReference,
  resolveTaskReference,
  taskAccessWhere
} = require('./aiEntityResolver');

function actionError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseDueDate(value, { required = false, allowPast = false } = {}) {
  if (!value) return { value: null, error: required ? 'Due date is required' : null };
  const parsed = parseFlexibleDate(value);
  if (Number.isNaN(parsed.getTime())) return { value: null, error: 'Invalid due date' };
  if (!allowPast && parsed <= new Date()) return { value: null, error: 'Due date must be in the future' };
  return { value: parsed, error: null };
}

function parseFlexibleDate(value) {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return new Date(value);

  const parsedLocal = parseLocalDate(value);
  if (!Number.isNaN(parsedLocal.getTime())) return parsedLocal;

  const raw = value.trim();
  const lower = raw.toLowerCase();
  const now = new Date();
  const relativeDay = lower.includes('tomorrow') ? 1 : lower.includes('today') ? 0 : null;
  if (relativeDay !== null) {
    const date = new Date(now);
    date.setDate(now.getDate() + relativeDay);
    applyTimeFromText(date, lower);
    return date;
  }

  const cleaned = raw.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1');
  const monthMatch = cleaned.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,)?\s+\d{4}\b/i);
  if (monthMatch) {
    const parsedMonthDate = new Date(monthMatch[0]);
    if (!Number.isNaN(parsedMonthDate.getTime())) {
      applyTimeFromText(parsedMonthDate, lower);
      return parsedMonthDate;
    }
  }

  return new Date(cleaned);
}

function applyTimeFromText(date, lowerText) {
  if (lowerText.includes('eod') || lowerText.includes('end of day')) {
    date.setHours(17, 0, 0, 0);
    return;
  }

  const timeMatch = lowerText.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (timeMatch[3] === 'pm' && hours < 12) hours += 12;
    if (timeMatch[3] === 'am' && hours === 12) hours = 0;
    date.setHours(hours, minutes, 0, 0);
    return;
  }

  date.setHours(23, 59, 0, 0);
}

function compactObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

function asIsoDate(date) {
  return date ? new Date(date).toISOString() : null;
}

function taskSnapshot(task) {
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: asIsoDate(task.dueDate),
    assigneeId: task.assigneeId,
    assignerId: task.assignerId,
    parentTaskId: task.parentTaskId,
    projectId: task.projectId,
    archived: task.archived
  };
}

function projectSnapshot(project) {
  if (!project) return null;
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    icon: project.icon,
    status: project.status,
    dueDate: asIsoDate(project.dueDate),
    ownerId: project.ownerId
  };
}

function buildDiff(before, updates) {
  if (!before) return [];
  return Object.entries(updates || {}).map(([field, after]) => ({
    field,
    before: field === 'dueDate' ? asIsoDate(before[field]) : before[field],
    after
  }));
}

function dayBounds(date) {
  if (!date) return null;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}

async function findDuplicateTaskCandidates({ title, dueDate }, user) {
  const cleanTitle = optionalString(title);
  if (!cleanTitle) return [];

  const dueBounds = dueDate ? dayBounds(dueDate) : null;
  const matches = await prisma.task.findMany({
    where: taskAccessWhere(user, {
      title: { equals: cleanTitle, mode: 'insensitive' },
      ...(dueBounds
        ? {
            dueDate: {
              gte: dueBounds.start,
              lt: dueBounds.end
            }
          }
        : {})
    }),
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      assigneeId: true
    },
    take: 3
  });

  return matches.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: asIsoDate(task.dueDate),
    assigneeId: task.assigneeId
  }));
}

async function buildPreview(actionType, input, user) {
  const normalizedType = normalizeActionType(actionType);
  const validation = buildValidationErrors(normalizedType, input);

  if (!SUPPORTED_ACTIONS.has(normalizedType)) {
    return {
      actionType: normalizedType || 'unknown',
      riskLevel: 'HIGH',
      canExecute: false,
      title: 'Unsupported AI action',
      summary: validation.errors[0] || `Tialz does not support "${normalizedType}" through the AI action runner yet.`,
      input
    };
  }

  if (normalizedType === 'create_task' || normalizedType === 'add_subtask') {
    const dueDate = parseDueDate(input.dueDate, { required: true });
    const parent = normalizedType === 'add_subtask'
      ? await resolveTaskReference({ ...input, taskId: input.parentTaskId, title: input.parentTaskTitle || input.taskTitle }, user)
      : { task: null };
    const projectResolution = normalizedType === 'create_task'
      ? await resolveProjectReference(input, user)
      : { project: null };
    const assigneeResolution = await resolveAssigneeReference(input, user);
    const assigneeId = assigneeResolution.user?.id || user.id;
    const errors = [
      ...validation.errors,
      dueDate.error,
      parent.error,
      projectResolution.error,
      assigneeResolution.error
    ].filter(Boolean);

    const resolvedInput = {
      title: optionalString(input.title) || 'Untitled task',
      description: input.description ? String(input.description) : '',
      priority: normalizePriority(input.priority),
      dueDate: dueDate.value ? dueDate.value.toISOString() : null,
      assigneeId,
      parentTaskId: parent.task?.id || null,
      projectId: projectResolution.project?.id || parent.task?.projectId || null
    };
    const duplicateCandidates = normalizedType === 'create_task' && errors.length === 0 && !input.allowDuplicate
      ? await findDuplicateTaskCandidates({ title: resolvedInput.title, dueDate: dueDate.value }, user)
      : [];
    const duplicateError = duplicateCandidates.length > 0
      ? `I found an existing task named "${resolvedInput.title}" with the same due date.`
      : null;
    const allErrors = [...errors, duplicateError].filter(Boolean);

    return {
      actionType: normalizedType,
      riskLevel: 'LOW',
      canExecute: allErrors.length === 0,
      title: normalizedType === 'add_subtask'
        ? `Add subtask: ${resolvedInput.title}`
        : `Create task: ${resolvedInput.title}`,
      summary: allErrors[0] || (parent.task ? `Add this under "${parent.task.title}".` : 'Create a new task.'),
      input,
      candidates: parent.candidates || projectResolution.candidates || null,
      duplicateCandidates,
      resolvedInput,
      beforeState: parent.task ? { parentTask: taskSnapshot(parent.task) } : null,
      undoLabel: 'Archive created task'
    };
  }

  if (normalizedType === 'update_task') {
    const taskResolution = await resolveTaskReference(input, user);
    const { updates: rawUpdates } = collectTaskUpdates(input);
    const updates = { ...rawUpdates };
    if (updates.dueDate !== undefined) {
      const dueDate = parseDueDate(updates.dueDate, { allowPast: true });
      if (dueDate.error) return failedPreview(normalizedType, input, dueDate.error, taskResolution);
      updates.dueDate = dueDate.value.toISOString();
    }
    const permission = taskResolution.task ? canUpdateTask(user, taskResolution.task, updates) : { allowed: false };
    const errors = [
      ...validation.errors,
      taskResolution.error,
      permission.error
    ].filter(Boolean);

    return {
      actionType: normalizedType,
      riskLevel: 'MEDIUM',
      canExecute: errors.length === 0,
      title: `Update task${taskResolution.task ? `: ${taskResolution.task.title}` : ''}`,
      summary: errors[0] || 'Apply the proposed task changes.',
      input,
      candidates: taskResolution.candidates || null,
      resolvedInput: {
        taskId: taskResolution.task?.id || null,
        updates
      },
      beforeState: taskSnapshot(taskResolution.task),
      diff: buildDiff(taskResolution.task, updates),
      undoLabel: 'Restore previous task fields'
    };
  }

  if (normalizedType === 'add_comment') {
    const taskResolution = await resolveTaskReference(input, user);
    const content = optionalString(input.content ?? input.comment);
    const errors = [
      ...validation.errors,
      taskResolution.error
    ].filter(Boolean);

    return {
      actionType: normalizedType,
      riskLevel: 'LOW',
      canExecute: errors.length === 0,
      title: `Add comment${taskResolution.task ? ` to: ${taskResolution.task.title}` : ''}`,
      summary: errors[0] || 'Add this comment to the task.',
      input,
      candidates: taskResolution.candidates || null,
      resolvedInput: {
        taskId: taskResolution.task?.id || null,
        content
      },
      beforeState: taskResolution.task ? { task: taskSnapshot(taskResolution.task) } : null,
      undoLabel: 'Delete added comment'
    };
  }

  if (normalizedType === 'create_project') {
    const dueDate = parseDueDate(input.dueDate, { required: true });
    const errors = [...validation.errors, dueDate.error].filter(Boolean);
    const name = optionalString(input.name ?? input.title) || 'Untitled project';
    return {
      actionType: normalizedType,
      riskLevel: 'MEDIUM',
      canExecute: errors.length === 0,
      title: `Create project: ${name}`,
      summary: errors[0] || 'Create a new project.',
      input,
      resolvedInput: {
        name,
        description: input.description ? String(input.description) : '',
        color: optionalString(input.color) || '#6366f1',
        icon: optionalString(input.icon) || '📁',
        dueDate: dueDate.value ? dueDate.value.toISOString() : null
      },
      undoLabel: 'Archive created project'
    };
  }

  const projectResolution = await resolveProjectReference(input, user);
  const { updates: rawUpdates } = collectProjectUpdates(input);
  const updates = { ...rawUpdates };
  if (updates.status) updates.status = normalizeProjectStatus(updates.status);
  if (updates.dueDate !== undefined) {
    const dueDate = parseDueDate(updates.dueDate, { allowPast: true });
    if (dueDate.error) return failedPreview(normalizedType, input, dueDate.error, projectResolution);
    updates.dueDate = dueDate.value.toISOString();
  }
  const errors = [
    ...validation.errors,
    projectResolution.error
  ].filter(Boolean);

  return {
    actionType: normalizedType,
    riskLevel: 'MEDIUM',
    canExecute: errors.length === 0,
    title: `Update project${projectResolution.project ? `: ${projectResolution.project.name}` : ''}`,
    summary: errors[0] || 'Apply the proposed project changes.',
    input,
    candidates: projectResolution.candidates || null,
    resolvedInput: {
      projectId: projectResolution.project?.id || null,
      updates
    },
    beforeState: projectSnapshot(projectResolution.project),
    diff: buildDiff(projectResolution.project, updates),
    undoLabel: 'Restore previous project fields'
  };
}

function failedPreview(actionType, input, summary, resolution = {}) {
  return {
    actionType,
    riskLevel: 'MEDIUM',
    canExecute: false,
    title: 'AI action needs clarification',
    summary,
    input,
    candidates: resolution.candidates || null
  };
}

async function createAIActionPreview({ req, actionType, input, sourceText, sourceType = 'CHAT', sourceMetadata = null }) {
  const normalizedInput = normalizePreviewInput(actionType, input || {});
  const preview = await buildPreview(actionType, normalizedInput, req.user);

  const action = await prisma.aIAction.create({
    data: {
      actionType: preview.actionType,
      status: preview.canExecute ? 'PENDING' : 'NEEDS_CLARIFICATION',
      riskLevel: preview.riskLevel,
      sourceType,
      sourceText: sourceText || null,
      sourceMetadata,
      input: normalizedInput,
      resolvedInput: preview.resolvedInput || null,
      preview,
      beforeState: preview.beforeState || null,
      userId: req.user.id,
      companyId: req.user.companyId
    }
  });

  return { ...preview, id: action.id, status: action.status };
}

async function getOwnedAction(req, actionId) {
  const action = await prisma.aIAction.findFirst({
    where: {
      id: actionId,
      userId: req.user.id,
      companyId: req.user.companyId
    }
  });

  if (!action) throw actionError('AI action not found', 404);
  return action;
}

async function executeAIAction({ req, actionId }) {
  const action = await getOwnedAction(req, actionId);

  if (action.status === 'EXECUTED') {
    return { action, result: action.result };
  }
  if (action.status !== 'PENDING') {
    throw actionError(action.preview?.summary || 'AI action is not executable');
  }

  const preview = await buildPreview(action.actionType, action.input || {}, req.user);
  if (!preview.canExecute) {
    await prisma.aIAction.update({
      where: { id: action.id },
      data: {
        status: 'NEEDS_CLARIFICATION',
        preview,
        resolvedInput: preview.resolvedInput || null,
        beforeState: preview.beforeState || null,
        error: preview.summary
      }
    });
    throw actionError(preview.summary || 'AI action needs clarification before execution');
  }

  const resolved = preview.resolvedInput || {};
  let result;
  let undoData;

  if (action.actionType === 'create_task' || action.actionType === 'add_subtask') {
    result = await prisma.task.create({
      data: compactObject({
        title: resolved.title,
        description: resolved.description || '',
        priority: resolved.priority || 'MEDIUM',
        dueDate: new Date(resolved.dueDate),
        assigneeId: resolved.assigneeId || req.user.id,
        parentTaskId: resolved.parentTaskId || null,
        projectId: resolved.projectId || null,
        assignerId: req.user.id,
        companyId: req.user.companyId
      }),
      select: { id: true, title: true, status: true, priority: true, dueDate: true, parentTaskId: true, projectId: true }
    });
    undoData = { type: 'archive_task', taskId: result.id };
  } else if (action.actionType === 'update_task') {
    result = await prisma.task.update({
      where: { id: resolved.taskId },
      data: {
        ...resolved.updates,
        ...(resolved.updates?.dueDate ? { dueDate: new Date(resolved.updates.dueDate) } : {})
      },
      select: { id: true, title: true, status: true, priority: true, dueDate: true, description: true }
    });
    undoData = { type: 'restore_task', taskId: resolved.taskId, beforeState: preview.beforeState };
  } else if (action.actionType === 'add_comment') {
    result = await prisma.comment.create({
      data: {
        content: resolved.content,
        taskId: resolved.taskId,
        authorId: req.user.id,
        companyId: req.user.companyId
      },
      select: { id: true, content: true, taskId: true, createdAt: true }
    });
    undoData = { type: 'delete_comment', commentId: result.id };
  } else if (action.actionType === 'create_project') {
    result = await prisma.project.create({
      data: {
        name: resolved.name,
        description: resolved.description || null,
        color: resolved.color || '#6366f1',
        icon: resolved.icon || '📁',
        dueDate: new Date(resolved.dueDate),
        ownerId: req.user.id,
        companyId: req.user.companyId
      },
      select: { id: true, name: true, description: true, status: true, dueDate: true }
    });
    undoData = { type: 'archive_project', projectId: result.id };
  } else if (action.actionType === 'update_project') {
    result = await prisma.project.update({
      where: { id: resolved.projectId },
      data: {
        ...resolved.updates,
        ...(resolved.updates?.dueDate ? { dueDate: new Date(resolved.updates.dueDate) } : {})
      },
      select: { id: true, name: true, description: true, status: true, dueDate: true }
    });
    undoData = { type: 'restore_project', projectId: resolved.projectId, beforeState: preview.beforeState };
  }

  const updatedAction = await prisma.aIAction.update({
    where: { id: action.id },
    data: {
      status: 'EXECUTED',
      resolvedInput: preview.resolvedInput || null,
      preview,
      beforeState: preview.beforeState || null,
      result,
      undoData,
      error: null,
      executedAt: new Date()
    }
  });

  await logAuditActionDirect(req, 'SYSTEM_ACTION', 'AIAction', {
    entityId: null,
    metadata: {
      aiActionId: action.id,
      actionType: action.actionType,
      result,
      undoData
    }
  });

  return { action: updatedAction, result };
}

async function rejectAIAction({ req, actionId }) {
  const action = await getOwnedAction(req, actionId);
  if (!['PENDING', 'NEEDS_CLARIFICATION', 'ERROR'].includes(action.status)) {
    throw actionError('Only pending AI actions can be rejected');
  }

  return prisma.aIAction.update({
    where: { id: action.id },
    data: { status: 'REJECTED' }
  });
}

async function undoAIAction({ req, actionId }) {
  const action = await getOwnedAction(req, actionId);
  if (action.status !== 'EXECUTED') throw actionError('Only executed AI actions can be undone');
  if (action.undoneAt) return { action, result: action.result };

  const undoData = action.undoData || {};
  let undoResult;

  if (undoData.type === 'archive_task') {
    undoResult = await prisma.task.updateMany({
      where: { id: undoData.taskId, companyId: req.user.companyId, assignerId: req.user.id },
      data: { archived: true }
    });
  } else if (undoData.type === 'restore_task') {
    const before = undoData.beforeState || {};
    const permission = canUpdateTask(req.user, before, action.resolvedInput?.updates || {});
    if (!permission.allowed && !isAdmin(req.user)) throw actionError(permission.error || 'You cannot undo this task change', 403);
    undoResult = await prisma.task.update({
      where: { id: undoData.taskId },
      data: compactObject({
        title: before.title,
        description: before.description,
        status: before.status,
        priority: before.priority,
        dueDate: before.dueDate ? new Date(before.dueDate) : null,
        assigneeId: before.assigneeId,
        parentTaskId: before.parentTaskId,
        projectId: before.projectId,
        archived: before.archived
      }),
      select: { id: true, title: true, status: true, priority: true, dueDate: true }
    });
  } else if (undoData.type === 'delete_comment') {
    undoResult = await prisma.comment.deleteMany({
      where: { id: undoData.commentId, companyId: req.user.companyId, authorId: req.user.id }
    });
  } else if (undoData.type === 'archive_project') {
    undoResult = await prisma.project.updateMany({
      where: {
        id: undoData.projectId,
        companyId: req.user.companyId,
        ...(isAdmin(req.user) ? {} : { ownerId: req.user.id })
      },
      data: { status: 'ARCHIVED' }
    });
  } else if (undoData.type === 'restore_project') {
    const before = undoData.beforeState || {};
    undoResult = await prisma.project.update({
      where: { id: undoData.projectId },
      data: compactObject({
        name: before.name,
        description: before.description,
        color: before.color,
        icon: before.icon,
        status: before.status,
        dueDate: before.dueDate ? new Date(before.dueDate) : null
      }),
      select: { id: true, name: true, status: true, dueDate: true }
    });
  } else {
    throw actionError('This AI action cannot be undone');
  }

  const updatedAction = await prisma.aIAction.update({
    where: { id: action.id },
    data: {
      status: 'UNDONE',
      result: {
        ...(action.result || {}),
        undoResult
      },
      undoneAt: new Date()
    }
  });

  await logAuditActionDirect(req, 'SYSTEM_ACTION', 'AIAction', {
    entityId: null,
    metadata: {
      aiActionId: action.id,
      actionType: action.actionType,
      undoData,
      undoResult
    }
  });

  return { action: updatedAction, result: undoResult };
}

module.exports = {
  buildPreview,
  createAIActionPreview,
  executeAIAction,
  rejectAIAction,
  undoAIAction,
  SUPPORTED_ACTIONS
};
