const { Resend } = require('resend');
const secureLogger = require('../middleware/secureLogger');

const resend = new Resend(process.env.RESEND_API_KEY);

const logEmailError = (message, error) => {
  secureLogger.error(message, {
    message: error.message,
    statusCode: error.statusCode,
    name: error.name
  });
};

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
      secureLogger.info('Sending email', {
        recipientCount: Array.isArray(to) ? to.length : 1,
        hasSubject: !!subject,
        hasHtml: !!html,
        hasText: !!text
      });
      
      if (!process.env.RESEND_API_KEY) {
        secureLogger.warn('RESEND_API_KEY is not configured');
      }
      
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to,
        subject,
        html,
        text
      });
      
      secureLogger.info('Email sent successfully', { emailId: result?.data?.id || result?.id });
      return { success: true, data: result };
    } catch (error) {
      logEmailError('Error sending email', error);
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
      where: {
        email: recipientEmail.toLowerCase(),
        companyId: task.companyId
      }
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

      secureLogger.info('Task invitation email sent successfully', { emailId: result?.data?.id || result?.id });
      return { success: true, data: result };
    } catch (error) {
      logEmailError('Error sending task invitation email', error);
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

      secureLogger.info('Invitation acceptance notification sent', { emailId: result?.data?.id || result?.id });
      return { success: true, data: result };
    } catch (error) {
      logEmailError('Error sending acceptance notification', error);
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
      secureLogger.info('Sending feedback email');
      
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: 'feedback@tialz.com', // Your feedback email
        subject: `💬 New Feedback from ${name}`,
        html,
        replyTo: email, // Allow you to reply directly to the user
      });

      secureLogger.info('Feedback email sent successfully', { emailId: result?.data?.id || result?.id });
      
      // Check for error in response
      if (result.error) {
        secureLogger.error('Resend returned an error', { message: result.error.message });
        return { success: false, error: result.error.message };
      }
      
      return { success: true, data: result };
    } catch (error) {
      logEmailError('Error sending feedback email', error);
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
      secureLogger.info('Sending task reminder email', { taskId });
      
      const text = `Task Reminder: "${task.title}" is due in 48 hours\n\nHi ${userName},\n\nThis is a reminder that your task "${task.title}" is due soon.\nPriority: ${task.priority}\nStatus: ${task.status}\nDue: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}\n\nView task: ${taskLink}\n\n© ${new Date().getFullYear()} Tialz. All rights reserved.`;

      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: recipientEmail,
        subject: `Reminder: "${task.title}" is due in 48 hours`,
        html,
        text,
      });

      secureLogger.info('Task reminder email sent successfully', { taskId, emailId: result?.data?.id || result?.id });
      return { success: true, data: result };
    } catch (error) {
      logEmailError('Error sending task reminder email', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;

