const { format } = require('date-fns');
const { BRAND, emailShell, escapeHtml, card, badge, ctaButton } = require('./emailBase');

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
    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      ${greeting}
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <strong>${escapeHtml(senderName)}</strong> has sent you a task and would like you to work on it:
    </p>

    <!-- Task Card -->
    ${card(`
      <h2 style="font-size: 20px; font-weight: 700; color: ${BRAND.textDark}; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        ${escapeHtml(task.title)}
      </h2>
      
      ${task.description ? `
        <p style="font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6; margin: 0 0 20px 0; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${escapeHtml(task.description)}</p>
      ` : ''}

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 16px;">
        <tr>
          <td style="padding: 8px 0;">
            <span style="font-size: 13px; color: ${BRAND.textMuted}; margin-right: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Priority:</span>
            ${badge(task.priority, priorityColor)}
          </td>
          <td style="padding: 8px 0;">
            <span style="font-size: 13px; color: ${BRAND.textMuted}; margin-right: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Due:</span>
            <span style="font-weight: 600; color: ${BRAND.textDark}; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${formattedDueDate}</span>
          </td>
        </tr>
      </table>
    `)}

    ${message ? `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; margin: 18px 0;">
        <tr>
          <td style="padding: 14px 18px; color: #92400e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">
            <strong style="font-size: 12px; text-transform: uppercase;">Message from ${escapeHtml(senderName)}</strong>
            <p style="margin: 8px 0 0; font-style: italic;">"${escapeHtml(message)}"</p>
          </td>
        </tr>
      </table>
    ` : ''}

    ${ctaButton(invitationLink, isRegisteredUser ? 'View Task &amp; Respond' : 'Join Tialz for Free')}

    <!-- Expiry notice -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; margin: 20px 0;">
      <tr>
        <td align="center" style="padding: 12px 16px;">
          <p style="font-size: 13px; color: #991b1b; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">This invitation expires in 7 days</p>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; color: ${BRAND.textMuted}; text-align: center; margin: 24px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
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
