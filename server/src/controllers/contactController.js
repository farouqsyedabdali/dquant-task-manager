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

// Delete a contact
const deleteContact = async (req, res) => {
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

    // Check if there are any common tasks between the user and this contact
    // A common task is any task where both the user and contact are involved
    
    // Get all task IDs where the user is involved
    const userTasksAsAssignee = await prisma.task.findMany({
      where: { assigneeId: userId },
      select: { id: true }
    });
    
    const userTasksAsCoAssignee = await prisma.taskCoAssignee.findMany({
      where: { userId: userId },
      select: { taskId: true }
    });
    
    const userTasksAsShared = await prisma.taskShare.findMany({
      where: { userId: userId },
      select: { taskId: true }
    });
    
    const allUserTaskIds = [
      ...userTasksAsAssignee.map(t => t.id),
      ...userTasksAsCoAssignee.map(t => t.taskId),
      ...userTasksAsShared.map(t => t.taskId)
    ];
    
    if (allUserTaskIds.length === 0) {
      // User has no tasks, safe to delete contact
    } else {
      // Check if contact is involved in any of the user's tasks
      // Case 1: Contact is externalContactId in any of user's tasks
      const tasksWithContactAsExternal = await prisma.task.findFirst({
        where: {
          id: { in: allUserTaskIds },
          externalContactId: parseInt(id)
        }
      });
      
      // Case 2: Contact is in TaskShare for any of user's tasks
      const tasksWithContactShared = await prisma.taskShare.findFirst({
        where: {
          taskId: { in: allUserTaskIds },
          contactId: parseInt(id)
        }
      });
      
      // Case 3: Check if contact email matches a registered user
      const contactUser = await prisma.user.findFirst({
        where: {
          email: contact.email.toLowerCase()
        }
      });
      
      let tasksWithContactUser = null;
      if (contactUser) {
        // Check if contact-user is involved in any of user's tasks
        tasksWithContactUser = await prisma.task.findFirst({
          where: {
            id: { in: allUserTaskIds },
            OR: [
              { assigneeId: contactUser.id },
              {
                coAssignees: {
                  some: {
                    userId: contactUser.id
                  }
                }
              },
              {
                shares: {
                  some: {
                    userId: contactUser.id
                  }
                }
              }
            ]
          }
        });
      }
      
      if (tasksWithContactAsExternal || tasksWithContactShared || tasksWithContactUser) {
        return res.status(400).json({ 
          error: 'Cannot delete contact. You have tasks in common with this contact. Please delete all common tasks before removing the contact.' 
        });
      }
    }

    // Delete the contact
    await prisma.contact.delete({
      where: { id: parseInt(id) }
    });

    // Log audit action
    await logAuditActionDirect(req, 'CONTACT_DELETED', 'Contact', {
      entityId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email,
      metadata: {
        isPersonal: contact.isPersonal,
        company: contact.company
      }
    });

    res.json({ message: 'Contact deleted successfully' });
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
  searchContacts
};
