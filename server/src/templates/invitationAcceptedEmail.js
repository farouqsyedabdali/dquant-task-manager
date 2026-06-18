const { BRAND, emailShell, escapeHtml, card, badge } = require('./emailBase');

const invitationAcceptedTemplate = ({ senderName, recipientName, taskTitle }) => {
  const body = `
    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hi ${escapeHtml(senderName)},
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <strong>${escapeHtml(recipientName)}</strong> has accepted your task invitation:
    </p>

    ${card(`
      <p style="font-size: 18px; font-weight: bold; color: ${BRAND.primaryColor}; margin: 0 0 12px 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        ${escapeHtml(taskTitle)}
      </p>
      <table cellpadding="0" cellspacing="0" border="0" align="center">
        <tr>
          <td>${badge('Accepted', '#10b981')}</td>
        </tr>
      </table>
    `)}

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6; margin: 16px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      They can now view and work on this task from their account.
    </p>
  `;

  return emailShell(
    'Task Invitation Accepted!',
    `${escapeHtml(recipientName)} is now collaborating on your task`,
    body
  );
};

module.exports = { invitationAcceptedTemplate };
