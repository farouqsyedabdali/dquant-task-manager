const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { createNotification, notifyTaskUsers } = require('./notificationController')
const { logAuditActionDirect } = require('../middleware/auditLogger')
const { autoChangeStatusToInProgress, markStatusAsManuallyChanged } = require('../utils/autoStatusManager')

// Get tasks based on user role and assignments
const getTasks = async (req, res) => {
  try {
    const { status, priority, search, type = 'all', dueDateFilter } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    let whereClause = {
      archived: false // Exclude archived tasks from main dashboard
    };

    // Filter by task type
    if (type === 'assigned-to-me') {
      // Show tasks where user is lead assignee, co-assignee, shared with them, or collaborating
      whereClause.OR = [
        { assigneeId: userId },
        { coAssignees: { some: { userId: userId } } },
        { sharedWith: { some: { userId: userId } } },
        { collaborators: { some: { userId: userId, companyId: companyId } } }
      ];
    } else if (type === 'created-by-me') {
      whereClause.assignerId = userId;
    } else if (userRole === 'EMPLOYEE') {
      // Employees see tasks assigned to them, tasks they created, tasks they're co-assigned to, shared with them, or collaborating
      whereClause.OR = [
        { assigneeId: userId },
        { assignerId: userId },
        { coAssignees: { some: { userId: userId } } },
        { sharedWith: { some: { userId: userId } } },
        { collaborators: { some: { userId: userId, companyId: companyId } } }
      ];
    } else {
      // Admins see all tasks in their company OR tasks they're collaborating on
      whereClause.OR = [
        { companyId: companyId },
        { collaborators: { some: { userId: userId, companyId: companyId } } }
      ];
    }

    // Add filters
    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (search) {
      // If OR clause already exists (for employee permissions), we need to combine it with search
      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR }, // Keep the employee permission filter
          { 
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          }
        ];
        delete whereClause.OR; // Remove the original OR since it's now in AND
      } else {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
    }

    // Add due date filtering
    if (dueDateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dueDateFilter) {
        case 'overdue':
          whereClause.dueDate = {
            lt: today,
            not: null
          };
          break;
        case 'due-today':
          whereClause.dueDate = {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          };
          break;
        case 'due-this-week':
          const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          whereClause.dueDate = {
            gte: today,
            lt: endOfWeek
          };
          break;
        case 'due-this-month':
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          whereClause.dueDate = {
            gte: today,
            lte: endOfMonth
          };
          break;
        case 'no-due-date':
          whereClause.dueDate = null;
          break;
      }
    }

    // Fetch all tasks user can see
    const tasks = await prisma.task.findMany({
      where: whereClause,
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
        parentTask: {
          select: {
            id: true,
            title: true,
            assignerId: true,
            assigneeId: true
          }
        },
        subtasks: {
          where: {
            OR: [
              { assigneeId: userId },
              { assignerId: userId }
            ]
          },
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
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            company: {
              select: {
                id: true,
                name: true
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
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Sort by urgency (priority and due date)
    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    tasks.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // If same priority, sort by due date (earliest first, nulls last)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // If no due date or same due date, sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Remove parentTask info if user is not assigner/assignee of parent
    const filteredTasks = tasks.map(task => {
      if (task.parentTask &&
        task.parentTask.assignerId !== userId &&
        task.parentTask.assigneeId !== userId
      ) {
        return { ...task, parentTask: null };
      }
      // Remove assignerId/assigneeId from parentTask for frontend cleanliness
      if (task.parentTask) {
        const { assignerId, assigneeId, ...rest } = task.parentTask;
        return { ...task, parentTask: rest };
      }
      return task;
    });

    res.json(filteredTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Debug endpoint to check company data
const debugCompanyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    // Get basic stats
    const allTasks = await prisma.task.findMany({
      where: { companyId },
      select: { id: true, title: true, assignerId: true, assigneeId: true, parentTaskId: true }
    });

    const userInvolvedTasks = await prisma.task.findMany({
      where: {
        companyId,
        OR: [
          { assigneeId: userId },
          { assignerId: userId }
        ]
      },
      select: { id: true, title: true, assignerId: true, assigneeId: true, parentTaskId: true }
    });

    const potentialParents = allTasks.filter(task => !task.parentTaskId);
    const userVisibleParents = userInvolvedTasks.filter(task => !task.parentTaskId);

    res.json({
      debug: true,
      user: { id: userId, role: userRole, companyId },
      stats: {
        totalTasks: allTasks.length,
        userInvolvedTasks: userInvolvedTasks.length,
        totalPotentialParents: potentialParents.length,
        userVisibleParents: userVisibleParents.length
      },
      tasks: allTasks,
      userTasks: userInvolvedTasks
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
};

// Get single task
const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    let whereClause = { 
      id: parseInt(id)
    };

    // Check if user has access to this task
    if (userRole === 'EMPLOYEE') {
      whereClause.OR = [
        // Internal company access
        { 
          AND: [
            { companyId: companyId },
            {
              OR: [
                { assigneeId: userId },
                { assignerId: userId },
                { coAssignees: { some: { userId: userId } } },
                { sharedWith: { some: { userId: userId } } }
              ]
            }
          ]
        },
        // External collaborator access
        { 
          collaborators: { 
            some: { 
              userId: userId,
              companyId: companyId
            }
          }
        }
      ];
    } else {
      // Admins can see all tasks in their company OR tasks they're collaborating on
      whereClause.OR = [
        { companyId: companyId },
        { 
          collaborators: { 
            some: { 
              userId: userId,
              companyId: companyId
            }
          }
        }
      ];
    }

    // Only allow access if user is assigner or assignee of this task
    const task = await prisma.task.findFirst({
      where: whereClause,
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
        parentTask: {
          select: {
            id: true,
            title: true,
            assignerId: true,
            assigneeId: true
          }
        },
        subtasks: {
          where: {
            OR: [
              { assigneeId: userId },
              { assignerId: userId }
            ]
          },
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

    // Remove parentTask info if user is not assigner/assignee of parent
    let filteredTask = { ...task };
    if (
      filteredTask.parentTask &&
      filteredTask.parentTask.assignerId !== userId &&
      filteredTask.parentTask.assigneeId !== userId
    ) {
      filteredTask.parentTask = null;
    } else if (filteredTask.parentTask) {
      // Remove assignerId/assigneeId from parentTask for frontend cleanliness
      const { assignerId, assigneeId, ...rest } = filteredTask.parentTask;
      filteredTask.parentTask = rest;
    }

    res.json(filteredTask);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create task (anyone can create tasks)
const createTask = async (req, res) => {
  try {
    const { title, description, priority, assigneeId, externalContactId, parentTaskId, dueDate } = req.body;
    const assignerId = req.user.id;
    const companyId = req.user.companyId;


    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // For personal accounts, allow tasks without assignee (self-assigned)
    // For company accounts, require either assigneeId or externalContactId
    if (!req.user.isPersonal) {
      if (!assigneeId && !externalContactId) {
        return res.status(400).json({ error: 'Either assignee or external contact is required' });
      }

      if (assigneeId && externalContactId) {
        return res.status(400).json({ error: 'Cannot assign to both internal user and external contact' });
      }
    }

    let assignee = null;
    let externalContact = null;

    // Verify internal assignee exists in the same company
    if (assigneeId) {
      assignee = await prisma.user.findFirst({
        where: {
          id: parseInt(assigneeId),
          companyId: companyId
        }
      });

      if (!assignee) {
        return res.status(400).json({ error: 'Assignee not found in your company' });
      }
    }

    // Verify external contact exists and belongs to the user
    if (externalContactId) {
      externalContact = await prisma.contact.findFirst({
        where: {
          id: parseInt(externalContactId),
          userId: assignerId
        }
      });

      if (!externalContact) {
        return res.status(400).json({ error: 'External contact not found in your contacts' });
      }
    }

    // If this is a subtask, verify parent task exists and user has access
    if (parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: {
          id: parseInt(parentTaskId),
          companyId: companyId,
          OR: [
            { assigneeId: req.user.id }, // User is assignee
            { assignerId: req.user.id }  // User is assigner
          ]
        }
      });

      if (!parentTask) {
        return res.status(400).json({ error: 'Parent task not found or you do not have permission to create subtasks for it' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        assignerId,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        externalContactId: externalContactId ? parseInt(externalContactId) : null,
        parentTaskId: parentTaskId ? parseInt(parentTaskId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        companyId
      },
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
        externalContact: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            isPersonal: true
          }
        },
        parentTask: {
          select: {
            id: true,
            title: true
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
        }
      }
    });

    // Create notification for the assignee (only for internal users)
    if (task.assigneeId && task.assigneeId !== assignerId) {
      await createNotification(
        'TASK_CREATED',
        'New Task Assigned',
        `You have been assigned a new task: "${task.title}"`,
        task.id,
        task.assigneeId,
        companyId
      );
    }

    // Send email invitation to external contact if assigned
    if (task.externalContactId && task.externalContact) {
      try {
        const emailService = require('../services/emailService');
        
        // Create a task invitation for the external contact
        const invitation = await prisma.taskInvitation.create({
          data: {
            taskId: task.id,
            senderId: assignerId,
            recipientEmail: task.externalContact.email,
            message: `You have been assigned a new task: "${task.title}"`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'PENDING'
          }
        });

        // Send email invitation
        await emailService.sendTaskInvitation({
          recipientEmail: task.externalContact.email,
          recipientName: task.externalContact.name,
          senderName: task.assigner.name,
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate
          },
          token: invitation.token,
          message: `You have been assigned a new task: "${task.title}"`
        });

        console.log(`✅ Email invitation sent to external contact: ${task.externalContact.email}`);
      } catch (error) {
        console.error('❌ Error sending email invitation to external contact:', error);
        // Don't fail the task creation if email fails
      }
    }

    // If this is a subtask, notify the parent task's creator and co-assignees
    if (parentTaskId) {
      await notifyTaskUsers(
        'SUBTASK_CREATED',
        'New Subtask Created',
        `A new subtask "${task.title}" was created for one of your tasks`,
        parseInt(parentTaskId),
        assignerId, // Don't notify the subtask creator
        companyId
      );
    }

    // Log audit action
    const assigneeName = task.assignee ? task.assignee.name : task.externalContact.name;
    await logAuditActionDirect(req, 'TASK_CREATED', 'Task', {
      entityId: task.id,
      taskTitle: task.title,
      assigneeName: assigneeName,
      metadata: {
        priority: task.priority,
        dueDate: task.dueDate,
        isSubtask: !!parentTaskId,
        isExternalContact: !!task.externalContactId
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update task (assigner can edit, assignee can only change status)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;
    const updateData = req.body;

    // Find the task first to check permissions
    const task = await prisma.task.findFirst({
      where: { 
        id: parseInt(id),
        companyId: companyId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    const isAdmin = userRole === 'ADMIN';
    const isAssigner = task.assignerId === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isAdmin && !isAssigner && !isAssignee) {
      return res.status(403).json({ error: 'You do not have permission to update this task' });
    }

    // Determine what can be updated
    let allowedUpdates = {};
    
    if (isAdmin || isAssigner) {
      // Assigner and admin can update everything
      allowedUpdates = {
        title: updateData.title,
        description: updateData.description,
        priority: updateData.priority,
        status: updateData.status,
        assigneeId: updateData.assigneeId,
        externalContactId: updateData.externalContactId,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : null
      };
    } else if (isAssignee) {
      // Assignee can only update status
      allowedUpdates = {
        status: updateData.status
      };
    }

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: allowedUpdates,
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
        parentTask: {
          select: {
            id: true,
            title: true
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
        }
      }
    });

    // Create notifications for changes
    const changes = [];
    if (updateData.title && updateData.title !== task.title) {
      changes.push('title');
    }
    if (updateData.description && updateData.description !== task.description) {
      changes.push('description');
    }
    if (updateData.status && updateData.status !== task.status) {
      changes.push('status');
    }
    if (updateData.priority && updateData.priority !== task.priority) {
      changes.push('priority');
    }
    if (updateData.assigneeId && updateData.assigneeId !== task.assigneeId) {
      changes.push('assignee');
    }
    if (updateData.dueDate) {
      const oldDate = task.dueDate ? new Date(task.dueDate).getTime() : null;
      const newDate = new Date(updateData.dueDate).getTime();
      if (oldDate !== newDate) {
        changes.push('dueDate');
      }
    }

    // Create notifications for all relevant users (creator, assignee, co-assignees)
    for (const change of changes) {
      let notificationType, title, message;
      
      switch (change) {
        case 'status':
          notificationType = 'TASK_STATUS_CHANGED';
          title = 'Task Status Updated';
          message = `Task "${updatedTask.title}" status changed to ${updatedTask.status}`;
          break;
        case 'priority':
          notificationType = 'TASK_PRIORITY_CHANGED';
          title = 'Task Priority Updated';
          message = `Task "${updatedTask.title}" priority changed to ${updatedTask.priority}`;
          break;
        case 'assignee':
          notificationType = 'TASK_ASSIGNED';
          title = 'Task Assigned';
          message = `You have been assigned to task "${updatedTask.title}"`;
          break;
        case 'dueDate':
          notificationType = 'TASK_UPDATED';
          title = 'Task Due Date Changed';
          message = `Task "${updatedTask.title}" due date has been updated`;
          break;
        default:
          notificationType = 'TASK_UPDATED';
          title = 'Task Updated';
          message = `Task "${updatedTask.title}" has been updated`;
      }
      
      // Notify creator, lead assignee, and all co-assignees
      await notifyTaskUsers(
        notificationType,
        title,
        message,
        updatedTask.id,
        userId,
        companyId
      );
    }

    // Log audit action for task update
    const auditChanges = [];
    if (updateData.title && updateData.title !== task.title) {
      auditChanges.push(`title from "${task.title}" to "${updateData.title}"`);
    }
    if (updateData.description && updateData.description !== task.description) {
      auditChanges.push(`description`);
    }
    if (updateData.priority && updateData.priority !== task.priority) {
      auditChanges.push(`priority from "${task.priority}" to "${updateData.priority}"`);
    }
    if (updateData.status && updateData.status !== task.status) {
      auditChanges.push(`status from "${task.status}" to "${updateData.status}"`);
    }
    if (updateData.assigneeId && updateData.assigneeId !== task.assigneeId) {
      auditChanges.push(`assignee`);
    }
    if (updateData.dueDate !== undefined) {
      auditChanges.push(`due date`);
    }

    // If status was changed and the user is the creator (assigner), mark as manually changed
    if (updateData.status && updateData.status !== task.status && isAssigner) {
      await markStatusAsManuallyChanged(parseInt(id), companyId);
    }

    if (auditChanges.length > 0) {
      await logAuditActionDirect(req, 'TASK_UPDATED', 'Task', {
        entityId: updatedTask.id,
        taskTitle: updatedTask.title,
        oldValues: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate
        },
        newValues: allowedUpdates,
        metadata: {
          changes: auditChanges.join(', '),
          updatedBy: isAdmin ? 'admin' : isAssigner ? 'assigner' : 'assignee'
        }
      });
    }

    // Send email invitation to external contact if newly assigned
    if (updateData.externalContactId && updateData.externalContactId !== task.externalContactId) {
      try {
        // Get the external contact details
        const externalContact = await prisma.contact.findFirst({
          where: {
            id: parseInt(updateData.externalContactId),
            userId: userId
          }
        });

        if (externalContact) {
          const emailService = require('../services/emailService');
          
          // Create a task invitation for the external contact
          const invitation = await prisma.taskInvitation.create({
            data: {
              taskId: updatedTask.id,
              senderId: userId,
              recipientEmail: externalContact.email,
              message: `You have been assigned a task: "${updatedTask.title}"`,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              status: 'PENDING'
            }
          });

          // Send email invitation
          await emailService.sendTaskInvitation({
            recipientEmail: externalContact.email,
            recipientName: externalContact.name,
            senderName: updatedTask.assigner.name,
            task: {
              id: updatedTask.id,
              title: updatedTask.title,
              description: updatedTask.description,
              priority: updatedTask.priority,
              dueDate: updatedTask.dueDate
            },
            token: invitation.token,
            message: `You have been assigned a task: "${updatedTask.title}"`
          });

          console.log(`✅ Email invitation sent to external contact: ${externalContact.email}`);
        }
      } catch (error) {
        console.error('❌ Error sending email invitation to external contact:', error);
        // Don't fail the task update if email fails
      }
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete task (admin or assigner can delete)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    // Find the task first to check permissions
    const task = await prisma.task.findFirst({
      where: { 
        id: parseInt(id),
        companyId: companyId
      },
      include: {
        subtasks: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    const isAdmin = userRole === 'ADMIN';
    const isAssigner = task.assignerId === userId;

    if (!isAdmin && !isAssigner) {
      return res.status(403).json({ error: 'You do not have permission to delete this task' });
    }

    // Check if task has incomplete subtasks
    const incompleteSubtasks = task.subtasks.filter(subtask => subtask.status !== 'COMPLETED');
    if (incompleteSubtasks.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete task with incomplete subtasks. Please complete or delete all subtasks first.' 
      });
    }

    // Notify all relevant users before deletion
    await notifyTaskUsers(
      'TASK_DELETED',
      'Task Deleted',
      `Task "${task.title}" has been deleted`,
      task.id,
      userId, // Don't notify the person who deleted it
      companyId
    );

    // Log audit action before deletion
    await logAuditActionDirect(req, 'TASK_DELETED', 'Task', {
      entityId: task.id,
      taskTitle: task.title,
      oldValues: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        assigneeId: task.assigneeId,
        assignerId: task.assignerId,
        dueDate: task.dueDate
      },
      metadata: {
        deletedBy: isAdmin ? 'admin' : 'assigner',
        subtasksCount: task.subtasks.length
      }
    });

    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update task status (assigner or assignee can update)
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Find the task first to check permissions
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        companyId: companyId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    const isAdmin = userRole === 'ADMIN';
    const isAssigner = task.assignerId === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isAdmin && !isAssigner && !isAssignee) {
      return res.status(403).json({ error: 'You do not have permission to update this task status' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { status },
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
        parentTask: {
          select: {
            id: true,
            title: true
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
        }
      }
    });

    // If status was changed and the user is the creator (assigner), mark as manually changed
    if (status !== task.status && isAssigner) {
      await markStatusAsManuallyChanged(parseInt(id), companyId);
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update task priority (admin or assigner can update)
const updateTaskPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    if (!priority) {
      return res.status(400).json({ error: 'Priority is required' });
    }

    // Find the task first to check permissions
    const task = await prisma.task.findFirst({
      where: { 
        id: parseInt(id),
        companyId: companyId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    const isAdmin = userRole === 'ADMIN';
    const isAssigner = task.assignerId === userId;

    if (!isAdmin && !isAssigner) {
      return res.status(403).json({ error: 'You do not have permission to update this task priority' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { priority },
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
        parentTask: {
          select: {
            id: true,
            title: true
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
        }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task priority error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create subtask (assigner or assignee of any task can create subtasks for it)
const createSubtask = async (req, res) => {
  try {
    const { id } = req.params; // parent task id
    const { title, description, priority, assigneeId } = req.body;
    const assignerId = req.user.id;
    const companyId = req.user.companyId;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!assigneeId) {
      return res.status(400).json({ error: 'Assignee is required' });
    }

    // Verify parent task exists and user is assigner or assignee (works for any task, including subtasks)
    const parentTask = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        companyId: companyId,
        OR: [
          { assigneeId: req.user.id }, // User is assignee
          { assignerId: req.user.id }  // User is assigner
        ]
      }
    });

    if (!parentTask) {
      return res.status(404).json({ error: 'Parent task not found or you do not have permission to create subtasks for it' });
    }

    // Verify assignee exists in the same company
    const assignee = await prisma.user.findFirst({
      where: {
        id: parseInt(assigneeId),
        companyId: companyId
      }
    });

    if (!assignee) {
      return res.status(400).json({ error: 'Assignee not found in your company' });
    }

    const subtask = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        assignerId,
        assigneeId: parseInt(assigneeId),
        parentTaskId: parseInt(id),
        companyId
      },
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
        parentTask: {
          select: {
            id: true,
            title: true
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
        }
      }
    });

    // Auto-change parent task status from TODO to IN_PROGRESS if this is the first subtask
    // and status hasn't been manually changed by the creator
    await autoChangeStatusToInProgress(parseInt(id), companyId);

    res.status(201).json(subtask);
  } catch (error) {
    console.error('Create subtask error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add co-assignee to task
const addCoAssignee = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;
    const companyId = req.user.companyId;

    console.log('Adding co-assignee for taskId:', taskId, 'userId:', userId, 'companyId:', companyId);

    // Get the task to check permissions
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(taskId),
        companyId: companyId
      },
      include: {
        assignee: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if current user is the lead assignee
    if (task.assigneeId !== currentUserId) {
      return res.status(403).json({ error: 'Only the lead assignee can add co-assignees' });
    }

    // Check if user exists and is in the same company
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        companyId: companyId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a co-assignee
    const existingCoAssignee = await prisma.taskCoAssignee.findFirst({
      where: {
        taskId: parseInt(taskId),
        userId: parseInt(userId)
      }
    });

    if (existingCoAssignee) {
      return res.status(400).json({ error: 'User is already a co-assignee' });
    }

    // Add co-assignee
    const coAssignee = await prisma.taskCoAssignee.create({
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
        }
      }
    });

    // Notify the new co-assignee
    await createNotification(
      'TASK_ASSIGNED',
      'Added as Co-Assignee',
      `You have been added as a co-assignee to task: ${task.title}`,
      parseInt(taskId),
      parseInt(userId),
      companyId
    );
    
    // Also notify creator, lead assignee, and other co-assignees
    await notifyTaskUsers(
      'CO_ASSIGNEE_ADDED',
      'Co-Assignee Added',
      `A new co-assignee was added to task: ${task.title}`,
      parseInt(taskId),
      req.user.id, // Actor (person who added the co-assignee)
      companyId,
      { includeCoAssignees: true } // Notify other co-assignees too
    );

    // Log audit action
    await logAuditActionDirect(req, 'CO_ASSIGNEE_ADDED', 'CoAssignee', {
      entityId: coAssignee.id,
      taskTitle: task.title,
      coAssigneeName: user.name,
      metadata: {
        taskId: parseInt(taskId),
        coAssigneeId: parseInt(userId)
      }
    });

    res.status(201).json(coAssignee);
  } catch (error) {
    console.error('Add co-assignee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove co-assignee from task
const removeCoAssignee = async (req, res) => {
  try {
    const { id: taskId, userId } = req.params;
    const currentUserId = req.user.id;
    const companyId = req.user.companyId;

    console.log('Removing co-assignee for taskId:', taskId, 'userId:', userId, 'companyId:', companyId);

    // Get the task to check permissions
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(taskId),
        companyId: companyId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if current user is the lead assignee
    if (task.assigneeId !== currentUserId) {
      return res.status(403).json({ error: 'Only the lead assignee can remove co-assignees' });
    }

    // Get user information for audit log
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        companyId: companyId
      }
    });

    // Log audit action before deletion
    if (user) {
      await logAuditActionDirect(req, 'CO_ASSIGNEE_REMOVED', 'CoAssignee', {
        entityId: parseInt(userId),
        taskTitle: task.title,
        coAssigneeName: user.name,
        metadata: {
          taskId: parseInt(taskId),
          coAssigneeId: parseInt(userId)
        }
      });
    }

    // Notify the removed co-assignee
    await createNotification(
      'CO_ASSIGNEE_REMOVED',
      'Removed as Co-Assignee',
      `You have been removed as a co-assignee from task: ${task.title}`,
      parseInt(taskId),
      parseInt(userId),
      companyId
    );

    // Notify creator, lead assignee, and other co-assignees
    await notifyTaskUsers(
      'CO_ASSIGNEE_REMOVED',
      'Co-Assignee Removed',
      `A co-assignee was removed from task: ${task.title}`,
      parseInt(taskId),
      currentUserId, // Actor (person who removed the co-assignee)
      companyId,
      { includeCoAssignees: true } // Notify remaining co-assignees
    );

    // Remove co-assignee
    await prisma.taskCoAssignee.deleteMany({
      where: {
        taskId: parseInt(taskId),
        userId: parseInt(userId)
      }
    });

    res.status(200).json({ message: 'Co-assignee removed successfully' });
  } catch (error) {
    console.error('Remove co-assignee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get co-assignees for a task
const getCoAssignees = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const companyId = req.user.companyId;

    console.log('Getting co-assignees for taskId:', taskId, 'companyId:', companyId);

    const coAssignees = await prisma.taskCoAssignee.findMany({
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
      }
    });

    res.status(200).json(coAssignees);
  } catch (error) {
    console.error('Get co-assignees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  createSubtask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskPriority,
  debugCompanyTasks,
  addCoAssignee,
  removeCoAssignee,
  getCoAssignees
};
