const { format } = require('date-fns');
const { BRAND, emailShell, escapeHtml, card, badge, ctaButton, warningBox, infoBox } = require('./emailBase');

const taskReminderTemplate = ({ userName, task, taskLink }) => {
  const priorityColors = {
    LOW: '#3b82f6',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    URGENT: '#dc2626'
  };

  const statusColors = {
    TODO: '#6b7280',
    IN_PROGRESS: '#3b82f6',
    COMPLETED: '#10b981',
    ON_HOLD: '#f59e0b',
    CANCELLED: '#ef4444'
  };

  const statusLabels = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
    CANCELLED: 'Cancelled'
  };

  const priorityColor = priorityColors[task.priority] || '#6b7280';
  const statusColor = statusColors[task.status] || '#6b7280';
  const statusLabel = statusLabels[task.status] || task.status;

  const formattedDueDate = task.dueDate 
    ? format(new Date(task.dueDate), 'MMMM dd, yyyy')
    : 'No due date';
  
  const formattedDueTime = task.dueDate 
    ? format(new Date(task.dueDate), 'h:mm a')
    : '';

  const hoursUntilDue = task.dueDate 
    ? Math.round((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60))
    : 0;

  const body = `
    <!-- Alert Banner -->
    ${warningBox(`
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px; font-size: 24px;">&#9888;&#65039;</td>
          <td style="vertical-align: middle;">
            <strong style="font-size: 15px;">Upcoming Deadline</strong>
            <p style="margin: 4px 0 0; font-size: 14px;">This task is due in approximately ${hoursUntilDue} hours</p>
          </td>
        </tr>
      </table>
    `)}

    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hi ${escapeHtml(userName)},
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      This is a friendly reminder that the following task is <strong>due in 48 hours</strong>:
    </p>

    <!-- Task Card -->
    ${card(`
      <h2 style="font-size: 20px; font-weight: 700; color: ${BRAND.textDark}; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        ${escapeHtml(task.title)}
      </h2>
      
      ${task.description ? `
        <p style="font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6; margin: 0 0 20px 0; white-space: pre-wrap; max-height: 150px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          ${escapeHtml(task.description)}
        </p>
      ` : ''}

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 16px;">
        <tr>
          <td style="padding: 8px 0;">
            <span style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: ${BRAND.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Priority</span><br>
            ${badge(task.priority, priorityColor)}
          </td>
          <td style="padding: 8px 0;">
            <span style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: ${BRAND.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Status</span><br>
            ${badge(statusLabel, statusColor)}
          </td>
        </tr>
      </table>
    `, ' border: 2px solid #fbbf24;')}

    <!-- Due Date Highlight -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; margin: 20px 0;">
      <tr>
        <td align="center" style="padding: 20px;">
          <p style="font-size: 18px; font-weight: 700; color: #991b1b; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Due: ${formattedDueDate}</p>
          ${formattedDueTime ? `<p style="font-size: 14px; color: #dc2626; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${formattedDueTime}</p>` : ''}
        </td>
      </tr>
    </table>

    ${task.assignee ? infoBox(`
      <strong style="font-size: 12px; text-transform: uppercase;">Assigned By</strong>
      <p style="margin: 4px 0 0; font-weight: 600;">${escapeHtml(task.assignee.name)}</p>
    `) : ''}

    ${ctaButton(taskLink, 'View Task Details')}

    <p style="font-size: 14px; color: ${BRAND.textMuted}; text-align: center; margin: 24px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Click the button above to view the full task details and update its status.
    </p>
  `;

  return emailShell(
    'Task Reminder',
    'Your task is due soon!',
    body,
    `<p style="font-size: 13px; color: ${BRAND.textMuted}; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">You're receiving this because you're assigned to this task.</p>`
  );
};

module.exports = { taskReminderTemplate };
