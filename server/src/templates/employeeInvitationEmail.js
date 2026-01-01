const employeeInvitationEmail = (employeeName, adminName, companyName, invitationUrl) => {
  return {
    subject: `Welcome to ${companyName} - Complete Your Account Setup`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Employee Invitation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .content {
            margin-bottom: 30px;
          }
          .invitation-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .invitation-button:hover {
            transform: translateY(-2px);
          }
          .alternative-link {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 14px;
            word-break: break-all;
            color: #374151;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .info-box {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #0c4a6e;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CN</div>
            <h1 class="title">Welcome to ${companyName}</h1>
            <p class="subtitle">Complete Your Account Setup</p>
          </div>

          <div class="content">
            <p>Hi ${employeeName},</p>

            <p><strong>${adminName}</strong> has invited you to join <strong>${companyName}</strong> on Tialz Task Manager!</p>

            <p>To get started managing tasks and collaborating with your team, you'll need to complete your account setup by setting a password.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" class="invitation-button">
                Complete Account Setup
              </a>
            </div>

            <div class="alternative-link">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <strong>${invitationUrl}</strong>
            </div>

            <div class="info-box">
              <strong>What happens next?</strong>
              <ul style="margin: 10px 0 0 20px;">
                <li>Set your password</li>
                <li>Access your team's tasks and projects</li>
                <li>Collaborate with colleagues</li>
                <li>Track project progress</li>
              </ul>
            </div>

            <div class="warning">
              <strong>Important:</strong> This invitation link will expire in 24 hours for security reasons. If it expires, you'll need to contact your administrator to send a new invitation.
            </div>

            <p>If you have any questions about getting started, feel free to reach out to ${adminName} or your IT team.</p>

            <p>Welcome to the team!</p>
          </div>

          <div class="footer">
            <p>If you weren't expecting this invitation, please ignore this email.</p>
            <p>This email was sent from Tialz Task Manager. Please do not reply to this email.</p>
            <p>&copy; 2024 Tialz. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to ${companyName} - Complete Your Account Setup

      Hi ${employeeName},

      ${adminName} has invited you to join ${companyName} on Tialz Task Manager!

      To get started managing tasks and collaborating with your team, you'll need to complete your account setup by setting a password.

      Complete your account setup: ${invitationUrl}

      What happens next?
      • Set your password
      • Access your team's tasks and projects
      • Collaborate with colleagues
      • Track project progress

      Important: This invitation link will expire in 24 hours for security reasons. If it expires, you'll need to contact your administrator to send a new invitation.

      If you have any questions about getting started, feel free to reach out to ${adminName} or your IT team.

      Welcome to the team!

      If you weren't expecting this invitation, please ignore this email.

      This email was sent from Tialz Task Manager. Please do not reply to this email.

      © 2024 Tialz. All rights reserved.
    `
  };
};

module.exports = employeeInvitationEmail;
