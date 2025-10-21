const prisma = require('../lib/prisma');
const { createNotification } = require('./notificationController');
const { logAuditActionDirect } = require('../middleware/auditLogger');



// Share a task with a user
const shareTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;
    const companyId = req.user.companyId;

    // Verify task exists and user has permission to share it
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(taskId),
        companyId: companyId
      },
      include: {
        assignee: true,
        assigner: true,
        coAssignees: {
          include: {
            user: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if current user can share: lead assignee, assigner, admin, or sysadmin
    const isAdminOrSysadmin = req.user.role === 'ADMIN' || req.user.role === 'SYSADMIN';
    const isAssigner = task.assignerId === currentUserId;
    const isLeadAssignee = task.assigneeId === currentUserId;
    if (!(isLeadAssignee || isAssigner || isAdminOrSysadmin)) {
      return res.status(403).json({ error: 'Only the lead assignee, assigner, or admin/sysadmin can share this task' });
    }

    // Verify target user exists in the same company
    const targetUser = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        companyId: companyId
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found in your company' });
    }

    // Check if task is already shared with this user
    const existingShare = await prisma.taskShare.findFirst({
      where: {
        taskId: parseInt(taskId),
        userId: parseInt(userId)
      }
    });

    if (existingShare) {
      return res.status(400).json({ error: 'Task is already shared with this user' });
    }

    // Check if user is trying to share with themselves
    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({ error: 'Cannot share task with yourself' });
    }

    // Check if user is trying to share with co-assignee
    const isCoAssignee = task.coAssignees.some(co => co.userId === parseInt(userId));
    if (isCoAssignee) {
      return res.status(400).json({ error: 'Cannot share task with co-assignees' });
    }

    // Create the share
    const taskShare = await prisma.taskShare.create({
      data: {
        taskId: parseInt(taskId),
        userId: parseInt(userId),
        companyId: companyId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Create notification for the user the task was shared with
    await createNotification(
      'TASK_SHARED',
      'Task Shared',
      `"${task.title}" has been shared with you by ${req.user.name}`,
      task.id,
      parseInt(userId),
      companyId
    );

    // Log audit action
    await logAuditActionDirect(req, 'TASK_SHARED', 'TaskShare', {
      entityId: taskShare.id,
      taskTitle: task.title,
      sharedWithName: targetUser.name,
      metadata: {
        taskId: parseInt(taskId),
        sharedWithUserId: parseInt(userId)
      }
    });

    res.status(201).json(taskShare);
  } catch (error) {
    console.error('Share task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Unshare a task with a user
const unshareTask = async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.companyId;

    // Verify task exists and user has permission to unshare it
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(taskId),
        companyId: companyId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // In unshareTask, same permission logic:
    const isAdminOrSysadminUnshare = req.user.role === 'ADMIN' || req.user.role === 'SYSADMIN';
    const isAssignerUnshare = task.assignerId === currentUserId;
    const isLeadAssigneeUnshare = task.assigneeId === currentUserId;
    if (!(isLeadAssigneeUnshare || isAssignerUnshare || isAdminOrSysadminUnshare)) {
      return res.status(403).json({ error: 'Only the lead assignee, assigner, or admin/sysadmin can unshare this task' });
    }

    // Find and delete the share
    const taskShare = await prisma.taskShare.findFirst({
      where: {
        taskId: parseInt(taskId),
        userId: parseInt(userId),
        companyId: companyId
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!taskShare) {
      return res.status(404).json({ error: 'Task is not shared with this user' });
    }

    await prisma.taskShare.delete({
      where: {
        id: taskShare.id
      }
    });

    // After deleting the share, send notification to the unshared user
    await createNotification(
      'TASK_UNSHARED',
      'Task Unshared',
      `"${task.title}" has been unshared with you by ${req.user.name}`,
      task.id,
      parseInt(userId),
      companyId
    );

    // Log audit action
    await logAuditActionDirect(req, 'TASK_UNSHARED', 'TaskShare', {
      entityId: taskShare.id,
      taskTitle: task.title,
      unsharedWithName: taskShare.user.name,
      metadata: {
        taskId: parseInt(taskId),
        unsharedWithUserId: parseInt(userId)
      }
    });

    res.json({ message: 'Task unshared successfully' });
  } catch (error) {
    console.error('Unshare task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get users a task is shared with
const getTaskShares = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.companyId;

    // Verify task exists and user has permission to view shares
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(taskId),
        companyId: companyId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if current user is the lead assignee (only lead assignee can view shares)
    if (task.assigneeId !== currentUserId) {
      return res.status(403).json({ error: 'Only the lead assignee can view task shares' });
    }

    const shares = await prisma.taskShare.findMany({
      where: {
        taskId: parseInt(taskId),
        companyId: companyId
      },
      include: {
        user: {
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
    });

    res.json(shares);
  } catch (error) {
    console.error('Get task shares error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get tasks shared with current user
const getSharedTasks = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const companyId = req.user.companyId;

    const sharedTasks = await prisma.taskShare.findMany({
      where: {
        userId: currentUserId,
        companyId: companyId
      },
      include: {
        task: {
          include: {
            assigner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            assignee: {
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
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            },
            subtasks: {
              include: {
                assigner: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                assignee: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(sharedTasks);
  } catch (error) {
    console.error('Get shared tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  shareTask,
  unshareTask,
  getTaskShares,
  getSharedTasks
};
