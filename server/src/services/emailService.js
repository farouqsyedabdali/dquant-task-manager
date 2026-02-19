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
    
    // Check if recipient is a registered user
    const prisma = require('../lib/prisma');
    const isRegisteredUser = await prisma.user.findFirst({
      where: { email: recipientEmail.toLowerCase() }
    }) !== null;
    
    const { taskInvitationTemplate } = require('../templates/taskInvitationEmail');
    const html = taskInvitationTemplate({
      recipientName,
      senderName,
      task,
      invitationLink,
      message,
      isRegisteredUser
    });

    const text = `You've received a task from ${senderName}\n\n${recipientName ? `Hi ${recipientName},` : 'Hello,'}\n\n${senderName} has sent you a task: "${task.title}"\nPriority: ${task.priority}\nDue: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}\n${message ? `\nMessage: "${message}"\n` : ''}\nView and respond: ${invitationLink}\n\nThis invitation expires in 7 days.\n\n© ${new Date().getFullYear()} Tialz. All rights reserved.`;

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: recipientEmail,
        subject: `You've received a task from ${senderName}`,
        html,
        text,
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
    const { invitationAcceptedTemplate } = require('../templates/invitationAcceptedEmail');
    const html = invitationAcceptedTemplate({ senderName, recipientName, taskTitle });

    const text = `Hi ${senderName},\n\n${recipientName} has accepted your task invitation: "${taskTitle}"\n\nThey can now view and work on this task from their account.\n\n© ${new Date().getFullYear()} Tialz. All rights reserved.`;

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: senderEmail,
        subject: `${recipientName} accepted your task invitation`,
        html,
        text,
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
      console.log('To:', 'feedback@tialz.com');
      console.log('Subject:', `💬 New Feedback from ${name}`);
      
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: 'feedback@tialz.com', // Your feedback email
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
      
      const text = `Task Reminder: "${task.title}" is due in 48 hours\n\nHi ${userName},\n\nThis is a reminder that your task "${task.title}" is due soon.\nPriority: ${task.priority}\nStatus: ${task.status}\nDue: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}\n\nView task: ${taskLink}\n\n© ${new Date().getFullYear()} Tialz. All rights reserved.`;

      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: recipientEmail,
        subject: `Reminder: "${task.title}" is due in 48 hours`,
        html,
        text,
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

