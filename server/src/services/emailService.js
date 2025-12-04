const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const emailService = {
  /**
   * Generic email sender used by various features
   * @param {Object} params
   * @param {string|string[]} params.to
   * @param {string} params.subject
   * @param {string} [params.html]
   * @param {string} [params.text]
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      console.log('📧 Attempting to send email...');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('From:', process.env.EMAIL_FROM || 'onboarding@resend.dev');
      console.log('Has HTML:', !!html);
      console.log('Has Text:', !!text);
      
      // Check if using test API key
      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
        console.log('⚠️  Using Resend API key');
      } else {
        console.log('⚠️  WARNING: RESEND_API_KEY not configured or invalid!');
      }
      
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to,
        subject,
        html,
        text
      });
      
      console.log('✅ Email sent successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name
      });
      return { success: false, error: error.message };
    }
  },
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
    // Extract first URL from comma-separated CLIENT_URL list
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];
    const invitationLink = `${clientUrl}/task-invitation/${token}`;
    
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
      console.log('📧 Sending feedback email...');
      console.log('From:', process.env.EMAIL_FROM || 'onboarding@resend.dev');
      console.log('To:', 'farouqsyedabdali@gmail.com');
      console.log('Subject:', `💬 New Feedback from ${name}`);
      
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: 'farouqsyedabdali@gmail.com', // Your feedback email
        subject: `💬 New Feedback from ${name}`,
        html,
        replyTo: email, // Allow you to reply directly to the user
      });

      console.log('✅ Feedback email sent successfully:', JSON.stringify(result, null, 2));
      
      // Check for error in response
      if (result.error) {
        console.error('❌ Resend returned an error:', result.error);
        return { success: false, error: result.error.message };
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error sending feedback email:', error);
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name
      });
      return { success: false, error: error.message };
    }
  },

  /**
   * Send a task reminder email
   * @param {Object} params - Reminder parameters
   * @param {string} params.recipientEmail - Recipient's email
   * @param {string} params.userName - User's name
   * @param {Object} params.task - Task details
   * @param {number} params.taskId - Task ID
   */
  async sendTaskReminder({ recipientEmail, userName, task, taskId }) {
    // Extract first URL from comma-separated CLIENT_URL list
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];
    const taskLink = `${clientUrl}/dashboard?taskId=${taskId}`;
    
    const { taskReminderTemplate } = require('../templates/taskReminderEmail');
    const html = taskReminderTemplate({
      userName,
      task,
      taskLink
    });

    try {
      console.log('📧 Sending task reminder email...');
      console.log('To:', recipientEmail);
      console.log('Task:', task.title);
      
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: recipientEmail,
        subject: `⏰ Reminder: "${task.title}" is due in 48 hours`,
        html,
      });

      console.log('✅ Task reminder email sent successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error sending task reminder email:', error);
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name
      });
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;

