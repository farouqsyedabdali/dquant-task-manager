const prisma = require('../lib/prisma');
const { createNotification } = require('../controllers/notificationController');
const { scheduleGoogleCalendarSyncForTask } = require('./gmailAgentService');

function sameLocalCalendarDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * @param {Date} fromDueDate
 * @param {'WEEKLY'|'MONTHLY'} recurrence
 * @returns {Date|null}
 */
function computeNextDueDate(fromDueDate, recurrence) {
  if (!fromDueDate) return null;
  const d = new Date(fromDueDate);
  if (Number.isNaN(d.getTime())) return null;

  if (recurrence === 'WEEKLY') {
    const next = new Date(d);
    next.setDate(next.getDate() + 7);
    return next;
  }

  if (recurrence === 'MONTHLY') {
    const day = d.getDate();
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, lastDay));
    next.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
    return next;
  }

  return null;
}

async function hasOpenOccurrenceForDueDay(seriesId, companyId, dueDate) {
  const tasks = await prisma.task.findMany({
    where: {
      recurrenceSeriesId: seriesId,
      companyId,
      archived: false,
      status: { notIn: ['COMPLETED', 'CANCELLED'] }
    },
    select: { id: true, dueDate: true }
  });
  return tasks.some((t) => t.dueDate && sameLocalCalendarDay(t.dueDate, dueDate));
}

/**
 * After a recurring task is marked COMPLETED, create the next occurrence if applicable.
 * @param {import('@prisma/client').Task & { recurrence?: string }} completedTask
 */
async function spawnNextRecurrenceAfterCompletion(completedTask) {
  if (!completedTask || completedTask.recurrence === 'NONE' || !completedTask.recurrenceSeriesId) {
    return null;
  }
  if (completedTask.parentTaskId) return null;
  if (completedTask.isDraft) return null;
  if (completedTask.recurrence !== 'WEEKLY' && completedTask.recurrence !== 'MONTHLY') return null;
  if (!completedTask.dueDate) return null;

  const nextDue = computeNextDueDate(completedTask.dueDate, completedTask.recurrence);
  if (!nextDue || Number.isNaN(nextDue.getTime())) return null;

  if (completedTask.recurrenceEndsAt && nextDue > new Date(completedTask.recurrenceEndsAt)) {
    return null;
  }

  const exists = await hasOpenOccurrenceForDueDay(
    completedTask.recurrenceSeriesId,
    completedTask.companyId,
    nextDue
  );
  if (exists) return null;

  const newTask = await prisma.task.create({
    data: {
      title: completedTask.title,
      description: completedTask.description,
      priority: completedTask.priority,
      status: 'TODO',
      companyId: completedTask.companyId,
      assignerId: completedTask.assignerId,
      assigneeId: completedTask.assigneeId,
      externalContactId: completedTask.externalContactId,
      parentTaskId: null,
      projectId: completedTask.projectId,
      dueDate: nextDue,
      archived: false,
      isDraft: false,
      recurrence: completedTask.recurrence,
      recurrenceSeriesId: completedTask.recurrenceSeriesId,
      recurrenceAnchorDate: completedTask.recurrenceAnchorDate || completedTask.dueDate,
      recurrenceEndsAt: completedTask.recurrenceEndsAt,
      statusManuallyChanged: false
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true }
      },
      assigner: {
        select: { id: true, name: true, email: true, companyId: true }
      },
      externalContact: {
        select: { id: true, name: true, email: true }
      },
      parentTask: {
        select: { id: true, title: true }
      },
      subtasks: {
        include: {
          assigner: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } }
        }
      },
      comments: {
        include: {
          author: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      coAssignees: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      },
      collaborators: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      },
      project: {
        select: { id: true, name: true, color: true, icon: true, ownerId: true }
      }
    }
  });

  if (newTask.assigneeId && newTask.assigneeId !== newTask.assignerId) {
    try {
      await createNotification(
        'TASK_CREATED',
        'New recurring task',
        `Next occurrence: "${newTask.title}"`,
        newTask.id,
        newTask.assigneeId,
        newTask.companyId
      );
    } catch (e) {
      console.error('Notification for recurring task failed:', e);
    }
  }

  scheduleGoogleCalendarSyncForTask(newTask.id);

  return newTask;
}

module.exports = {
  computeNextDueDate,
  sameLocalCalendarDay,
  spawnNextRecurrenceAfterCompletion
};
