const prisma = require('../lib/prisma');
const { createNotification } = require('./notificationController');
const { logAuditActionDirect } = require('../middleware/auditLogger');



// Share a task with a user
const shareTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, permissionLevel = 'VIEWER' } = req.body;
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
        companyId: companyId,
        permissionLevel: permissionLevel
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

// Unshare a task by share ID (works for internal users, external contacts, and email shares)
const unshareTaskById = async (req, res) => {
  try {
    const { taskId, shareId } = req.params;
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

    // Check permissions: lead assignee, assigner, admin, or sysadmin
    const isAdminOrSysadmin = req.user.role === 'ADMIN' || req.user.role === 'SYSADMIN';
    const isAssigner = task.assignerId === currentUserId;
    const isLeadAssignee = task.assigneeId === currentUserId;
    if (!(isLeadAssignee || isAssigner || isAdminOrSysadmin)) {
      return res.status(403).json({ error: 'Only the lead assignee, assigner, or admin/sysadmin can unshare this task' });
    }

    // Find the share
    const taskShare = await prisma.taskShare.findFirst({
      where: {
        id: parseInt(shareId),
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
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!taskShare) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Get the name for notification and audit log
    const unsharedName = taskShare.user?.name || taskShare.contact?.name || taskShare.email || 'Unknown';
    const unsharedUserId = taskShare.userId;

    // Delete the share
    await prisma.taskShare.delete({
      where: {
        id: taskShare.id
      }
    });

    // Send notification if it was an internal user
    if (unsharedUserId) {
      await createNotification(
        'TASK_UNSHARED',
        'Task Unshared',
        `"${task.title}" has been unshared with you by ${req.user.name}`,
        task.id,
        unsharedUserId,
        companyId
      );
    }

    // Log audit action
    await logAuditActionDirect(req, 'TASK_UNSHARED', 'TaskShare', {
      entityId: taskShare.id,
      taskTitle: task.title,
      unsharedWithName: unsharedName,
      metadata: {
        taskId: parseInt(taskId),
        shareId: parseInt(shareId),
        userId: unsharedUserId,
        contactId: taskShare.contactId,
        email: taskShare.email
      }
    });

    res.json({ message: 'Task unshared successfully' });
  } catch (error) {
    console.error('Unshare task by ID error:', error);
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
        },
        contact: {
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

// Share a task with a contact
const shareTaskWithContact = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { contactId, permissionLevel = 'VIEWER' } = req.body;
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
        assigner: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if current user can share
    const isAdminOrSysadmin = req.user.role === 'ADMIN' || req.user.role === 'SYSADMIN';
    const isAssigner = task.assignerId === currentUserId;
    const isLeadAssignee = task.assigneeId === currentUserId;
    if (!(isLeadAssignee || isAssigner || isAdminOrSysadmin)) {
      return res.status(403).json({ error: 'Only the lead assignee, assigner, or admin/sysadmin can share this task' });
    }

    // Verify contact exists and belongs to current user
    const contact = await prisma.contact.findFirst({
      where: {
        id: parseInt(contactId),
        userId: currentUserId
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if task is already shared with this contact
    const existingShare = await prisma.taskShare.findFirst({
      where: {
        taskId: parseInt(taskId),
        contactId: parseInt(contactId)
      }
    });

    if (existingShare) {
      return res.status(400).json({ error: 'Task is already shared with this contact' });
    }

    // Create the share
    const taskShare = await prisma.taskShare.create({
      data: {
        taskId: parseInt(taskId),
        contactId: parseInt(contactId),
        companyId: companyId,
        permissionLevel: permissionLevel,
        isExternal: true
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create a TaskInvitation for the external contact
    try {
      const invitation = await prisma.taskInvitation.create({
        data: {
          taskId: task.id,
          senderId: currentUserId,
          recipientEmail: contact.email,
          message: `You have been invited to ${permissionLevel === 'VIEWER' ? 'view' : 'comment on'} a task: "${task.title}"`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'PENDING'
        }
      });

      // Send email invitation
      const emailService = require('../services/emailService');
      await emailService.sendTaskInvitation({
        recipientEmail: contact.email,
        recipientName: contact.name,
        senderName: req.user.name,
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate
        },
        token: invitation.token,
        message: `You have been invited to ${permissionLevel === 'VIEWER' ? 'view' : 'comment on'} a task: "${task.title}"`
      });
    } catch (emailError) {
      console.error('Error sending email invitation:', emailError);
      // Don't fail the share if email fails
    }

    // Log audit action
    await logAuditActionDirect(req, 'TASK_SHARED', 'TaskShare', {
      entityId: taskShare.id,
      taskTitle: task.title,
      sharedWithName: contact.name,
      metadata: {
        taskId: parseInt(taskId),
        sharedWithContactId: parseInt(contactId),
        permissionLevel: permissionLevel
      }
    });

    res.status(201).json(taskShare);
  } catch (error) {
    console.error('Share task with contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Share a task with an email address
const shareTaskWithEmail = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { email, permissionLevel = 'VIEWER' } = req.body;
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
        assigner: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if current user can share
    const isAdminOrSysadmin = req.user.role === 'ADMIN' || req.user.role === 'SYSADMIN';
    const isAssigner = task.assignerId === currentUserId;
    const isLeadAssignee = task.assigneeId === currentUserId;
    if (!(isLeadAssignee || isAssigner || isAdminOrSysadmin)) {
      return res.status(403).json({ error: 'Only the lead assignee, assigner, or admin/sysadmin can share this task' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if task is already shared with this email
    const existingShare = await prisma.taskShare.findFirst({
      where: {
        taskId: parseInt(taskId),
        email: email
      }
    });

    if (existingShare) {
      return res.status(400).json({ error: 'Task is already shared with this email address' });
    }

    // Create the share
    const taskShare = await prisma.taskShare.create({
      data: {
        taskId: parseInt(taskId),
        email: email,
        companyId: companyId,
        permissionLevel: permissionLevel,
        isExternal: true
      }
    });

    // Create a TaskInvitation for the email address
    try {
      const invitation = await prisma.taskInvitation.create({
        data: {
          taskId: task.id,
          senderId: currentUserId,
          recipientEmail: email,
          message: `You have been invited to ${permissionLevel === 'VIEWER' ? 'view' : 'comment on'} a task: "${task.title}"`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'PENDING'
        }
      });

      // Send email invitation
      const emailService = require('../services/emailService');
      await emailService.sendTaskInvitation({
        recipientEmail: email,
        recipientName: email.split('@')[0], // Use email prefix as name
        senderName: req.user.name,
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate
        },
        token: invitation.token,
        message: `You have been invited to ${permissionLevel === 'VIEWER' ? 'view' : 'comment on'} a task: "${task.title}"`
      });
    } catch (emailError) {
      console.error('Error sending email invitation:', emailError);
      // Don't fail the share if email fails
    }

    // Log audit action
    await logAuditActionDirect(req, 'TASK_SHARED', 'TaskShare', {
      entityId: taskShare.id,
      taskTitle: task.title,
      sharedWithName: email,
      metadata: {
        taskId: parseInt(taskId),
        sharedWithEmail: email,
        permissionLevel: permissionLevel
      }
    });

    res.status(201).json(taskShare);
  } catch (error) {
    console.error('Share task with email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  shareTask,
  shareTaskWithContact,
  shareTaskWithEmail,
  unshareTask,
  unshareTaskById,
  getTaskShares,
  getSharedTasks
};
