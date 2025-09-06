const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { createNotification } = require('./notificationController')

// Get tasks based on user role and assignments
const getTasks = async (req, res) => {
  try {
    const { status, priority, search, type = 'all', dueDateFilter } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    let whereClause = {
      companyId: companyId // Always filter by company
    };

    // Filter by task type
    if (type === 'assigned-to-me') {
      // Show tasks where user is lead assignee OR co-assignee
      whereClause.OR = [
        { assigneeId: userId },
        { coAssignees: { some: { userId: userId } } }
      ];
    } else if (type === 'created-by-me') {
      whereClause.assignerId = userId;
    } else if (userRole === 'EMPLOYEE') {
      // Employees see tasks assigned to them, tasks they created, and tasks they're co-assigned to
      whereClause.OR = [
        { assigneeId: userId },
        { assignerId: userId },
        { coAssignees: { some: { userId: userId } } }
      ];
    }
    // Admins see all tasks (no additional filtering)

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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
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
      id: parseInt(id),
      companyId: companyId // Always filter by company
    };

    // Check if user has access to this task
    if (userRole === 'EMPLOYEE') {
      whereClause.OR = [
        { assigneeId: userId },
        { assignerId: userId },
        { coAssignees: { some: { userId: userId } } }
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
    const { title, description, priority, assigneeId, parentTaskId, dueDate } = req.body;
    const assignerId = req.user.id;
    const companyId = req.user.companyId;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!assigneeId) {
      return res.status(400).json({ error: 'Assignee is required' });
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
        assigneeId: parseInt(assigneeId),
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

    // Create notification for the assignee
    if (task.assigneeId !== assignerId) {
      await createNotification(
        'TASK_CREATED',
        'New Task Assigned',
        `You have been assigned a new task: "${task.title}"`,
        task.id,
        task.assigneeId,
        companyId
      );
    }

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

    // Create notifications for the assignee (if different from updater)
    if (updatedTask.assigneeId !== userId) {
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
          default:
            notificationType = 'TASK_UPDATED';
            title = 'Task Updated';
            message = `Task "${updatedTask.title}" has been updated`;
        }
        
        await createNotification(
          notificationType,
          title,
          message,
          updatedTask.id,
          updatedTask.assigneeId,
          companyId
        );
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

    // Create notification for the co-assignee
    await createNotification({
      type: 'TASK_ASSIGNED',
      title: 'Added as Co-Assignee',
      message: `You have been added as a co-assignee to task: ${task.title}`,
      taskId: parseInt(taskId),
      userId: parseInt(userId),
      companyId: companyId
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
