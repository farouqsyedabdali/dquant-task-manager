const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Project templates with predefined tasks
const PROJECT_TEMPLATES = {
  marketing_campaign: {
    name: 'Marketing Campaign',
    description: 'Launch a new marketing campaign with comprehensive planning',
    icon: '📣',
    color: '#f59e0b',
    tasks: [
      { title: 'Define campaign objectives and KPIs', priority: 'HIGH' },
      { title: 'Identify target audience', priority: 'HIGH' },
      { title: 'Create content strategy', priority: 'MEDIUM' },
      { title: 'Design creative assets', priority: 'MEDIUM' },
      { title: 'Set up campaign tracking', priority: 'MEDIUM' },
      { title: 'Launch campaign', priority: 'HIGH' },
      { title: 'Monitor and optimize', priority: 'LOW' },
      { title: 'Post-campaign analysis', priority: 'LOW' }
    ]
  },
  product_launch: {
    name: 'Product Launch',
    description: 'Plan and execute a successful product launch',
    icon: '🚀',
    color: '#8b5cf6',
    tasks: [
      { title: 'Market research and validation', priority: 'HIGH' },
      { title: 'Define product requirements', priority: 'HIGH' },
      { title: 'Create product roadmap', priority: 'HIGH' },
      { title: 'Design and prototyping', priority: 'MEDIUM' },
      { title: 'Development phase', priority: 'HIGH' },
      { title: 'Quality assurance testing', priority: 'HIGH' },
      { title: 'Create launch marketing materials', priority: 'MEDIUM' },
      { title: 'Prepare sales team', priority: 'MEDIUM' },
      { title: 'Launch day execution', priority: 'URGENT' },
      { title: 'Gather initial feedback', priority: 'LOW' }
    ]
  },
  event_planning: {
    name: 'Event Planning',
    description: 'Organize a successful event from start to finish',
    icon: '🎉',
    color: '#ec4899',
    tasks: [
      { title: 'Define event objectives and budget', priority: 'HIGH' },
      { title: 'Select venue and date', priority: 'HIGH' },
      { title: 'Create guest list', priority: 'MEDIUM' },
      { title: 'Design invitations and send', priority: 'MEDIUM' },
      { title: 'Arrange catering', priority: 'MEDIUM' },
      { title: 'Plan entertainment/speakers', priority: 'MEDIUM' },
      { title: 'Set up registration system', priority: 'LOW' },
      { title: 'Coordinate day-of logistics', priority: 'HIGH' },
      { title: 'Post-event follow-up', priority: 'LOW' }
    ]
  },
  software_development: {
    name: 'Software Development',
    description: 'Build a software feature or application',
    icon: '💻',
    color: '#06b6d4',
    tasks: [
      { title: 'Requirements gathering', priority: 'HIGH' },
      { title: 'Technical specification', priority: 'HIGH' },
      { title: 'UI/UX design', priority: 'MEDIUM' },
      { title: 'Backend development', priority: 'HIGH' },
      { title: 'Frontend development', priority: 'HIGH' },
      { title: 'API integration', priority: 'MEDIUM' },
      { title: 'Unit testing', priority: 'MEDIUM' },
      { title: 'Integration testing', priority: 'MEDIUM' },
      { title: 'Code review', priority: 'HIGH' },
      { title: 'Deployment', priority: 'HIGH' },
      { title: 'Documentation', priority: 'LOW' }
    ]
  },
  content_creation: {
    name: 'Content Creation',
    description: 'Plan and produce content for your audience',
    icon: '✍️',
    color: '#10b981',
    tasks: [
      { title: 'Define content strategy', priority: 'HIGH' },
      { title: 'Research topics and keywords', priority: 'MEDIUM' },
      { title: 'Create content calendar', priority: 'MEDIUM' },
      { title: 'Write first drafts', priority: 'HIGH' },
      { title: 'Edit and proofread', priority: 'HIGH' },
      { title: 'Create visual assets', priority: 'MEDIUM' },
      { title: 'Schedule publishing', priority: 'LOW' },
      { title: 'Promote content', priority: 'MEDIUM' }
    ]
  },
  client_onboarding: {
    name: 'Client Onboarding',
    description: 'Onboard a new client systematically',
    icon: '🤝',
    color: '#3b82f6',
    tasks: [
      { title: 'Initial client meeting', priority: 'HIGH' },
      { title: 'Gather client requirements', priority: 'HIGH' },
      { title: 'Set up client account', priority: 'MEDIUM' },
      { title: 'Create project timeline', priority: 'MEDIUM' },
      { title: 'Assign team members', priority: 'MEDIUM' },
      { title: 'Kickoff meeting', priority: 'HIGH' },
      { title: 'Share access and documentation', priority: 'LOW' },
      { title: 'Schedule regular check-ins', priority: 'LOW' }
    ]
  }
};

