const emailVerificationEmail = (name, verificationCode) => {
  return {
    subject: 'Verify Your Email Address - Tialz Task Manager',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
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
          .verification-button {
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
          .verification-button:hover {
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
            <h1 class="title">Verify Your Email</h1>
            <p class="subtitle">Welcome to Tialz Task Manager</p>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            
            <p>Thank you for signing up for Tialz Task Manager! To complete your registration and start managing your tasks, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; display: inline-block;">
                <p style="margin: 0 0 15px 0; color: #64748b; font-size: 16px;">Your verification code is:</p>
                <div style="font-size: 36px; font-weight: bold; color: #1e293b; letter-spacing: 8px; font-family: 'Courier New', monospace; background: white; padding: 20px 30px; border-radius: 8px; border: 2px solid #3b82f6; display: inline-block;">
                  ${verificationCode}
                </div>
              </div>
            </div>
            
            <p>Enter this code on the verification page to complete your email verification.</p>
            
            <div class="warning">
              <strong>Important:</strong> This verification code will expire in 10 minutes. If you don't verify your email within this time, you'll need to request a new verification code.
            </div>
            
            <p>Once verified, you'll have full access to:</p>
            <ul>
              <li>Create and manage tasks</li>
              <li>Collaborate with team members</li>
              <li>Track project progress</li>
              <li>Receive notifications and updates</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>This email was sent from Tialz Task Manager. Please do not reply to this email.</p>
            <p>&copy; 2024 Tialz. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Verify Your Email Address - Tialz Task Manager
      
      Hi ${name},
      
      Thank you for signing up for Tialz Task Manager! To complete your registration and start managing your tasks, please verify your email address.
      
      Your verification code is: ${verificationCode}
      
      Enter this code on the verification page to complete your email verification.
      
      This verification code will expire in 10 minutes. If you don't verify your email within this time, you'll need to request a new verification code.
      
      Once verified, you'll have full access to create and manage tasks, collaborate with team members, track project progress, and receive notifications.
      
      If you didn't create an account with us, please ignore this email.
      
      This email was sent from Tialz Task Manager. Please do not reply to this email.
      
      © 2024 Tialz. All rights reserved.
    `
  };
};

module.exports = emailVerificationEmail;
