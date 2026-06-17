const prisma = require('../lib/prisma');
const { createNotification } = require('./notificationController');
const { scheduleGoogleCalendarSyncForTask } = require('../services/gmailAgentService');
// Archive a task
const archiveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.companyId;

    // Get the task with relations
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(taskId),
        companyId: companyId
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assigner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        coAssignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if task is already archived
    if (task.archived) {
      return res.status(400).json({ error: 'Task is already archived' });
    }

    // Check permissions: Only admins, sysadmins, and task assigner can archive
    const canArchive = req.user.role === 'ADMIN' || 
                      req.user.role === 'SYSDMIN' || 
                      task.assignerId === currentUserId;

    if (!canArchive) {
      return res.status(403).json({ 
        error: 'Only admins, sysadmins, and task assigners can archive tasks' 
      });
    }

    // Archive the task
    const archivedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: { archived: true }
    });

    // Send notification to assignee and co-assignees
    const notificationMessage = `Task "${task.title}" has been archived by ${req.user.name}`;
    
    // Notify assignee
    if (task.assigneeId) {
      await createNotification(
        'TASK_ARCHIVED',
        'Task Archived',
        notificationMessage,
        task.id,
        task.assigneeId,
        companyId
      );
    }

    // Notify co-assignees
    for (const coAssignee of task.coAssignees) {
      await createNotification(
        'TASK_ARCHIVED',
        'Task Archived',
        notificationMessage,
        task.id,
        coAssignee.userId,
        companyId
      );
    }

    // Log audit action
    try {
      const { logAuditActionDirect } = require('../middleware/auditLogger');
      await logAuditActionDirect('TASK_ARCHIVED', 'Task', task.id, {
        taskTitle: task.title,
        archivedBy: req.user.name,
        assigneeId: task.assigneeId,
        coAssignees: task.coAssignees.map(ca => ca.userId)
      }, req.user.id, companyId, req);
    } catch (auditError) {
      console.error('Failed to log audit action:', auditError);
    }

    scheduleGoogleCalendarSyncForTask(parseInt(taskId));

    res.json({ 
      message: 'Task archived successfully',
      task: archivedTask
    });

  } catch (error) {
    console.error('Error archiving task:', error);
    res.status(500).json({ error: 'Failed to archive task' });
  }
};

// Unarchive a task
const unarchiveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.companyId;

    // Get the task with relations
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(taskId),
        companyId: companyId
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assigner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        coAssignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if task is not archived
    if (!task.archived) {
      return res.status(400).json({ error: 'Task is not archived' });
    }

    // Check permissions: Only admins, sysadmins, and task assigner can unarchive
    const canUnarchive = req.user.role === 'ADMIN' || 
                        req.user.role === 'SYSDMIN' || 
                        task.assignerId === currentUserId;

    if (!canUnarchive) {
      return res.status(403).json({ 
        error: 'Only admins, sysadmins, and task assigners can unarchive tasks' 
      });
    }

    // Unarchive the task
    const unarchivedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: { archived: false }
    });

    // Send notification to assignee and co-assignees
    const notificationMessage = `Task "${task.title}" has been unarchived by ${req.user.name}`;
    
    // Notify assignee
    if (task.assigneeId) {
      await createNotification(
        'TASK_UNARCHIVED',
        'Task Unarchived',
        notificationMessage,
        task.id,
        task.assigneeId,
        companyId
      );
    }

    // Notify co-assignees
    for (const coAssignee of task.coAssignees) {
      await createNotification(
        'TASK_UNARCHIVED',
        'Task Unarchived',
        notificationMessage,
        task.id,
        coAssignee.userId,
        companyId
      );
    }

    // Log audit action
    try {
      const { logAuditActionDirect } = require('../middleware/auditLogger');
      await logAuditActionDirect('TASK_UNARCHIVED', 'Task', task.id, {
        taskTitle: task.title,
        unarchivedBy: req.user.name,
        assigneeId: task.assigneeId,
        coAssignees: task.coAssignees.map(ca => ca.userId)
      }, req.user.id, companyId, req);
    } catch (auditError) {
      console.error('Failed to log audit action:', auditError);
    }

    scheduleGoogleCalendarSyncForTask(parseInt(taskId));

    res.json({ 
      message: 'Task unarchived successfully',
      task: unarchivedTask
    });

  } catch (error) {
    console.error('Error unarchiving task:', error);
    res.status(500).json({ error: 'Failed to unarchive task' });
  }
};

// Get archived tasks
const getArchivedTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;
    const userRole = req.user.role;

    let whereClause = {
      companyId: companyId,
      archived: true
    };

    // Apply role-based filtering
    if (userRole === 'EMPLOYEE') {
      whereClause.OR = [
        { assigneeId: userId },
        { assignerId: userId },
        { coAssignees: { some: { userId: userId } } },
        { sharedWith: { some: { userId: userId } } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assigner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        coAssignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        sharedWith: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(tasks);

  } catch (error) {
    console.error('Error fetching archived tasks:', error);
    res.status(500).json({ error: 'Failed to fetch archived tasks' });
  }
};

module.exports = {
  archiveTask,
  unarchiveTask,
  getArchivedTasks
};
