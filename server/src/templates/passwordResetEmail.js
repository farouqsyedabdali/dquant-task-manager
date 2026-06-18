const { BRAND, emailShell, escapeHtml, warningBox } = require('./emailBase');

const passwordResetEmail = (name, resetCode) => {
  const body = `
    <p style="font-size: 15px; color: ${BRAND.textMedium}; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${escapeHtml(name)},
    </p>

    <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      You requested a password reset for your Tialz account. Use the code below to reset your password:
    </p>

    <!-- Verification code box -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" style="background: ${BRAND.bgLight}; border: 2px solid ${BRAND.border}; border-radius: 12px;">
            <tr>
              <td style="padding: 24px 40px; text-align: center;">
                <p style="margin: 0 0 12px 0; color: ${BRAND.textMuted}; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Your reset code is:</p>
                <table cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td style="background: #ffffff; padding: 16px 32px; border-radius: 8px; border: 2px solid ${BRAND.primaryColor};">
                      <span style="font-size: 34px; font-weight: bold; color: ${BRAND.textDark}; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">${resetCode}</span>
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
      Enter this code on the password reset page to set a new password.
    </p>

    ${warningBox('<strong>Important:</strong> This code will expire in <strong>15 minutes</strong>. If it expires, you\'ll need to request a new code.')}

    <p style="font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6; margin: 16px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `;

  const html = emailShell(
    'Reset Your Password',
    'Password recovery for your Tialz account',
    body
  );

  const text = `Reset Your Password - Tialz

Hello ${name},

You requested a password reset for your Tialz account. Use the following code to reset your password:

Your reset code is: ${resetCode}

Enter this code on the password reset page to set a new password.

Important: This code will expire in 15 minutes. If it expires, you'll need to request a new code.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Tialz. All rights reserved.`;

  return {
    subject: 'Reset Your Password - Tialz',
    html,
    text
  };
};

module.exports = passwordResetEmail;
