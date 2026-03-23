const prisma = require('../lib/prisma');
const { logAuditActionDirect } = require('../middleware/auditLogger');

// Get all contacts for a user
const getContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, type } = req.query; // type: 'personal' | 'business' | 'all'


    let whereClause = {
      userId: userId
    };

    // Filter by contact type
    if (type === 'personal') {
      whereClause.isPersonal = true;
    } else if (type === 'business') {
      whereClause.isPersonal = false;
    }

    // Search functionality
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    const contacts = await prisma.contact.findMany({
      where: whereClause,
      orderBy: [
        { isPersonal: 'desc' }, // Personal contacts first
        { name: 'asc' }
      ]
    });

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a specific contact
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const contact = await prisma.contact.findFirst({
      where: {
        id: parseInt(id),
        userId: userId
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new contact
const createContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, company, phone, isPersonal = true } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if contact already exists for this user
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId: userId,
        email: email.toLowerCase()
      }
    });

    if (existingContact) {
      return res.status(400).json({ error: 'Contact with this email already exists' });
    }

    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        userId: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        isPersonal: isPersonal
      }
    });

    // Log audit action
    await logAuditActionDirect(req, 'CONTACT_CREATED', 'Contact', {
      entityId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email,
      metadata: {
        isPersonal: contact.isPersonal,
        company: contact.company
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a contact
const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, email, company, phone, isPersonal } = req.body;

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: parseInt(id),
        userId: userId
      }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if new email conflicts with another contact
    if (email && email.toLowerCase() !== existingContact.email) {
      const emailConflict = await prisma.contact.findFirst({
        where: {
          userId: userId,
          email: email.toLowerCase(),
          id: { not: parseInt(id) }
        }
      });

      if (emailConflict) {
        return res.status(400).json({ error: 'Contact with this email already exists' });
      }
    }

    // Update the contact
    const updatedContact = await prisma.contact.update({
      where: { id: parseInt(id) },
      data: {
        name: name?.trim(),
        email: email?.toLowerCase().trim(),
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        isPersonal: isPersonal
      }
    });

    // Log audit action
    await logAuditActionDirect(req, 'CONTACT_UPDATED', 'Contact', {
      entityId: updatedContact.id,
      contactName: updatedContact.name,
      contactEmail: updatedContact.email,
      metadata: {
        isPersonal: updatedContact.isPersonal,
        company: updatedContact.company
      }
    });

    res.json(updatedContact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get preview of tasks affected by contact deletion
const getContactDeletionPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: parseInt(id),
        userId: userId
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if contact email matches a registered user
    const contactUser = await prisma.user.findFirst({
      where: {
        email: contact.email.toLowerCase()
      }
    });

    if (!contactUser) {
      // Contact is not a registered user, no tasks will be affected
      return res.json({
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email
        },
        tasksYouAreAssignedTo: [],
        tasksYouAssignedToThem: [],
        totalTaskCount: 0
      });
    }

    // Find tasks in BOTH directions:
    
    // 1. Tasks where YOU are assigned BY the contact
    const tasksYouAreAssignedTo = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        assignerId: contactUser.id,
        status: { not: 'COMPLETED' }
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 2. Tasks where YOU assigned TO the contact
    const tasksYouAssignedToThem = await prisma.task.findMany({
      where: {
        assigneeId: contactUser.id,
        assignerId: userId,
        status: { not: 'COMPLETED' }
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email
      },
      tasksYouAreAssignedTo,
      tasksYouAssignedToThem,
      totalTaskCount: tasksYouAreAssignedTo.length + tasksYouAssignedToThem.length
    });
  } catch (error) {
    console.error('Get contact deletion preview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a contact (soft delete with task withdrawal)
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userCompanyId = req.user.companyId;

    // Check if contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: parseInt(id),
        userId: userId
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if contact email matches a registered user
    const contactUser = await prisma.user.findFirst({
      where: {
        email: contact.email.toLowerCase()
      }
    });

    let withdrawnFromTaskCount = 0;
    let unassignedTaskCount = 0;

    if (contactUser) {
      // DIRECTION 1: Tasks where current user is assigned BY the contact
      // Action: Withdraw current user from these tasks
      const tasksYouAreAssignedTo = await prisma.task.findMany({
        where: {
          assigneeId: userId,
          assignerId: contactUser.id,
          status: { not: 'COMPLETED' }
        },
        include: {
          invitations: {
            where: {
              recipientUserId: userId,
              status: 'ACCEPTED'
            }
          }
        }
      });

      for (const task of tasksYouAreAssignedTo) {
        // Do not withdraw from internal (same-company) assignments — same rule as POST /tasks/:id/unaccept
        if (contactUser.companyId === req.user.companyId) {
          continue;
        }

        // Update task: remove assignee and reset to TODO
        await prisma.task.update({
          where: { id: task.id },
          data: {
            assigneeId: null,
            status: 'TODO'
          }
        });

        // Update task invitation status to UNACCEPTED
        if (task.invitations.length > 0) {
          await prisma.taskInvitation.updateMany({
            where: {
              taskId: task.id,
              recipientUserId: userId,
              status: 'ACCEPTED'
            },
            data: {
              status: 'UNACCEPTED',
              respondedAt: new Date()
            }
          });
        }

        // Notify the assigner (contact)
        await prisma.notification.create({
          data: {
            type: 'TASK_INVITATION_UNACCEPTED',
            title: 'Task Withdrawn',
            message: `${req.user.name} has withdrawn from the task "${task.title}"`,
            userId: contactUser.id,
            companyId: contactUser.companyId,
            taskId: task.id
          }
        });

        // Log audit action
        await logAuditActionDirect(req, 'TASK_UNACCEPTED', 'Task', {
          entityId: task.id,
          taskTitle: task.title,
          assignerId: contactUser.id,
          assignerName: contactUser.name,
          metadata: {
            reason: 'Contact deleted - withdrew from task',
            previousStatus: task.status
          }
        });

        withdrawnFromTaskCount++;
      }

      // DIRECTION 2: Tasks where current user assigned TO the contact
      // Action: Unassign contact from these tasks
      const tasksYouAssignedToThem = await prisma.task.findMany({
        where: {
          assigneeId: contactUser.id,
          assignerId: userId,
          status: { not: 'COMPLETED' }
        },
        include: {
          invitations: {
            where: {
              recipientUserId: contactUser.id,
              status: 'ACCEPTED'
            }
          }
        }
      });

      for (const task of tasksYouAssignedToThem) {
        // Update task: remove assignee and reset to TODO
        await prisma.task.update({
          where: { id: task.id },
          data: {
            assigneeId: null,
            status: 'TODO'
          }
        });

        // Update task invitation status to UNACCEPTED
        if (task.invitations.length > 0) {
          await prisma.taskInvitation.updateMany({
            where: {
              taskId: task.id,
              recipientUserId: contactUser.id,
              status: 'ACCEPTED'
            },
            data: {
              status: 'UNACCEPTED',
              respondedAt: new Date()
            }
          });
        }

        // Notify the contact (they're being unassigned)
        await prisma.notification.create({
          data: {
            type: 'TASK_INVITATION_UNACCEPTED',
            title: 'Task Unassigned',
            message: `You have been unassigned from the task "${task.title}" by ${req.user.name}`,
            userId: contactUser.id,
            companyId: contactUser.companyId,
            taskId: task.id
          }
        });

        // Log audit action
        await logAuditActionDirect(req, 'TASK_UNACCEPTED', 'Task', {
          entityId: task.id,
          taskTitle: task.title,
          assigneeId: contactUser.id,
          assigneeName: contactUser.name,
          metadata: {
            reason: 'Contact deleted - unassigned from task',
            previousStatus: task.status
          }
        });

        unassignedTaskCount++;
      }
    }

    // Delete the contact
    await prisma.contact.delete({
      where: { id: parseInt(id) }
    });

    // Log contact deletion
    await logAuditActionDirect(req, 'CONTACT_DELETED', 'Contact', {
      entityId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email,
      metadata: {
        isPersonal: contact.isPersonal,
        company: contact.company,
        withdrawnFromTaskCount,
        unassignedTaskCount
      }
    });

    res.json({ 
      message: 'Contact deleted successfully',
      withdrawnFromTaskCount,
      unassignedTaskCount
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search contacts (for task assignment)
const searchContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const contacts = await prisma.contact.findMany({
      where: {
        userId: userId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        isPersonal: true
      },
      orderBy: [
        { name: 'asc' }
      ],
      take: parseInt(limit)
    });

    res.json(contacts);
  } catch (error) {
    console.error('Search contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getContactDeletionPreview,
  searchContacts
};
