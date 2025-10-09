const feedbackEmailTemplate = ({ name, email, feedback, userInfo }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>User Feedback</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f3f4f6;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
        }
        .info-section {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .info-row {
          display: flex;
          margin-bottom: 12px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
          min-width: 100px;
        }
        .info-value {
          color: #6b7280;
        }
        .feedback-section {
          background: #fff;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .feedback-label {
          font-size: 14px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: block;
        }
        .feedback-text {
          font-size: 15px;
          color: #111827;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .metadata {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px 20px;
          border-radius: 4px;
          margin-top: 24px;
        }
        .metadata-title {
          font-size: 12px;
          font-weight: 700;
          color: #92400e;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .metadata-info {
          font-size: 13px;
          color: #78350f;
          margin: 4px 0;
        }
        .footer {
          background: #f9fafb;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>💬 New User Feedback</h1>
          <p>Someone has submitted feedback from your app</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- User Information -->
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${email}</span>
            </div>
            ${userInfo ? `
              <div class="info-row">
                <span class="info-label">User ID:</span>
                <span class="info-value">${userInfo.userId || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Account Type:</span>
                <span class="info-value">${userInfo.isPersonal ? 'Personal' : 'Company'}</span>
              </div>
              ${!userInfo.isPersonal ? `
                <div class="info-row">
                  <span class="info-label">Company:</span>
                  <span class="info-value">${userInfo.companyName || 'N/A'}</span>
                </div>
              ` : ''}
            ` : ''}
          </div>

          <!-- Feedback -->
          <div class="feedback-section">
            <span class="feedback-label">Feedback Message</span>
            <div class="feedback-text">${feedback}</div>
          </div>

          <!-- Metadata -->
          <div class="metadata">
            <div class="metadata-title">Submission Details</div>
            <div class="metadata-info">📅 Submitted: ${new Date().toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}</div>
            <div class="metadata-info">🌐 Source: Task Manager App</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This is an automated feedback notification from your Task Manager application.
          </p>
          <p class="footer-text" style="margin-top: 8px;">
            © ${new Date().getFullYear()} Task Manager. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { feedbackEmailTemplate };

