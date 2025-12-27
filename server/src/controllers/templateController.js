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
        userId,
        ...(includeCompany === 'true' ? {} : { isPersonal: true })
      };

      // If including company templates, add company templates
      if (includeCompany === 'true') {
        whereClause.companyId = companyId;
      } else {
        whereClause.companyId = companyId;
      }

      const templates = await prisma.projectTemplate.findMany({
        where: whereClause,
        include: {
          tasks: {
            orderBy: { order: 'asc' },
            include: {
              assignee: {
                select: { id: true, name: true, email: true }
              },
              externalContact: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          user: {
            select: { id: true, name: true, email: true }
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
   * Get a specific template by ID
   * GET /api/templates/:id
   */
  async getTemplateById(req, res) {
    try {
      const { companyId, id: userId } = req.user;
      const { id } = req.params;

      const template = await prisma.projectTemplate.findFirst({
        where: {
          id: parseInt(id),
          companyId,
          OR: [
            { userId },
            { isPersonal: false }
          ]
        },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
            include: {
              assignee: {
                select: { id: true, name: true, email: true }
              },
              externalContact: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Get template by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  },

  /**
   * Create a template from an existing project
   * POST /api/templates/from-project/:projectId
   */
  async createFromProject(req, res) {
    try {
      const { companyId, id: userId } = req.user;
      const { projectId } = req.params;
      const { name, description, color, icon, isPersonal } = req.body;

      // Verify project exists and user has access
      const project = await prisma.project.findFirst({
        where: {
          id: parseInt(projectId),
          companyId,
          ownerId: userId
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

      // Create template
      const template = await prisma.projectTemplate.create({
        data: {
          name: name || project.name,
          description: description || project.description,
          color: color || project.color,
          icon: icon || project.icon,
          userId,
          companyId,
          isPersonal: isPersonal !== undefined ? isPersonal : true,
          tasks: {
            create: project.tasks.map((task, index) => ({
              title: task.title,
              description: task.description,
              priority: task.priority,
              assigneeId: task.assigneeId,
              externalContactId: task.externalContactId,
              daysOffset: 0,
              order: index
            }))
          }
        },
        include: {
          tasks: {
            orderBy: { order: 'asc' }
          }
        }
      });

      res.status(201).json(template);
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
      const { companyId, id: userId } = req.user;
      const { id } = req.params;
      const { name, description, color, icon, startDate } = req.body;

      // Get template
      const template = await prisma.projectTemplate.findFirst({
        where: {
          id: parseInt(id),
          companyId,
          OR: [
            { userId },
            { isPersonal: false }
          ]
        },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
            include: {
              assignee: true,
              externalContact: true
            }
          }
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Calculate start date
      const projectStartDate = startDate ? new Date(startDate) : new Date();

      // Create project
      const project = await prisma.project.create({
        data: {
          name: name || template.name,
          description: description || template.description,
          color: color || template.color,
          icon: icon || template.icon,
          ownerId: userId,
          companyId,
          tasks: {
            create: template.tasks.map(task => {
              // Calculate due date based on daysOffset
              const dueDate = task.daysOffset > 0
                ? new Date(projectStartDate.getTime() + task.daysOffset * 24 * 60 * 60 * 1000)
                : null;

              return {
                title: task.title,
                description: task.description,
                priority: task.priority,
                assigneeId: task.assigneeId,
                externalContactId: task.externalContactId,
                assignerId: userId,
                dueDate
              };
            })
          }
        },
        include: {
          tasks: true,
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Update template usage stats
      await prisma.projectTemplate.update({
        where: { id: template.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 }
        }
      });

      res.status(201).json(project);
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
      const { companyId, id: userId } = req.user;
      const { id } = req.params;
      const { name, description, color, icon, isPersonal, tasks } = req.body;

      // Verify template exists and user owns it
      const template = await prisma.projectTemplate.findFirst({
        where: {
          id: parseInt(id),
          companyId,
          userId
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Update template
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (color !== undefined) updateData.color = color;
      if (icon !== undefined) updateData.icon = icon;
      if (isPersonal !== undefined) updateData.isPersonal = isPersonal;

      // If tasks are provided, update them
      if (tasks && Array.isArray(tasks)) {
        // Delete existing tasks
        await prisma.templateTask.deleteMany({
          where: { templateId: template.id }
        });

        // Create new tasks
        updateData.tasks = {
          create: tasks.map((task, index) => ({
            title: task.title,
            description: task.description,
            priority: task.priority || 'MEDIUM',
            assigneeId: task.assigneeId,
            externalContactId: task.externalContactId,
            daysOffset: task.daysOffset || 0,
            order: task.order !== undefined ? task.order : index
          }))
        };
      }

      const updatedTemplate = await prisma.projectTemplate.update({
        where: { id: template.id },
        data: updateData,
        include: {
          tasks: {
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
      const { companyId, id: userId } = req.user;
      const { id } = req.params;

      // Verify template exists and user owns it
      const template = await prisma.projectTemplate.findFirst({
        where: {
          id: parseInt(id),
          companyId,
          userId
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Delete template (tasks will be cascade deleted)
      await prisma.projectTemplate.delete({
        where: { id: template.id }
      });

      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  }
};

module.exports = templateController;
