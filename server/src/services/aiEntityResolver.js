const prisma = require('../lib/prisma');
const { toId } = require('./aiActionSchemas');

const ADMIN_ROLES = new Set(['ADMIN', 'SYSDMIN', 'SUPER_ADMIN']);

function isAdmin(user) {
  return ADMIN_ROLES.has(user?.role);
}

function taskAccessWhere(user, extra = {}) {
  return {
    companyId: user.companyId,
    archived: false,
    ...extra,
    ...(isAdmin(user)
      ? {}
      : {
          OR: [
            { assigneeId: user.id },
            { assignerId: user.id },
            { coAssignees: { some: { userId: user.id } } },
            { sharedWith: { some: { userId: user.id } } },
            { collaborators: { some: { userId: user.id } } }
          ]
        })
  };
}

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  assigneeId: true,
  assignerId: true,
  parentTaskId: true,
  projectId: true,
  archived: true,
  companyId: true
};

const PROJECT_SELECT = {
  id: true,
  name: true,
  description: true,
  color: true,
  icon: true,
  status: true,
  dueDate: true,
  ownerId: true,
  companyId: true
};

async function resolveTaskReference(input, user) {
  const id = toId(input.taskId ?? input.parentTaskId);
  if (id === null) return { error: 'Invalid task id' };

  if (id) {
    const task = await prisma.task.findFirst({
      where: taskAccessWhere(user, { id }),
      select: TASK_SELECT
    });
    return task ? { task } : { error: 'Task not found or not accessible' };
  }

  const title = String(input.title || input.taskTitle || input.parentTaskTitle || '').trim();
  if (!title) return { error: 'Task reference is required' };

  const matches = await prisma.task.findMany({
    where: taskAccessWhere(user, {
      title: { contains: title, mode: 'insensitive' }
    }),
    orderBy: { updatedAt: 'desc' },
    select: TASK_SELECT,
    take: 6
  });

  if (matches.length === 0) return { error: `Could not find a task matching "${title}"` };
  if (matches.length > 1) {
    return {
      error: `Multiple tasks match "${title}"`,
      candidates: matches.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
      }))
    };
  }

  return { task: matches[0] };
}

async function resolveProjectReference(input, user) {
  const id = toId(input.projectId);
  if (id === null) return { error: 'Invalid project id' };

  const name = String(input.projectName || input.name || '').trim();
  if (!id && !name) return { project: null };

  const projects = await prisma.project.findMany({
    where: {
      companyId: user.companyId,
      ...(id ? { id } : { name: { contains: name, mode: 'insensitive' } })
    },
    orderBy: { updatedAt: 'desc' },
    select: PROJECT_SELECT,
    take: 6
  });

  if (projects.length === 0) return { error: 'Project not found' };
  if (projects.length > 1) {
    return {
      error: 'Multiple projects matched',
      candidates: projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        dueDate: project.dueDate
      }))
    };
  }

  const project = projects[0];
  if (project.ownerId !== user.id && !isAdmin(user)) {
    return { error: 'You cannot modify this project' };
  }
  return { project };
}

async function resolveAssigneeReference(input, user) {
  const id = toId(input.assigneeId);
  if (id === null) return { error: 'Invalid assignee id' };
  if (!id && !input.assignee && !input.assigneeEmail) return { user: null };

  const assignee = await prisma.user.findFirst({
    where: {
      companyId: user.companyId,
      ...(id
        ? { id }
        : input.assigneeEmail
          ? { email: String(input.assigneeEmail).trim().toLowerCase() }
          : { name: { contains: String(input.assignee).trim(), mode: 'insensitive' } })
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' }
  });

  if (!assignee) return { error: 'Assignee not found in your company' };
  return { user: assignee };
}

function canUpdateTask(user, task, updates) {
  if (!task) return { allowed: false, error: 'Task not found' };
  if (isAdmin(user) || task.assignerId === user.id) return { allowed: true };

  const updateKeys = Object.keys(updates || {});
  if (task.assigneeId === user.id && updateKeys.length === 1 && updateKeys[0] === 'status') {
    if (updates.status === 'COMPLETED') {
      return { allowed: false, error: 'Only the task creator or an administrator can mark this task as completed' };
    }
    return { allowed: true };
  }

  return { allowed: false, error: 'You cannot make this task change' };
}

module.exports = {
  isAdmin,
  taskAccessWhere,
  resolveAssigneeReference,
  resolveProjectReference,
  resolveTaskReference,
  canUpdateTask
};
