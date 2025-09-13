const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Automatically change task status from TODO to IN_PROGRESS
 * Only if the status hasn't been manually changed by the creator
 */
const autoChangeStatusToInProgress = async (taskId, companyId) => {
  try {
    // Get the task to check current status and if it was manually changed
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId: companyId
      }
    });

    if (!task) {
      console.log('Task not found for auto status change:', taskId);
      return false;
    }

    // Only auto-change if:
    // 1. Current status is TODO
    // 2. Status hasn't been manually changed by creator
    if (task.status === 'TODO' && !task.statusManuallyChanged) {
      await prisma.task.update({
        where: { id: taskId },
        data: { 
          status: 'IN_PROGRESS',
          updatedAt: new Date()
        }
      });

      console.log(`Auto-changed task ${taskId} status from TODO to IN_PROGRESS`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in auto status change:', error);
    return false;
  }
};

/**
 * Mark task status as manually changed by the creator
 * This prevents future automatic status changes
 */
const markStatusAsManuallyChanged = async (taskId, companyId) => {
  try {
    await prisma.task.update({
      where: { 
        id: taskId,
        companyId: companyId
      },
      data: { 
        statusManuallyChanged: true,
        updatedAt: new Date()
      }
    });

    console.log(`Marked task ${taskId} status as manually changed`);
    return true;
  } catch (error) {
    console.error('Error marking status as manually changed:', error);
    return false;
  }
};

/**
 * Check if a task should have its status auto-changed
 * Returns true if the task is in TODO status and hasn't been manually changed
 */
const shouldAutoChangeStatus = async (taskId, companyId) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId: companyId
      },
      select: {
        status: true,
        statusManuallyChanged: true
      }
    });

    if (!task) {
      return false;
    }

    return task.status === 'TODO' && !task.statusManuallyChanged;
  } catch (error) {
    console.error('Error checking if should auto-change status:', error);
    return false;
  }
};

module.exports = {
  autoChangeStatusToInProgress,
  markStatusAsManuallyChanged,
  shouldAutoChangeStatus
};

