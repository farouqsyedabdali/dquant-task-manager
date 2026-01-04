const prisma = require('../lib/prisma');
const emailService = require('../services/emailService');
const { createNotification } = require('./notificationController');


// Helper function to check if invitation is expired
const isExpired = (invitation) => {
  if (!invitation.expiresAt) return false;
  return new Date() > new Date(invitation.expiresAt);
};

const taskInvitationController = {
  /**
   * Send a task invitation via email
   * POST /api/tasks/:taskId/send-invitation
   */
  async sendInvitation(req, res) {
    try {
      const { taskId } = req.params;
      const { recipientEmail, message } = req.body;
      const senderId = req.user.id;

      // Validate input
      if (!recipientEmail) {
        return res.status(400).json({ error: 'Recipient email is required' });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Get the task
      const task = await prisma.task.findUnique({
        where: { id: parseInt(taskId) },
        include: {
          assigner: true,
          assignee: true,
        }
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Check if user is the task creator
      if (task.assignerId !== senderId) {
        return res.status(403).json({ error: 'Only the task creator can send invitations' });
      }

      // Check if user is sending to themselves
      const sender = await prisma.user.findUnique({
        where: { id: senderId }
      });

      if (sender.email.toLowerCase() === recipientEmail.toLowerCase()) {
        return res.status(400).json({ error: 'You cannot send a task invitation to yourself' });
      }

      // Check rate limiting: max 10 pending invitations per user per day
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentInvitations = await prisma.taskInvitation.count({
        where: {
          senderId,
          createdAt: { gte: oneDayAgo }
        }
      });

      if (recentInvitations >= 10) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. You can only send 10 invitations per day.' 
        });
      }

      // Check if there's already a pending invitation for this task and email
      const existingInvitation = await prisma.taskInvitation.findFirst({
        where: {
          taskId: parseInt(taskId),
          recipientEmail: recipientEmail.toLowerCase(),
          status: 'PENDING'
        }
      });

      if (existingInvitation && !isExpired(existingInvitation)) {
        return res.status(400).json({ 
          error: 'An invitation has already been sent to this email for this task' 
        });
      }

      // Create invitation
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const invitation = await prisma.taskInvitation.create({
        data: {
          taskId: parseInt(taskId),
          senderId,
          recipientEmail: recipientEmail.toLowerCase(),
          message,
          expiresAt,
          status: 'PENDING'
        }
      });

      // Try to find recipient user by email to link them
      const recipientUser = await prisma.user.findFirst({
        where: {
          email: recipientEmail.toLowerCase()
        }
      });

      if (recipientUser) {
        await prisma.taskInvitation.update({
          where: { id: invitation.id },
          data: { recipientUserId: recipientUser.id }
        });

        // Create a notification for the recipient if they're already a user
        await prisma.notification.create({
          data: {
            type: 'TASK_INVITATION_RECEIVED',
            title: 'New Task Invitation',
            message: `${sender.name} has sent you a task: "${task.title}"`,
            taskId: task.id,
            userId: recipientUser.id,
            companyId: recipientUser.companyId
          }
        });
      }

      // Send email
      const emailResult = await emailService.sendTaskInvitation({
        recipientEmail,
        recipientName: recipientUser?.name || null,
        senderName: sender.name,
        task: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate
        },
        token: invitation.token,
        message
      });

      if (!emailResult.success) {
        return res.status(500).json({ 
          error: 'Failed to send invitation email',
          details: emailResult.error 
        });
      }

      res.status(201).json({
        success: true,
        message: 'Task invitation sent successfully',
        invitation: {
          id: invitation.id,
          recipientEmail: invitation.recipientEmail,
          status: invitation.status,
          expiresAt: invitation.expiresAt
        }
      });

    } catch (error) {
      console.error('Error sending task invitation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get invitation details by token (public endpoint)
   * GET /api/task-invitations/:token
   */
  async getInvitationByToken(req, res) {
    try {
      const { token } = req.params;

      const invitation = await prisma.taskInvitation.findUnique({
        where: { token },
        include: {
          task: {
            include: {
              assigner: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          sender: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      // Check if expired
      if (isExpired(invitation)) {
        // Update status if not already marked as expired
        if (invitation.status === 'PENDING') {
          await prisma.taskInvitation.update({
            where: { id: invitation.id },
            data: { status: 'EXPIRED' }
          });
        }
        return res.status(410).json({ error: 'This invitation has expired' });
      }

      // Check if already responded
      if (invitation.status !== 'PENDING') {
        return res.status(400).json({ 
          error: `This invitation has already been ${invitation.status.toLowerCase()}`,
          status: invitation.status
        });
      }

      res.json({
        invitation: {
          id: invitation.id,
          recipientEmail: invitation.recipientEmail,
          message: invitation.message,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
          status: invitation.status,
          sender: invitation.sender,
          task: {
            id: invitation.task.id,
            title: invitation.task.title,
            description: invitation.task.description,
            priority: invitation.task.priority,
            dueDate: invitation.task.dueDate,
            status: invitation.task.status
          }
        }
      });

    } catch (error) {
      console.error('Error getting invitation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Accept a task invitation
   * POST /api/task-invitations/:token/accept
   */
  async acceptInvitation(req, res) {
    try {
      const { token } = req.params;
      const userId = req.user.id;

      const invitation = await prisma.taskInvitation.findUnique({
        where: { token },
        include: {
          task: true,
          sender: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      // Check if expired
      if (isExpired(invitation)) {
        await prisma.taskInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' }
        });
        return res.status(410).json({ error: 'This invitation has expired' });
      }

      // Check if already responded
      if (invitation.status !== 'PENDING') {
        return res.status(400).json({ 
          error: `This invitation has already been ${invitation.status.toLowerCase()}` 
        });
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      // Verify email matches
      if (user.email.toLowerCase() !== invitation.recipientEmail.toLowerCase()) {
        return res.status(403).json({ 
          error: 'This invitation was sent to a different email address' 
        });
      }

      // Check if this was an assignment (task has externalContactId) or sharing
      const isAssignment = invitation.task.externalContactId !== null;
      
      if (isAssignment) {
        // This was an assignment - make them the lead assignee
        // Keep externalContactId so the assigner can still see them in their contacts dropdown
        await prisma.task.update({
          where: { id: invitation.task.id },
          data: {
            assigneeId: userId
            // DON'T clear externalContactId - keep it for display purposes
          }
        });
        
        // Create notification for the new assignee
        await createNotification(
          'TASK_ASSIGNED',
          'Task Assigned',
          `You have been assigned to task "${invitation.task.title}"`,
          invitation.task.id,
          userId,
          user.companyId
        );
      } else {
        // This was sharing - make them a collaborator and create TaskShare entry
        await prisma.taskCollaborator.create({
          data: {
            taskId: invitation.task.id,
            userId: userId,
            companyId: user.companyId,
            permissionLevel: 'COMMENT', // External collaborators can comment
            isExternal: true // This is an external collaborator
          }
        });

        // Also create a TaskShare entry for consistency
        await prisma.taskShare.create({
          data: {
            taskId: invitation.task.id,
            userId: userId,
            companyId: user.companyId,
            permissionLevel: 'COMMENTER',
            isExternal: true
          }
        });
      }

      // Update invitation status
      await prisma.taskInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
          recipientUserId: userId
        }
      });

      // Create notification for recipient
      await prisma.notification.create({
        data: {
          type: 'TASK_INVITATION_ACCEPTED',
          title: 'Task Invitation Accepted',
          message: `You are now collaborating on: "${invitation.task.title}"`,
          taskId: invitation.task.id,
          userId: userId,
          companyId: user.companyId
        }
      });

      // Create notification for sender
      await prisma.notification.create({
        data: {
          type: 'TASK_INVITATION_ACCEPTED',
          title: 'Task Invitation Accepted',
          message: `${user.name} is now collaborating on: "${invitation.task.title}"`,
          taskId: invitation.task.id,
          userId: invitation.senderId,
          companyId: invitation.sender.companyId || user.companyId
        }
      });

      // Send email notification to sender
      const senderUser = await prisma.user.findUnique({
        where: { id: invitation.senderId }
      });

      if (senderUser) {
        await emailService.sendInvitationAcceptedNotification({
          senderEmail: senderUser.email,
          senderName: senderUser.name,
          recipientName: user.name,
          taskTitle: invitation.task.title
        });
      }

      // Automatically add sender to receiver's contact list if not already a contact
      if (invitation.sender) {
        const existingContact = await prisma.contact.findFirst({
          where: {
            userId: userId,
            email: invitation.sender.email.toLowerCase()
          }
        });

        if (!existingContact) {
          // Create contact for the sender
          await prisma.contact.create({
            data: {
              userId: userId,
              name: invitation.sender.name,
              email: invitation.sender.email.toLowerCase(),
              isPersonal: true // Default to personal contact
            }
          });
        }
      }

      res.json({
        success: true,
        message: 'Task invitation accepted successfully. You are now collaborating on this task.',
        task: invitation.task
      });

    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Decline a task invitation
   * POST /api/task-invitations/:token/decline
   */
  async declineInvitation(req, res) {
    try {
      const { token } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const invitation = await prisma.taskInvitation.findUnique({
        where: { token },
        include: {
          task: true,
          sender: true
        }
      });

      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      // Check if expired
      if (isExpired(invitation)) {
        await prisma.taskInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' }
        });
        return res.status(410).json({ error: 'This invitation has expired' });
      }

      // Check if already responded
      if (invitation.status !== 'PENDING') {
        return res.status(400).json({ 
          error: `This invitation has already been ${invitation.status.toLowerCase()}` 
        });
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      // Verify email matches
      if (user.email.toLowerCase() !== invitation.recipientEmail.toLowerCase()) {
        return res.status(403).json({ 
          error: 'This invitation was sent to a different email address' 
        });
      }

      // Update task with decline reason
      if (reason) {
        await prisma.task.update({
          where: { id: invitation.taskId },
          data: { declinedReason: reason }
        });
      }

      // Update invitation status
      await prisma.taskInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'DECLINED',
          respondedAt: new Date(),
          recipientUserId: userId
        }
      });

      // Create notification for sender
      await prisma.notification.create({
        data: {
          type: 'TASK_INVITATION_DECLINED',
          title: 'Task Invitation Declined',
          message: `${user.name} declined your task invitation: "${invitation.task.title}"`,
          taskId: invitation.task.id,
          userId: invitation.senderId,
          companyId: invitation.sender.companyId
        }
      });

      res.json({
        success: true,
        message: 'Task invitation declined'
      });

    } catch (error) {
      console.error('Error declining invitation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get user's received invitations
   * GET /api/task-invitations/received
   */
  async getReceivedInvitations(req, res) {
    try {
      const userId = req.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      const invitations = await prisma.taskInvitation.findMany({
        where: {
          recipientEmail: user.email.toLowerCase()
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              dueDate: true,
              status: true
            }
          },
          sender: {
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

      res.json({ invitations });

    } catch (error) {
      console.error('Error getting received invitations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get user's sent invitations
   * GET /api/task-invitations/sent
   */
  async getSentInvitations(req, res) {
    try {
      const userId = req.user.id;

      const invitations = await prisma.taskInvitation.findMany({
        where: {
          senderId: userId
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              dueDate: true,
              status: true
            }
          },
          recipient: {
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

      res.json({ invitations });

    } catch (error) {
      console.error('Error getting sent invitations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get pending invitations for current user (based on their email)
   * GET /api/task-invitations/pending
   */
  async getPendingInvitations(req, res) {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;

      // Get all pending invitations sent to this user's email
      const invitations = await prisma.taskInvitation.findMany({
        where: {
          recipientEmail: userEmail.toLowerCase(),
          status: 'PENDING'
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              dueDate: true,
              status: true,
              projectId: true,
              project: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          },
          sender: {
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

      // Filter out expired invitations and update their status
      const validInvitations = [];
      for (const invitation of invitations) {
        if (isExpired(invitation)) {
          // Update status to expired
          await prisma.taskInvitation.update({
            where: { id: invitation.id },
            data: { status: 'EXPIRED' }
          });
        } else {
          validInvitations.push(invitation);
        }
      }

      res.json({
        invitations: validInvitations,
        count: validInvitations.length
      });

    } catch (error) {
      console.error('Error getting pending invitations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Unaccept a task (remove yourself from an accepted task)
   * POST /api/tasks/:taskId/unaccept
   */
  async unaccessTask(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;

      console.log('🔍 Unaccept Debug:', {
        taskId,
        userId,
        userEmail: req.user.email
      });

      // Get the task
      const task = await prisma.task.findUnique({
        where: { id: parseInt(taskId) },
        include: {
          assigner: {
            select: { id: true, name: true, email: true, companyId: true }
          }
        }
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      console.log('📋 Task Info:', {
        taskId: task.id,
        assigneeId: task.assigneeId,
        externalContactId: task.externalContactId,
        assignerId: task.assignerId,
        companyId: task.companyId
      });

      // Verify the current user is the assignee
      if (task.assigneeId !== userId) {
        console.log('❌ Mismatch:', {
          taskAssigneeId: task.assigneeId,
          currentUserId: userId,
          areEqual: task.assigneeId === userId
        });
        return res.status(403).json({ 
          error: 'You are not assigned to this task',
          debug: {
            taskAssigneeId: task.assigneeId,
            yourUserId: userId
          }
        });
      }

      // Don't allow unaccepting completed tasks
      if (task.status === 'COMPLETED') {
        return res.status(400).json({ 
          error: 'Cannot withdraw from a completed task' 
        });
      }

      // Get the user info
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      // Update task - remove assignee and reset status
      await prisma.task.update({
        where: { id: task.id },
        data: {
          assigneeId: null,
          status: 'TODO'
          // Keep externalContactId for assigner's reference
        }
      });

      // Update invitation status
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

      // Create notification for the assigner
      await prisma.notification.create({
        data: {
          type: 'TASK_INVITATION_UNACCEPTED',
          title: 'User Withdrew from Task',
          message: `${user.name} has withdrawn from task "${task.title}". Please reassign this task.`,
          taskId: task.id,
          userId: task.assignerId,
          companyId: task.companyId
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'TASK_UNACCEPTED',
          entityType: 'Task',
          entityId: task.id,
          description: `${user.name} withdrew from task "${task.title}"`,
          userId: userId,
          companyId: user.companyId,
          metadata: {
            taskTitle: task.title,
            assignerId: task.assignerId,
            assignerName: task.assigner.name
          }
        }
      });

      res.json({
        success: true,
        message: 'You have successfully withdrawn from this task'
      });

    } catch (error) {
      console.error('Error unaccepting task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = taskInvitationController;

