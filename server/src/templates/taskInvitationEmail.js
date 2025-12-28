const { format } = require('date-fns');

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

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've received a task</title>
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
        .greeting {
          font-size: 16px;
          color: #374151;
          margin-bottom: 20px;
        }
        .task-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
        }
        .task-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
        }
        .task-title::before {
          content: "📋";
          margin-right: 10px;
          font-size: 24px;
        }
        .task-description {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 20px;
          white-space: pre-wrap;
        }
        .task-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 20px;
        }
        .meta-item {
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        .meta-icon {
          margin-right: 8px;
          font-size: 18px;
        }
        .meta-label {
          color: #6b7280;
          margin-right: 6px;
        }
        .meta-value {
          font-weight: 600;
          color: #111827;
        }
        .priority-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          background-color: ${priorityColor};
        }
        .message-section {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px 20px;
          margin: 24px 0;
          border-radius: 4px;
        }
        .message-label {
          font-size: 12px;
          font-weight: 700;
          color: #92400e;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .message-text {
          font-size: 14px;
          color: #78350f;
          font-style: italic;
          line-height: 1.5;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 16px 40px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          text-align: center;
          margin: 24px 0;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
        }
        .button-container {
          text-align: center;
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
        .expiry-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 12px 16px;
          margin: 20px 0;
          text-align: center;
        }
        .expiry-text {
          font-size: 13px;
          color: #991b1b;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>📬 You've received a task!</h1>
          <p>${senderName} has sent you a task to complete</p>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">
            ${recipientName ? `Hi ${recipientName},` : 'Hello,'}
          </div>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            <strong>${senderName}</strong> has sent you a task and would like you to work on it:
          </p>

          <!-- Task Card -->
          <div class="task-card">
            <h2 class="task-title">${task.title}</h2>
            
            ${task.description ? `
              <div class="task-description">${task.description}</div>
            ` : ''}

            <div class="task-meta">
              <div class="meta-item">
                <span class="meta-icon">⚡</span>
                <span class="meta-label">Priority:</span>
                <span class="priority-badge">${task.priority}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span class="meta-label">Due Date:</span>
                <span class="meta-value">${formattedDueDate}</span>
              </div>
            </div>
          </div>

          <!-- Personal Message -->
          ${message ? `
            <div class="message-section">
              <div class="message-label">Message from ${senderName}</div>
              <div class="message-text">"${message}"</div>
            </div>
          ` : ''}

          <!-- CTA Button -->
          <div class="button-container">
            <a href="${invitationLink}" class="cta-button">
              ${isRegisteredUser ? 'View Task & Respond' : 'Join for Free to accept'}
            </a>
          </div>

          <!-- Expiry Notice -->
          <div class="expiry-notice">
            <p class="expiry-text">⏰ This invitation expires in 7 days</p>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
            Click the button above to view the full task details and choose to accept or decline.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This email was sent by Task Manager. If you didn't expect this invitation, you can safely ignore it.
          </p>
          <p class="footer-text" style="margin-top: 8px;">
            © ${new Date().getFullYear()} Tialz. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { taskInvitationTemplate };

