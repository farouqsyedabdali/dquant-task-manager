const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Get tasks based on user role and assignments
const getTasks = async (req, res) => {
  try {
    const { status, priority, search, type = 'all' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    let whereClause = {
      companyId: companyId // Always filter by company
    };

    // Filter by task type
    if (type === 'assigned-to-me') {
      whereClause.assigneeId = userId;
    } else if (type === 'created-by-me') {
      whereClause.assignerId = userId;
    } else if (userRole === 'EMPLOYEE') {
      // Employees see tasks assigned to them and tasks they created
      whereClause.OR = [
        { assigneeId: userId },
        { assignerId: userId }
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
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
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
        { assignerId: userId }
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
    const { title, description, priority, assigneeId, parentTaskId } = req.body;
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
        assigneeId: updateData.assigneeId
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

module.exports = {
  getTasks,
  getTask,
  createTask,
  createSubtask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskPriority
};
