const prisma = require('../lib/prisma');
const emailService = require('../services/emailService');


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

      // Create a copy of the task for the recipient
      const newTask = await prisma.task.create({
        data: {
          title: invitation.task.title,
          description: invitation.task.description 
            ? `${invitation.task.description}\n\n[Shared by: ${invitation.sender.name}]`
            : `[Shared by: ${invitation.sender.name}]`,
          priority: invitation.task.priority,
          dueDate: invitation.task.dueDate,
          status: 'TODO', // Reset to TODO
          assignerId: userId, // User assigns it to themselves
          assigneeId: userId,
          companyId: user.companyId
        }
      });

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
          message: `You accepted the task invitation: "${newTask.title}"`,
          taskId: newTask.id,
          userId: userId,
          companyId: user.companyId
        }
      });

      // Create notification for sender
      await prisma.notification.create({
        data: {
          type: 'TASK_INVITATION_ACCEPTED',
          title: 'Task Invitation Accepted',
          message: `${user.name} accepted your task invitation: "${invitation.task.title}"`,
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

      res.json({
        success: true,
        message: 'Task invitation accepted successfully',
        task: newTask
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
  }
};

module.exports = taskInvitationController;

