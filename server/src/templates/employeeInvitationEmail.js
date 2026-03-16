const { BRAND, emailShell, escapeHtml } = require('./emailBase');

const employeeInvitationEmail = (employeeName, adminName, companyName, invitationUrl) => {
  const body = `
    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">
      Hi ${escapeHtml(employeeName)},
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
      <strong>${escapeHtml(adminName)}</strong> has invited you to join <strong>${escapeHtml(companyName)}</strong> on Tialz!
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
      To get started managing tasks and collaborating with your team, complete your account setup by setting a password.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${invitationUrl}" class="cta-btn" style="color: white;">
        Complete Account Setup
      </a>
    </div>

    <div style="background: ${BRAND.bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 14px; word-break: break-all; color: ${BRAND.textMedium};">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <strong>${invitationUrl}</strong>
    </div>

    <div class="info-box">
      <strong>What happens next?</strong>
      <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
        <li>Set your password</li>
        <li>Access your team's tasks and projects</li>
        <li>Collaborate with colleagues</li>
        <li>Track project progress</li>
      </ul>
    </div>

    <div class="warning-box">
      <strong>Important:</strong> This invitation link will expire in 24 hours for security reasons. If it expires, contact your administrator for a new invitation.
    </div>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
      If you have any questions, reach out to ${escapeHtml(adminName)} or your IT team.
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; font-weight: 600;">
      Welcome to the team!
    </p>
  `;

  const html = emailShell(
    `Welcome to ${escapeHtml(companyName)}`,
    'Complete Your Account Setup',
    body
  );

  const text = `Welcome to ${companyName} - Complete Your Account Setup

Hi ${employeeName},

${adminName} has invited you to join ${companyName} on Tialz!

To get started managing tasks and collaborating with your team, complete your account setup by setting a password.

Complete your account setup: ${invitationUrl}

What happens next?
- Set your password
- Access your team's tasks and projects
- Collaborate with colleagues
- Track project progress

Important: This invitation link will expire in 24 hours for security reasons.

If you have any questions, reach out to ${adminName} or your IT team.

Welcome to the team!

© ${new Date().getFullYear()} Tialz. All rights reserved.`;

  return {
    subject: `Welcome to ${companyName} - Complete Your Account Setup`,
    html,
    text
  };
};

module.exports = employeeInvitationEmail;
