const { format } = require('date-fns');
const { BRAND, emailShell, escapeHtml } = require('./emailBase');

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
    <div class="warning-box" style="display: flex; align-items: center; gap: 12px;">
      <div style="font-size: 24px;">&#9888;&#65039;</div>
      <div>
        <strong style="font-size: 15px;">Upcoming Deadline</strong>
        <p style="margin: 4px 0 0; font-size: 14px;">This task is due in approximately ${hoursUntilDue} hours</p>
      </div>
    </div>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">
      Hi ${escapeHtml(userName)},
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
      This is a friendly reminder that the following task is <strong>due in 48 hours</strong>:
    </p>

    <!-- Task Card -->
    <div class="card" style="border: 2px solid #fbbf24;">
      <h2 style="font-size: 20px; font-weight: 700; color: ${BRAND.textDark}; margin: 0 0 16px 0;">
        ${escapeHtml(task.title)}
      </h2>
      
      ${task.description ? `
        <p style="font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap; max-height: 150px; overflow: hidden;">
          ${escapeHtml(task.description)}
        </p>
      ` : ''}

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 16px;">
        <tr>
          <td style="padding: 8px 0;">
            <span style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: ${BRAND.textMuted};">Priority</span><br>
            <span class="badge" style="background-color: ${priorityColor}; margin-top: 4px;">${task.priority}</span>
          </td>
          <td style="padding: 8px 0;">
            <span style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: ${BRAND.textMuted};">Status</span><br>
            <span class="badge" style="background-color: ${statusColor}; margin-top: 4px;">${statusLabel}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Due Date Highlight -->
    <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="font-size: 18px; font-weight: 700; color: #991b1b; margin: 0 0 4px 0;">Due: ${formattedDueDate}</p>
      ${formattedDueTime ? `<p style="font-size: 14px; color: #dc2626; margin: 0;">${formattedDueTime}</p>` : ''}
    </div>

    ${task.assignee ? `
      <div class="info-box">
        <strong style="font-size: 12px; text-transform: uppercase;">Assigned By</strong>
        <p style="margin: 4px 0 0; font-weight: 600;">${escapeHtml(task.assignee.name)}</p>
      </div>
    ` : ''}

    <div style="text-align: center; margin: 28px 0;">
      <a href="${taskLink}" class="cta-btn" style="color: white;">
        View Task Details
      </a>
    </div>

    <p style="font-size: 14px; color: ${BRAND.textMuted}; text-align: center; margin-top: 24px;">
      Click the button above to view the full task details and update its status.
    </p>
  `;

  return emailShell(
    'Task Reminder',
    'Your task is due soon!',
    body,
    `<p style="font-size: 13px; color: ${BRAND.textMuted}; margin-bottom: 8px;">You're receiving this because you're assigned to this task.</p>`
  );
};

module.exports = { taskReminderTemplate };