const projectController = {
  /**
   * Get all projects for the current user's company
   * GET /api/projects
   */
  async getAllProjects(req, res) {
    try {
      const { companyId, id: userId } = req.user;
      const { status } = req.query;

      // Only show projects owned by the current user
      const whereClause = {
        companyId,
        ownerId: userId,
        ...(status && { status })
      };

      const projects = await prisma.project.findMany({
        where: whereClause,
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          tasks: {
            select: {
              id: true,
              status: true
            }
          },
          _count: {
            select: { tasks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Add computed fields
      const projectsWithStats = projects.map(project => {
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project,
          totalTasks,
          completedTasks,
          progress,
          isOwner: project.ownerId === userId
        };
      });

      res.json(projectsWithStats);
    } catch (error) {
      console.error('Get all projects error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  },

  /**
   * Get a single project by ID
   * GET /api/projects/:id
   */
  async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;

      const project = await prisma.project.findFirst({
        where: {
          id: parseInt(id),
          companyId
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true }
              },
              assigner: {
                select: { id: true, name: true, email: true }
              },
              externalContact: {
                select: { id: true, name: true, email: true }
              },
              coAssignees: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            },
            orderBy: [
              { isDraft: 'desc' },
              { status: 'asc' },
              { priority: 'desc' },
              { createdAt: 'desc' }
            ]
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only project owner can view/manage the project
      const isOwner = project.ownerId === userId;
      const isAdmin = ['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied. Only project owner can view this project.' });
      }

      // Calculate stats
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        ...project,
        totalTasks,
        completedTasks,
        progress,
        isOwner,
        canManage: isOwner || isAdmin
      });
    } catch (error) {
      console.error('Get project by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  },

  /**
   * Create a new project
   * POST /api/projects
   */
  async createProject(req, res) {
    try {
      const { companyId, id: userId } = req.user;
      const { name, description, color, icon, template, dueDate } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      // Validate due date is required and in the future
      if (!dueDate) {
        return res.status(400).json({ error: 'Due date is required' });
      }

      const dueDateObj = new Date(dueDate);
      const now = new Date();
      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({ error: 'Invalid due date format' });
      }
      if (dueDateObj <= now) {
        return res.status(400).json({ error: 'Due date must be in the future' });
      }

      // Get template data if specified
      const templateData = template ? PROJECT_TEMPLATES[template] : null;

      const project = await prisma.project.create({
        data: {
          name: templateData ? templateData.name : name,
          description: description || (templateData ? templateData.description : null),
          color: color || (templateData ? templateData.color : '#6366f1'),
          icon: icon || (templateData ? templateData.icon : '📁'),
          template: template || null,
          dueDate: new Date(dueDate),
          ownerId: userId,
          companyId
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Note: ProjectMember table exists but is not used in current workflow
      // Only project owner can see and manage their projects

      // Create tasks from template if using a template
      if (templateData && templateData.tasks) {
        const taskCreatePromises = templateData.tasks.map((task, index) => 
          prisma.task.create({
            data: {
              title: task.title,
              priority: task.priority,
              status: 'TODO',
              projectId: project.id,
              assignerId: userId,
              isDraft: true,
              companyId
            }
          })
        );
        await Promise.all(taskCreatePromises);
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PROJECT_CREATED',
          entityType: 'Project',
          entityId: project.id,
          description: `Created project "${project.name}"${template ? ` from template "${template}"` : ''}`,
          userId,
          companyId,
          metadata: {
            projectName: project.name,
            template: template || null
          }
        }
      });

      // Fetch the complete project with all relations
      const completeProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          tasks: true,
          _count: {
            select: { tasks: true }
          }
        }
      });

      res.status(201).json(completeProject);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  },

  /**
   * Update a project
   * PUT /api/projects/:id
   */
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      const { name, description, color, icon, status, dueDate } = req.body;

      const project = await prisma.project.findFirst({
        where: { id: parseInt(id), companyId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner or admin can update
      const isOwner = project.ownerId === userId;
      const isAdmin = ['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only the project owner can update this project' });
      }

      // Validate due date if provided
      let finalDueDate = project.dueDate; // Keep existing if not updating
      if (dueDate !== undefined) {
        if (!dueDate) {
          return res.status(400).json({ error: 'Due date is required' });
        }

        const dueDateObj = new Date(dueDate);
        const now = new Date();
        if (isNaN(dueDateObj.getTime())) {
          return res.status(400).json({ error: 'Invalid due date format' });
        }
        if (dueDateObj <= now) {
          return res.status(400).json({ error: 'Due date must be in the future' });
        }
        finalDueDate = new Date(dueDate);
      } else {
        // If due date is not being updated, ensure existing project has a due date
        if (!project.dueDate) {
          return res.status(400).json({ error: 'Project must have a due date. Please provide one.' });
        }
      }

      const updatedProject = await prisma.project.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(color && { color }),
          ...(icon && { icon }),
          ...(status && { status }),
          dueDate: finalDueDate
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { tasks: true }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PROJECT_UPDATED',
          entityType: 'Project',
          entityId: parseInt(id),
          description: `Updated project "${updatedProject.name}"`,
          userId,
          companyId,
          oldValues: project,
          newValues: updatedProject
        }
      });

      res.json(updatedProject);
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  },

  /**
   * Delete a project
   * DELETE /api/projects/:id
   */
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;

      const project = await prisma.project.findFirst({
        where: { id: parseInt(id), companyId },
        include: { tasks: true }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner or admin can delete
      const isOwner = project.ownerId === userId;
      const isAdmin = ['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only the project owner can delete this project' });
      }

      // Delete all tasks associated with the project
      await prisma.task.deleteMany({
        where: { projectId: parseInt(id) }
      });

      // Delete project members
      await prisma.projectMember.deleteMany({
        where: { projectId: parseInt(id) }
      });

      // Delete the project
      await prisma.project.delete({
        where: { id: parseInt(id) }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PROJECT_DELETED',
          entityType: 'Project',
          entityId: parseInt(id),
          description: `Deleted project "${project.name}"`,
          userId,
          companyId,
          metadata: {
            projectName: project.name,
            taskCount: project.tasks.length
          }
        }
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  },

  /**
   * Add a member to a project
   * POST /api/projects/:id/members
   */
  async addMember(req, res) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      const { userId: newMemberId, role = 'MEMBER' } = req.body;

      const project = await prisma.project.findFirst({
        where: { id: parseInt(id), companyId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner can add members
      if (project.ownerId !== userId && !['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only the project owner can add members' });
      }

      // Verify the user to add exists in the same company
      const userToAdd = await prisma.user.findFirst({
        where: { id: newMemberId, companyId }
      });

      if (!userToAdd) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if already a member
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: parseInt(id),
            userId: newMemberId
          }
        }
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member of this project' });
      }

      const member = await prisma.projectMember.create({
        data: {
          projectId: parseInt(id),
          userId: newMemberId,
          role: role === 'OWNER' ? 'MEMBER' : role // Can't add someone as owner
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PROJECT_MEMBER_ADDED',
          entityType: 'ProjectMember',
          entityId: member.id,
          description: `Added ${userToAdd.name} to project "${project.name}"`,
          userId,
          companyId,
          metadata: {
            projectId: parseInt(id),
            projectName: project.name,
            addedUserId: newMemberId,
            addedUserName: userToAdd.name,
            role
          }
        }
      });

      res.status(201).json(member);
    } catch (error) {
      console.error('Add project member error:', error);
      res.status(500).json({ error: 'Failed to add member' });
    }
  },

  /**
   * Remove a member from a project
   * DELETE /api/projects/:id/members/:memberId
   */
  async removeMember(req, res) {
    try {
      const { id, memberId } = req.params;
      const { companyId, id: userId } = req.user;

      const project = await prisma.project.findFirst({
        where: { id: parseInt(id), companyId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner can remove members
      if (project.ownerId !== userId && !['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only the project owner can remove members' });
      }

      // Can't remove the owner
      if (parseInt(memberId) === project.ownerId) {
        return res.status(400).json({ error: 'Cannot remove the project owner' });
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: parseInt(id),
            userId: parseInt(memberId)
          }
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      await prisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: parseInt(id),
            userId: parseInt(memberId)
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PROJECT_MEMBER_REMOVED',
          entityType: 'ProjectMember',
          entityId: member.id,
          description: `Removed ${member.user.name} from project "${project.name}"`,
          userId,
          companyId,
          metadata: {
            projectId: parseInt(id),
            projectName: project.name,
            removedUserId: parseInt(memberId),
            removedUserName: member.user.name
          }
        }
      });

      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Remove project member error:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  },

  /**
   * Add a task to a project
   * POST /api/projects/:id/tasks
   */
  async addTaskToProject(req, res) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      const { taskId, title, description, priority, assigneeId, externalContactId, dueDate } = req.body;

      const project = await prisma.project.findFirst({
        where: { id: parseInt(id), companyId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner can add tasks to project
      const isOwner = project.ownerId === userId;
      const isAdmin = ['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only project owner can add tasks' });
      }

      let task;

      if (taskId) {
        // Add existing task to project
        task = await prisma.task.findFirst({
          where: { id: taskId, companyId }
        });

        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        task = await prisma.task.update({
          where: { id: taskId },
          data: { projectId: parseInt(id) },
          include: {
            assignee: {
              select: { id: true, name: true, email: true }
            },
            assigner: {
              select: { id: true, name: true, email: true }
            }
          }
        });
      } else {
        // Create new task in project
        if (!title) {
          return res.status(400).json({ error: 'Task title is required' });
        }

        // Validate due date is required and in the future
        if (!dueDate) {
          return res.status(400).json({ error: 'Due date is required' });
        }

        // If only date is provided (no time), set default time to 11:59 PM
        let finalDueDate = dueDate;
        if (typeof dueDate === 'string' && !dueDate.includes('T')) {
          // Date only format (YYYY-MM-DD), add 11:59 PM
          finalDueDate = `${dueDate}T23:59:00`;
        } else if (typeof dueDate === 'string' && dueDate.includes('T') && !dueDate.includes(':')) {
          // Date with T but no time (YYYY-MM-DDT), add 11:59 PM
          finalDueDate = `${dueDate}23:59:00`;
        }

        const dueDateObj = new Date(finalDueDate);
        const now = new Date();
        if (isNaN(dueDateObj.getTime())) {
          return res.status(400).json({ error: 'Invalid due date format' });
        }
        if (dueDateObj <= now) {
          return res.status(400).json({ error: 'Due date must be in the future' });
        }

        // Validate that either assigneeId or externalContactId is provided
        if (!assigneeId && !externalContactId) {
          return res.status(400).json({ error: 'Either assignee or external contact is required' });
        }

        // Cannot assign to both internal user and external contact
        if (assigneeId && externalContactId) {
          return res.status(400).json({ error: 'Cannot assign to both internal user and external contact' });
        }

        task = await prisma.task.create({
          data: {
            title,
            description: description || null,
            priority: priority || 'MEDIUM',
            status: 'TODO',
            projectId: parseInt(id),
            assignerId: userId,
            assigneeId: assigneeId ? parseInt(assigneeId) : null,
            externalContactId: externalContactId ? parseInt(externalContactId) : null,
            dueDate: new Date(finalDueDate), // Required, already validated with default 11:59 PM if needed
            isDraft: true,
            companyId
          },
          include: {
            assignee: {
              select: { id: true, name: true, email: true }
            },
            assigner: {
              select: { id: true, name: true, email: true }
            }
          }
        });

        // Create audit log for new task
        await prisma.auditLog.create({
          data: {
            action: 'TASK_CREATED',
            entityType: 'Task',
            entityId: task.id,
            description: `Created task "${task.title}" in project "${project.name}"`,
            userId,
            companyId,
            metadata: {
              taskTitle: task.title,
              projectId: parseInt(id),
              projectName: project.name
            }
          }
        });
      }

      // Create audit log for adding to project
      await prisma.auditLog.create({
        data: {
          action: 'TASK_ADDED_TO_PROJECT',
          entityType: 'Task',
          entityId: task.id,
          description: `Added task "${task.title}" to project "${project.name}"`,
          userId,
          companyId,
          metadata: {
            taskId: task.id,
            taskTitle: task.title,
            projectId: parseInt(id),
            projectName: project.name
          }
        }
      });

      res.status(201).json(task);
    } catch (error) {
      console.error('Add task to project error:', error);
      res.status(500).json({ error: 'Failed to add task to project' });
    }
  },

  /**
   * Remove a task from a project
   * DELETE /api/projects/:id/tasks/:taskId
   */
  async removeTaskFromProject(req, res) {
    try {
      const { id, taskId } = req.params;
      const { companyId, id: userId } = req.user;

      const project = await prisma.project.findFirst({
        where: { id: parseInt(id), companyId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner or admin can remove tasks from project
      if (project.ownerId !== userId && !['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only the project owner can remove tasks' });
      }

      const task = await prisma.task.findFirst({
        where: { id: parseInt(taskId), projectId: parseInt(id) }
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found in this project' });
      }

      // Remove from project (don't delete the task)
      await prisma.task.update({
        where: { id: parseInt(taskId) },
        data: { projectId: null }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'TASK_REMOVED_FROM_PROJECT',
          entityType: 'Task',
          entityId: parseInt(taskId),
          description: `Removed task "${task.title}" from project "${project.name}"`,
          userId,
          companyId,
          metadata: {
            taskId: parseInt(taskId),
            taskTitle: task.title,
            projectId: parseInt(id),
            projectName: project.name
          }
        }
      });

      res.json({ message: 'Task removed from project' });
    } catch (error) {
      console.error('Remove task from project error:', error);
      res.status(500).json({ error: 'Failed to remove task from project' });
    }
  },

  /**
   * Get available project templates (system templates from database)
   * GET /api/projects/templates
   * Query params:
   *   - category: 'PERSONAL' | 'PROFESSIONAL' | 'ALL' (default: 'ALL')
   *   - search: string (searches name and description)
   *   - page: number (default: 1)
   *   - limit: number (default: 50)
   */
  async getTemplates(req, res) {
    try {
      const { companyId } = req.user;
      const { 
        category = 'ALL',
        search = '',
        page = '1',
        limit = '50'
      } = req.query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause for system templates from any company
      const whereClause = {
        isSystemTemplate: true
      };

      // Category filter
      if (category !== 'ALL') {
        whereClause.category = category;
      }

      // Search filter
      if (search.trim()) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get total count
      const total = await prisma.projectTemplate.count({
        where: whereClause
      });

      // Get templates with pagination
      const templates = await prisma.projectTemplate.findMany({
        where: whereClause,
        include: {
          tasks: {
            select: { id: true },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: [
          { lastUsedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      });

      // Format response
      const formattedTemplates = templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        category: template.category,
        taskCount: template.tasks.length
      }));

      res.json({
        templates: formattedTemplates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  },

  /**
   * Send a single draft task
   * POST /api/projects/:id/tasks/:taskId/send
   */
  async sendTask(req, res) {
    try {
      const { id: projectId, taskId } = req.params;
      const { companyId, id: userId } = req.user;
      const { message } = req.body; // Optional custom message for external contacts

      const project = await prisma.project.findFirst({
        where: { id: parseInt(projectId), companyId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner can send tasks
      if (project.ownerId !== userId && !['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only the project owner can send tasks' });
      }

      const task = await prisma.task.findFirst({
        where: {
          id: parseInt(taskId),
          projectId: parseInt(projectId),
          isDraft: true
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          externalContact: { select: { id: true, name: true, email: true } }
        }
      });

      if (!task) {
        return res.status(404).json({ error: 'Draft task not found' });
      }

      // Validate that task has an assignee (either internal or external)
      if (!task.assigneeId && !task.externalContactId) {
        return res.status(400).json({ error: 'Task must have an assignee before it can be sent' });
      }

      // Validate that task has a due date
      if (!task.dueDate) {
        return res.status(400).json({ error: 'Task must have a due date before it can be sent' });
      }

      // Validate due date is in the future
      const dueDateObj = new Date(task.dueDate);
      const now = new Date();
      if (dueDateObj <= now) {
        return res.status(400).json({ error: 'Task due date must be in the future before it can be sent' });
      }

      // Update task to mark as sent
      const updatedTask = await prisma.task.update({
        where: { id: parseInt(taskId) },
        data: {
          isDraft: false,
          sentAt: new Date()
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          externalContact: { select: { id: true, name: true, email: true } }
        }
      });

      // Handle internal employee assignment
      if (task.assigneeId && task.assignee) {
        // Create notification for internal employee
        await prisma.notification.create({
          data: {
            type: 'PROJECT_TASK_SENT',
            title: 'New Task Assigned',
            message: `You've been assigned a task: "${task.title}" in project "${project.name}"`,
            taskId: task.id,
            userId: task.assigneeId,
            companyId
          }
        });

        // TODO: Send email notification to internal employee
        // This will be added in Phase 5
      }

      // Handle external contact assignment
      if (task.externalContactId && task.externalContact) {
        // Create task invitation for external contact
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const invitation = await prisma.taskInvitation.create({
          data: {
            taskId: task.id,
            senderId: userId,
            recipientEmail: task.externalContact.email,
            message: message || `You have been invited to work on a task: "${task.title}" in project "${project.name}"`,
            expiresAt,
            status: 'PENDING'
          }
        });

        // TODO: Send email invitation to external contact
        // This will be added in Phase 5
        const emailService = require('../services/emailService');
        await emailService.sendTaskInvitation({
          recipientEmail: task.externalContact.email,
          recipientName: task.externalContact.name,
          senderName: req.user.name,
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate
          },
          token: invitation.token,
          message: message || `You have been invited to work on a task in project "${project.name}"`
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'TASK_CREATED',
          entityType: 'Task',
          entityId: task.id,
          description: `Sent task "${task.title}" from project "${project.name}"`,
          userId,
          companyId,
          metadata: {
            taskTitle: task.title,
            projectId: parseInt(projectId),
            projectName: project.name,
            assigneeType: task.assigneeId ? 'internal' : 'external',
            assigneeName: task.assignee?.name || task.externalContact?.name
          }
        }
      });

      res.json(updatedTask);
    } catch (error) {
      console.error('Send task error:', error);
      res.status(500).json({ error: 'Failed to send task' });
    }
  },

  /**
   * Send all draft tasks in a project
   * POST /api/projects/:id/tasks/send-all
   */
  async sendAllDraftTasks(req, res) {
    try {
      const { id: projectId } = req.params;
      const { companyId, id: userId } = req.user;

      const project = await prisma.project.findFirst({
        where: { id: parseInt(projectId), companyId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner can send tasks
      if (project.ownerId !== userId && !['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only the project owner can send tasks' });
      }

      // Get all draft tasks
      const draftTasks = await prisma.task.findMany({
        where: {
          projectId: parseInt(projectId),
          isDraft: true
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          externalContact: { select: { id: true, name: true, email: true } }
        }
      });

      if (draftTasks.length === 0) {
        return res.status(400).json({ error: 'No draft tasks to send' });
      }

      // Validate all tasks have assignees and valid due dates
      const now = new Date();
      for (const task of draftTasks) {
        if (!task.assigneeId && !task.externalContactId) {
          return res.status(400).json({ 
            error: `Task "${task.title}" must have an assignee before it can be sent` 
          });
        }
        if (!task.dueDate) {
          return res.status(400).json({ 
            error: `Task "${task.title}" must have a due date before it can be sent` 
          });
        }
        const dueDateObj = new Date(task.dueDate);
        if (dueDateObj <= now) {
          return res.status(400).json({ 
            error: `Task "${task.title}" due date must be in the future before it can be sent` 
          });
        }
      }

      const emailService = require('../services/emailService');
      const sentTasks = [];

      // Send each task
      for (const task of draftTasks) {
        // Update task to mark as sent
        const updatedTask = await prisma.task.update({
          where: { id: task.id },
          data: {
            isDraft: false,
            sentAt: new Date()
          }
        });

        sentTasks.push(updatedTask);

        // Handle internal employee assignment
        if (task.assigneeId && task.assignee) {
          await prisma.notification.create({
            data: {
              type: 'PROJECT_TASK_SENT',
              title: 'New Task Assigned',
              message: `You've been assigned a task: "${task.title}" in project "${project.name}"`,
              taskId: task.id,
              userId: task.assigneeId,
              companyId
            }
          });
        }

        // Handle external contact assignment
        if (task.externalContactId && task.externalContact) {
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const invitation = await prisma.taskInvitation.create({
            data: {
              taskId: task.id,
              senderId: userId,
              recipientEmail: task.externalContact.email,
              message: `You have been invited to work on a task: "${task.title}" in project "${project.name}"`,
              expiresAt,
              status: 'PENDING'
            }
          });

          // Send email
          await emailService.sendTaskInvitation({
            recipientEmail: task.externalContact.email,
            recipientName: task.externalContact.name,
            senderName: req.user.name,
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              dueDate: task.dueDate
            },
            token: invitation.token,
            message: `You have been invited to work on a task in project "${project.name}"`
          });
        }
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PROJECT_UPDATED',
          entityType: 'Project',
          entityId: parseInt(projectId),
          description: `Sent ${sentTasks.length} tasks from project "${project.name}"`,
          userId,
          companyId,
          metadata: {
            projectId: parseInt(projectId),
            projectName: project.name,
            taskCount: sentTasks.length
          }
        }
      });

      res.json({ 
        message: `Successfully sent ${sentTasks.length} tasks`,
        tasks: sentTasks
      });
    } catch (error) {
      console.error('Send all draft tasks error:', error);
      res.status(500).json({ error: 'Failed to send tasks' });
    }
  },

  /**
   * Reassign a task (typically after decline)
   * PUT /api/projects/:id/tasks/:taskId/reassign
   */
  async reassignTask(req, res) {
    try {
      const { id: projectId, taskId } = req.params;
      const { companyId, id: userId } = req.user;
      const { assigneeId, externalContactId, message } = req.body;

      const project = await prisma.project.findFirst({
        where: { id: parseInt(projectId), companyId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner can reassign tasks
      if (project.ownerId !== userId && !['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only the project owner can reassign tasks' });
      }

      const task = await prisma.task.findFirst({
        where: {
          id: parseInt(taskId),
          projectId: parseInt(projectId)
        }
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Update task assignment and reset to draft
      const updatedTask = await prisma.task.update({
        where: { id: parseInt(taskId) },
        data: {
          assigneeId: assigneeId ? parseInt(assigneeId) : null,
          externalContactId: externalContactId ? parseInt(externalContactId) : null,
          isDraft: true, // Reset to draft - owner must send again
          sentAt: null,
          declinedReason: null, // Clear previous decline reason
          status: 'TODO' // Reset status
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          externalContact: { select: { id: true, name: true, email: true } }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PROJECT_TASK_REASSIGNED',
          entityType: 'Task',
          entityId: parseInt(taskId),
          description: `Reassigned task "${task.title}" in project "${project.name}"`,
          userId,
          companyId,
          metadata: {
            taskTitle: task.title,
            projectId: parseInt(projectId),
            projectName: project.name,
            newAssigneeType: assigneeId ? 'internal' : 'external',
            newAssigneeName: updatedTask.assignee?.name || updatedTask.externalContact?.name
          }
        }
      });

      res.json(updatedTask);
    } catch (error) {
      console.error('Reassign task error:', error);
      res.status(500).json({ error: 'Failed to reassign task' });
    }
  }
};

module.exports = projectController;

