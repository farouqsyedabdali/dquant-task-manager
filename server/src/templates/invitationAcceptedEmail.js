const { BRAND, emailShell, escapeHtml } = require('./emailBase');

const invitationAcceptedTemplate = ({ senderName, recipientName, taskTitle }) => {
  const body = `
    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">
      Hi ${escapeHtml(senderName)},
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
      <strong>${escapeHtml(recipientName)}</strong> has accepted your task invitation:
    </p>

    <div class="card" style="text-align: center;">
      <p style="font-size: 18px; font-weight: bold; color: ${BRAND.primaryColor}; margin: 0 0 12px 0;">
        ${escapeHtml(taskTitle)}
      </p>
      <span class="badge" style="background-color: #10b981;">Accepted</span>
    </div>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
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
