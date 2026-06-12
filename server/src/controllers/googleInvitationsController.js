const prisma = require('../lib/prisma');
const emailService = require('../services/emailService');
const googleContactsService = require('../services/googleContactsService');
const { createNotification } = require('./notificationController');
const { logAuditActionDirect } = require('../middleware/auditLogger');

const googleInvitationsController = {
  /**
   * Send task invitations to multiple Google contacts
   * POST /api/tasks/:taskId/send-google-invitations
   */
  sendGoogleInvitations: async (req, res) => {
    try {
      const { taskId } = req.params;
      const { googleContactIds, message } = req.body;
      const senderId = req.user.id;

      // Validate input
      if (!Array.isArray(googleContactIds) || googleContactIds.length === 0) {
        return res.status(400).json({ error: 'Google contact IDs array is required' });
      }

      if (googleContactIds.length > 20) {
        return res.status(400).json({ error: 'Cannot send more than 20 invitations at once' });
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

      // Get sender with Google tokens
      const sender = await prisma.user.findUnique({
        where: { id: senderId }
      });

      if (!googleContactsService.hasContactsAccess(sender)) {
        return res.status(403).json({
          error: 'Google contacts access not available. Please reconnect your Google account.'
        });
      }

      // Rate limiting: max 50 Google invitations per user per day
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentGoogleInvitations = await prisma.taskInvitation.count({
        where: {
          senderId,
          createdAt: { gte: oneDayAgo },
          // You could add a field to track Google vs regular invitations
        }
      });

      if (recentGoogleInvitations >= 50) {
        return res.status(429).json({
          error: 'Rate limit exceeded. You can only send 50 Google contact invitations per day.'
        });
      }

      // Fetch Google contacts to get email addresses
      const contactsResult = await googleContactsService.getContacts(sender, { limit: 500 });
      const googleContacts = contactsResult.contacts;

      // Find selected contacts
      const selectedContacts = googleContacts.filter(contact =>
        googleContactIds.includes(contact.googleId)
      );

      if (selectedContacts.length === 0) {
        return res.status(400).json({ error: 'No valid Google contacts found' });
      }

      // Prepare invitation results
      const results = {
        successful: [],
        failed: [],
        skipped: []
      };

      // Process each contact
      for (const googleContact of selectedContacts) {
        try {
          // Check if user is sending to themselves
          if (sender.email.toLowerCase() === googleContact.email.toLowerCase()) {
            results.skipped.push({
              email: googleContact.email,
              name: googleContact.name,
              reason: 'Cannot send invitation to yourself'
            });
            continue;
          }

          // Check if recipient already has an account
          const existingUser = await prisma.user.findFirst({
            where: {
              email: googleContact.email.toLowerCase()
            }
          });

          // Check if there's already a pending invitation for this task and email
          const existingInvitation = await prisma.taskInvitation.findFirst({
            where: {
              taskId: parseInt(taskId),
              recipientEmail: googleContact.email.toLowerCase(),
              status: 'PENDING'
            }
          });

          if (existingInvitation) {
            results.skipped.push({
              email: googleContact.email,
              name: googleContact.name,
              reason: 'Invitation already sent to this email'
            });
            continue;
          }

          // Create invitation
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
          const invitation = await prisma.taskInvitation.create({
            data: {
              taskId: parseInt(taskId),
              senderId,
              recipientEmail: googleContact.email.toLowerCase(),
              recipientUserId: existingUser?.id || null,
              message: message || `Hi ${googleContact.name}, I'd like to invite you to collaborate on this task.`,
              expiresAt,
              status: 'PENDING'
            }
          });

          // Send email invitation
          const invitationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/task-invitation/${invitation.id}`;

          const emailHtml = await this.generateInvitationEmail({
            recipientName: googleContact.name,
            senderName: sender.name,
            taskTitle: task.title,
            taskDescription: task.description,
            invitationUrl,
            customMessage: message,
            expiresAt
          });

          const emailResult = await emailService.sendEmail({
            to: googleContact.email,
            subject: `${sender.name} invited you to collaborate on "${task.title}"`,
            html: emailHtml
          });

          if (emailResult.success) {
            results.successful.push({
              email: googleContact.email,
              name: googleContact.name,
              invitationId: invitation.id
            });

            // Create notification if recipient is a registered user
            if (existingUser) {
              await createNotification(
                'TASK_INVITATION_RECEIVED',
                'Task Invitation',
                `${sender.name} invited you to collaborate on "${task.title}"`,
                task.id,
                existingUser.id,
                existingUser.companyId
              );
            }

            // Log audit action
            await logAuditActionDirect(req, 'TASK_INVITATION_SENT', 'TaskInvitation', {
              entityId: invitation.id,
              taskId: task.id,
              recipientEmail: googleContact.email,
              invitationType: 'google_contact',
              metadata: {
                googleContactId: googleContact.googleId,
                recipientName: googleContact.name
              }
            });

          } else {
            // Email failed, but invitation was created
            results.failed.push({
              email: googleContact.email,
              name: googleContact.name,
              reason: 'Email delivery failed',
              invitationId: invitation.id
            });
          }

        } catch (contactError) {
          console.error(`Error processing invitation for ${googleContact.email}:`, contactError);
          results.failed.push({
            email: googleContact.email,
            name: googleContact.name,
            reason: contactError.message
          });
        }
      }

      res.json({
        success: true,
        results,
        summary: {
          total: googleContactIds.length,
          successful: results.successful.length,
          failed: results.failed.length,
          skipped: results.skipped.length
        }
      });

    } catch (error) {
      console.error('Error sending Google contact invitations:', error);
      res.status(500).json({
        error: 'Failed to send invitations',
        details: error.message
      });
    }
  },

  /**
   * Generate invitation email HTML
   */
  generateInvitationEmail: async ({ recipientName, senderName, taskTitle, taskDescription, invitationUrl, customMessage, expiresAt }) => {
    const expiryDate = expiresAt.toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Task Invitation</h1>
            <p>You've been invited to collaborate!</p>
          </div>

          <div class="content">
            <h2>Hello ${recipientName}!</h2>

            <p><strong>${senderName}</strong> has invited you to collaborate on a task:</p>

            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333;">${taskTitle}</h3>
              ${taskDescription ? `<p style="color: #666; margin-bottom: 0;">${taskDescription}</p>` : ''}
            </div>

            ${customMessage ? `<p><em>"${customMessage}"</em></p>` : ''}

            <p>Click the button below to view the task and accept or decline the invitation:</p>

            <div style="text-align: center;">
              <a href="${invitationUrl}" class="button">View Task Invitation</a>
            </div>

            <p><strong>Invitation expires on:</strong> ${expiryDate}</p>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px; font-family: monospace;">${invitationUrl}</p>
          </div>

          <div class="footer">
            <p>This invitation was sent from Tialz Task Manager. If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

module.exports = googleInvitationsController;