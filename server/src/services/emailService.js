const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const emailService = {
  /**
   * Send a task invitation email
   * @param {Object} params - Email parameters
   * @param {string} params.recipientEmail - Recipient's email
   * @param {string} params.recipientName - Recipient's name (if known)
   * @param {string} params.senderName - Sender's name
   * @param {Object} params.task - Task details
   * @param {string} params.token - Invitation token
   * @param {string} params.message - Optional personal message
   */
  async sendTaskInvitation({ recipientEmail, recipientName, senderName, task, token, message }) {
    const invitationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/task-invitation/${token}`;
    
    const { taskInvitationTemplate } = require('../templates/taskInvitationEmail');
    const html = taskInvitationTemplate({
      recipientName,
      senderName,
      task,
      invitationLink,
      message
    });

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: recipientEmail,
        subject: `You've received a task from ${senderName}`,
        html,
      });

      console.log('Email sent successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send a notification when task invitation is accepted
   * @param {Object} params - Email parameters
   */
  async sendInvitationAcceptedNotification({ senderEmail, senderName, recipientName, taskTitle }) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .badge { display: inline-block; background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Task Invitation Accepted! ✅</h1>
            </div>
            <div class="content">
              <p>Hi ${senderName},</p>
              <p><strong>${recipientName}</strong> has accepted your task invitation:</p>
              <p style="font-size: 18px; font-weight: bold; color: #667eea;">📋 ${taskTitle}</p>
              <p>They can now view and work on this task from their account.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 14px;">This is an automated notification from your Task Manager.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: senderEmail,
        subject: `${recipientName} accepted your task invitation`,
        html,
      });

      console.log('Acceptance notification sent:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending acceptance notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send user feedback email
   * @param {Object} params - Feedback parameters
   */
  async sendFeedback({ name, email, feedback, userInfo }) {
    const { feedbackEmailTemplate } = require('../templates/feedbackEmail');
    const html = feedbackEmailTemplate({
      name,
      email,
      feedback,
      userInfo
    });

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: 'farouqsyedabdali@gmail.com', // Your feedback email
        subject: `💬 New Feedback from ${name}`,
        html,
        replyTo: email, // Allow you to reply directly to the user
      });

      console.log('Feedback email sent successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending feedback email:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;

