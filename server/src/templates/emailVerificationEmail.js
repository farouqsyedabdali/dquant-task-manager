const { BRAND, emailShell, escapeHtml } = require('./emailBase');

const emailVerificationEmail = (name, verificationCode) => {
  const body = `
    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">
      Hi ${escapeHtml(name)},
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
      Thank you for signing up for Tialz! To complete your registration and start managing your tasks, please verify your email address.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <div style="background: ${BRAND.bgLight}; border: 2px solid ${BRAND.border}; border-radius: 12px; padding: 30px; display: inline-block;">
        <p style="margin: 0 0 15px 0; color: ${BRAND.textMuted}; font-size: 16px;">Your verification code is:</p>
        <div style="font-size: 36px; font-weight: bold; color: ${BRAND.textDark}; letter-spacing: 8px; font-family: 'Courier New', monospace; background: white; padding: 20px 30px; border-radius: 8px; border: 2px solid ${BRAND.primaryColor}; display: inline-block;">
          ${verificationCode}
        </div>
      </div>
    </div>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
      Enter this code on the verification page to complete your email verification.
    </p>

    <div class="warning-box">
      <strong>Important:</strong> This verification code will expire in 10 minutes. If you don't verify within this time, you'll need to request a new code.
    </div>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">Once verified, you'll have full access to:</p>
    <ul style="color: ${BRAND.textMedium}; font-size: 15px; line-height: 2;">
      <li>Create and manage tasks</li>
      <li>Collaborate with team members</li>
      <li>Track project progress</li>
      <li>Receive notifications and updates</li>
    </ul>
  `;

  const html = emailShell(
    'Verify Your Email',
    'Welcome to Tialz',
    body
  );

  const text = `Verify Your Email Address - Tialz

Hi ${name},

Thank you for signing up for Tialz! To complete your registration and start managing your tasks, please verify your email address.

Your verification code is: ${verificationCode}

Enter this code on the verification page to complete your email verification.

Important: This verification code will expire in 10 minutes.

Once verified, you'll have full access to create and manage tasks, collaborate with team members, track project progress, and receive notifications.

If you didn't create an account with us, please ignore this email.

© ${new Date().getFullYear()} Tialz. All rights reserved.`;

  return {
    subject: 'Verify Your Email Address - Tialz',
    html,
    text
  };
};

module.exports = emailVerificationEmail;
