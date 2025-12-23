const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const templateController = {
  /**
   * Get all templates for the current user
   * GET /api/templates
   */
  async getAllTemplates(req, res) {
    try {
      const { companyId, id: userId } = req.user;
      const { includeCompany } = req.query;

      const whereClause = {
        companyId,
        OR: [
          { userId }, // Personal templates
          ...(includeCompany === 'true' ? [{ isPersonal: false }] : []) // Company templates
        ]
      };

      const templates = await prisma.projectTemplate.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true }
              },
              externalContact: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { tasks: true }
          }
        },
        orderBy: [
          { lastUsedAt: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      res.json(templates);
    } catch (error) {
      console.error('Get all templates error:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  },

  /**
   * Get a single template by ID
   * GET /api/templates/:id
   */
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;

      const template = await prisma.projectTemplate.findFirst({
        where: {
          id: parseInt(id),
          companyId
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true }
              },
              externalContact: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Check access: owner, company-wide template, or admin
      const hasAccess = template.userId === userId || 
                       !template.isPersonal || 
                       ['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role);

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this template' });
      }

      res.json(template);
    } catch (error) {
      console.error('Get template by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  },

  /**
   * Create a template from a project
   * POST /api/templates/from-project/:projectId
   */
  async createFromProject(req, res) {
    try {
      const { projectId } = req.params;
      const { companyId, id: userId } = req.user;
      const { name, isPersonal = true } = req.body;

      // Get the project with all tasks
      const project = await prisma.project.findFirst({
        where: {
          id: parseInt(projectId),
          companyId
        },
        include: {
          tasks: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Only owner can create template from project
      if (project.ownerId !== userId && !['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only project owner can create template' });
      }

      if (project.tasks.length === 0) {
        return res.status(400).json({ error: 'Project must have at least one task to create a template' });
      }

      if (!project.dueDate) {
        return res.status(400).json({ error: 'Project must have a due date to create a template' });
      }

      // Calculate days offset for each task
      const projectDueDate = new Date(project.dueDate);
      projectDueDate.setHours(0, 0, 0, 0);

      const templateTasks = project.tasks.map((task, index) => {
        let daysOffset = 0;
        if (task.dueDate) {
          const taskDueDate = new Date(task.dueDate);
          taskDueDate.setHours(0, 0, 0, 0);
          const diffTime = taskDueDate - projectDueDate;
          daysOffset = Math.round(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          title: task.title,
          description: task.description,
          priority: task.priority,
          assigneeId: task.assigneeId,
          externalContactId: task.externalContactId,
          daysOffset,
          order: index
        };
      });

      // Create the template
      const template = await prisma.projectTemplate.create({
        data: {
          name: name || project.name,
          description: project.description,
          color: project.color,
          icon: project.icon,
          userId,
          companyId,
          isPersonal,
          tasks: {
            create: templateTasks
          }
        },
        include: {
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true }
              },
              externalContact: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'TEMPLATE_CREATED',
          entityType: 'ProjectTemplate',
          entityId: template.id,
          description: `Created template "${template.name}" from project "${project.name}"`,
          userId,
          companyId,
          metadata: {
            templateName: template.name,
            projectId: project.id,
            projectName: project.name,
            taskCount: template.tasks.length
          }
        }
      });

      res.json(template);
    } catch (error) {
      console.error('Create template from project error:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  },

  /**
   * Create a project from a template
   * POST /api/templates/:id/create-project
   */
  async createProjectFromTemplate(req, res) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      const { name, dueDate, description } = req.body;

      if (!dueDate) {
        return res.status(400).json({ error: 'Project due date is required' });
      }

      // Get the template
      const template = await prisma.projectTemplate.findFirst({
        where: {
          id: parseInt(id),
          companyId
        },
        include: {
          tasks: {
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Create the project
      const project = await prisma.project.create({
        data: {
          name: name || template.name,
          description: description || template.description,
          color: template.color,
          icon: template.icon,
          dueDate: new Date(dueDate),
          ownerId: userId,
          companyId,
          status: 'ACTIVE'
        }
      });

      // Calculate task due dates based on offset
      const projectDueDate = new Date(dueDate);
      projectDueDate.setHours(0, 0, 0, 0);

      const taskCreatePromises = template.tasks.map(templateTask => {
        const taskDueDate = new Date(projectDueDate);
        taskDueDate.setDate(taskDueDate.getDate() + templateTask.daysOffset);

        return prisma.task.create({
          data: {
            title: templateTask.title,
            description: templateTask.description,
            priority: templateTask.priority,
            assigneeId: templateTask.assigneeId,
            externalContactId: templateTask.externalContactId,
            dueDate: taskDueDate,
            projectId: project.id,
            assignerId: userId,
            companyId,
            isDraft: true,
            status: 'TODO'
          }
        });
      });

      await Promise.all(taskCreatePromises);

      // Update template usage stats
      await prisma.projectTemplate.update({
        where: { id: parseInt(id) },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PROJECT_CREATED',
          entityType: 'Project',
          entityId: project.id,
          description: `Created project "${project.name}" from template "${template.name}"`,
          userId,
          companyId,
          metadata: {
            projectName: project.name,
            templateId: template.id,
            templateName: template.name,
            taskCount: template.tasks.length
          }
        }
      });

      // Fetch complete project with tasks
      const completeProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true }
              },
              externalContact: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          _count: {
            select: { tasks: true }
          }
        }
      });

      res.json(completeProject);
    } catch (error) {
      console.error('Create project from template error:', error);
      res.status(500).json({ error: 'Failed to create project from template' });
    }
  },

  /**
   * Update a template
   * PUT /api/templates/:id
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      const { name, description, color, icon, isPersonal } = req.body;

      const template = await prisma.projectTemplate.findFirst({
        where: {
          id: parseInt(id),
          companyId
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Only owner or admin can update
      if (template.userId !== userId && !['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only template owner can update' });
      }

      const updatedTemplate = await prisma.projectTemplate.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(color && { color }),
          ...(icon && { icon }),
          ...(isPersonal !== undefined && { isPersonal })
        },
        include: {
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true }
              },
              externalContact: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      res.json(updatedTemplate);
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  },

  /**
   * Delete a template
   * DELETE /api/templates/:id
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;

      const template = await prisma.projectTemplate.findFirst({
        where: {
          id: parseInt(id),
          companyId
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Only owner or admin can delete
      if (template.userId !== userId && !['ADMIN', 'SYSDMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only template owner can delete' });
      }

      await prisma.projectTemplate.delete({
        where: { id: parseInt(id) }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'TEMPLATE_DELETED',
          entityType: 'ProjectTemplate',
          entityId: parseInt(id),
          description: `Deleted template "${template.name}"`,
          userId,
          companyId,
          metadata: {
            templateName: template.name
          }
        }
      });

      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  }
};

module.exports = templateController;

