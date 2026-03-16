const { format } = require('date-fns');
const { BRAND, emailShell, escapeHtml } = require('./emailBase');

const taskInvitationTemplate = ({ recipientName, senderName, task, invitationLink, message, isRegisteredUser = false }) => {
  const priorityColors = {
    LOW: '#3b82f6',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    URGENT: '#dc2626'
  };

  const priorityColor = priorityColors[task.priority] || '#6b7280';

  const formattedDueDate = task.dueDate 
    ? format(new Date(task.dueDate), 'MMMM dd, yyyy')
    : 'No due date';

  const greeting = recipientName ? `Hi ${escapeHtml(recipientName)},` : 'Hello,';

  const body = `
    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">
      ${greeting}
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
      <strong>${escapeHtml(senderName)}</strong> has sent you a task and would like you to work on it:
    </p>

    <!-- Task Card -->
    <div class="card">
      <h2 style="font-size: 20px; font-weight: 700; color: ${BRAND.textDark}; margin: 0 0 16px 0;">
        ${escapeHtml(task.title)}
      </h2>
      
      ${task.description ? `
        <p style="font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap;">${escapeHtml(task.description)}</p>
      ` : ''}

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 16px;">
        <tr>
          <td style="padding: 8px 0;">
            <span style="font-size: 13px; color: ${BRAND.textMuted}; margin-right: 8px;">Priority:</span>
            <span class="badge" style="background-color: ${priorityColor};">${task.priority}</span>
          </td>
          <td style="padding: 8px 0;">
            <span style="font-size: 13px; color: ${BRAND.textMuted}; margin-right: 8px;">Due:</span>
            <span style="font-weight: 600; color: ${BRAND.textDark}; font-size: 14px;">${formattedDueDate}</span>
          </td>
        </tr>
      </table>
    </div>

    ${message ? `
      <div class="warning-box">
        <strong style="font-size: 12px; text-transform: uppercase;">Message from ${escapeHtml(senderName)}</strong>
        <p style="margin: 8px 0 0; font-style: italic;">"${escapeHtml(message)}"</p>
      </div>
    ` : ''}

    <div style="text-align: center; margin: 28px 0;">
      <a href="${invitationLink}" class="cta-btn" style="color: white;">
        ${isRegisteredUser ? 'View Task &amp; Respond' : 'Join Tialz for Free'}
      </a>
    </div>

    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px 16px; text-align: center; margin: 20px 0;">
      <p style="font-size: 13px; color: #991b1b; margin: 0;">This invitation expires in 7 days</p>
    </div>

    <p style="font-size: 14px; color: ${BRAND.textMuted}; text-align: center; margin-top: 24px;">
      Click the button above to view full task details and choose to accept or decline.
    </p>
  `;

  return emailShell(
    "You've Received a Task!",
    `${escapeHtml(senderName)} has sent you a task to complete`,
    body
  );
};

module.exports = { taskInvitationTemplate };
