const { BRAND, emailShell, escapeHtml, warningBox } = require('./emailBase');

const emailVerificationEmail = (name, verificationCode) => {
  const body = `
    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hi ${escapeHtml(name)},
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Thank you for signing up for Tialz! To complete your registration and start managing your tasks, please verify your email address.
    </p>

    <!-- Verification code box -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" style="background: ${BRAND.bgLight}; border: 2px solid ${BRAND.border}; border-radius: 12px;">
            <tr>
              <td style="padding: 24px 40px; text-align: center;">
                <p style="margin: 0 0 12px 0; color: ${BRAND.textMuted}; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Your verification code is:</p>
                <table cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td style="background: #ffffff; padding: 16px 32px; border-radius: 8px; border: 2px solid ${BRAND.primaryColor};">
                      <span style="font-size: 34px; font-weight: bold; color: ${BRAND.textDark}; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">${verificationCode}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Enter this code on the verification page to complete your email verification.
    </p>

    ${warningBox('<strong>Important:</strong> This verification code will expire in 10 minutes. If you don\'t verify within this time, you\'ll need to request a new code.')}

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6; margin: 16px 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Once verified, you'll have full access to:</p>
    <ul style="color: ${BRAND.textMedium}; font-size: 15px; line-height: 2; margin: 0 0 16px 0; padding-left: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
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
