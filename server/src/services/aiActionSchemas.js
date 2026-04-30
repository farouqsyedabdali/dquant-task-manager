const SUPPORTED_ACTIONS = new Set([
  'create_task',
  'update_task',
  'add_subtask',
  'create_project',
  'update_project',
  'add_comment'
]);

const ACTION_ALIASES = {
  add_update: 'add_comment',
  comment_task: 'add_comment',
  create_subtask: 'add_subtask',
  edit_task: 'update_task',
  modify_task: 'update_task',
  edit_project: 'update_project',
  modify_project: 'update_project'
};

const PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const TASK_STATUSES = new Set(['TODO', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']);
const PROJECT_STATUSES = new Set(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']);

function normalizeActionType(actionType) {
  const normalized = String(actionType || '').trim().toLowerCase();
  return ACTION_ALIASES[normalized] || normalized;
}

function normalizePriority(priority) {
  const normalized = String(priority || 'MEDIUM').trim().toUpperCase();
  return PRIORITIES.has(normalized) ? normalized : 'MEDIUM';
}

function normalizeTaskStatus(status) {
  const normalized = String(status || '').trim().toUpperCase();
  return TASK_STATUSES.has(normalized) ? normalized : null;
}

function normalizeProjectStatus(status) {
  const normalized = String(status || '').trim().toUpperCase();
  return PROJECT_STATUSES.has(normalized) ? normalized : null;
}

function optionalString(value) {
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
}

function toId(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeUpdateTaskInput(input = {}) {
  const id = toId(input.taskId);
  const titleStr = optionalString(input.title);
  const newTitleStr = optionalString(input.newTitle);
  const taskTitleStr = optionalString(input.taskTitle);
  if (id && !newTitleStr && titleStr && !taskTitleStr) {
    const { title, ...rest } = input;
    return { ...rest, newTitle: title };
  }
  return { ...input };
}

function normalizePreviewInput(actionType, input = {}) {
  const type = normalizeActionType(actionType);
  if (type === 'update_task') return normalizeUpdateTaskInput(input || {});
  return { ...(input || {}) };
}

function collectTaskUpdates(input) {
  const updates = {};
  const invalid = [];

  const title = optionalString(input.newTitle);
  if (title) updates.title = title;

  if (input.description !== undefined) updates.description = String(input.description);
  if (input.priority !== undefined) updates.priority = normalizePriority(input.priority);
  if (input.status !== undefined) {
    const status = normalizeTaskStatus(input.status);
    if (status) updates.status = status;
    else invalid.push('status');
  }
  if (input.dueDate !== undefined) updates.dueDate = input.dueDate;

  return { updates, invalid };
}

function collectProjectUpdates(input) {
  const updates = {};
  const invalid = [];

  const name = optionalString(input.newName ?? input.name ?? input.title);
  if (name) updates.name = name;
  if (input.description !== undefined) updates.description = String(input.description);
  if (input.color !== undefined) updates.color = String(input.color).trim() || '#6366f1';
  if (input.icon !== undefined) updates.icon = String(input.icon).trim() || '📁';
  if (input.status !== undefined) {
    const status = normalizeProjectStatus(input.status);
    if (status) updates.status = status;
    else invalid.push('status');
  }
  if (input.dueDate !== undefined) updates.dueDate = input.dueDate;

  return { updates, invalid };
}

function buildValidationErrors(actionType, input = {}) {
  const normalizedType = normalizeActionType(actionType);
  const errors = [];

  if (!SUPPORTED_ACTIONS.has(normalizedType)) {
    errors.push(`Unsupported action "${normalizedType || 'unknown'}"`);
    return { actionType: normalizedType || 'unknown', errors };
  }

  if (normalizedType === 'create_task' || normalizedType === 'add_subtask') {
    if (!optionalString(input.title)) errors.push('Task title is required');
    if (!input.dueDate) errors.push('Due date is required');
  }

  if (normalizedType === 'add_subtask' && !input.parentTaskId && !input.parentTaskTitle && !input.taskTitle) {
    errors.push('Parent task is required');
  }

  if (normalizedType === 'update_task') {
    const { updates, invalid } = collectTaskUpdates(input);
    if (!input.taskId && !input.title && !input.taskTitle) errors.push('Task reference is required');
    if (Object.keys(updates).length === 0) errors.push('At least one task update is required');
    if (invalid.includes('status')) errors.push('Invalid task status');
  }

  if (normalizedType === 'create_project') {
    if (!optionalString(input.name ?? input.title)) errors.push('Project name is required');
    if (!input.dueDate) errors.push('Due date is required');
  }

  if (normalizedType === 'update_project') {
    const { updates, invalid } = collectProjectUpdates(input);
    if (!input.projectId && !input.projectName && !input.name) errors.push('Project reference is required');
    if (Object.keys(updates).length === 0) errors.push('At least one project update is required');
    if (invalid.includes('status')) errors.push('Invalid project status');
  }

  if (normalizedType === 'add_comment') {
    if (!input.taskId && !input.title && !input.taskTitle) errors.push('Task reference is required');
    if (!optionalString(input.content ?? input.comment)) errors.push('Comment content is required');
  }

  return { actionType: normalizedType, errors };
}

module.exports = {
  SUPPORTED_ACTIONS,
  PROJECT_STATUSES,
  TASK_STATUSES,
  collectProjectUpdates,
  collectTaskUpdates,
  buildValidationErrors,
  normalizeActionType,
  normalizePreviewInput,
  normalizePriority,
  normalizeProjectStatus,
  normalizeTaskStatus,
  optionalString,
  toId
};
