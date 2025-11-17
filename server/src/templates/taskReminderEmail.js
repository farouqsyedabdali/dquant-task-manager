const { format } = require('date-fns');

const taskReminderTemplate = ({ userName, task, taskLink }) => {
  const priorityColors = {
    LOW: '#3b82f6',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    URGENT: '#dc2626'
  };

  const statusColors = {
    TODO: '#6b7280',
    IN_PROGRESS: '#3b82f6',
    COMPLETED: '#10b981',
    ON_HOLD: '#f59e0b',
    CANCELLED: '#ef4444'
  };

  const statusLabels = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
    CANCELLED: 'Cancelled'
  };

  const priorityColor = priorityColors[task.priority] || '#6b7280';
  const statusColor = statusColors[task.status] || '#6b7280';
  const statusLabel = statusLabels[task.status] || task.status;

  const formattedDueDate = task.dueDate 
    ? format(new Date(task.dueDate), 'MMMM dd, yyyy')
    : 'No due date';
  
  const formattedDueTime = task.dueDate 
    ? format(new Date(task.dueDate), 'h:mm a')
    : '';

  const hoursUntilDue = task.dueDate 
    ? Math.round((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60))
    : 0;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Reminder: ${task.title}</title>
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
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
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
        .alert-banner {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px 30px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .alert-icon {
          font-size: 24px;
        }
        .alert-text {
          flex: 1;
        }
        .alert-title {
          font-size: 16px;
          font-weight: 700;
          color: #92400e;
          margin: 0 0 4px 0;
        }
        .alert-message {
          font-size: 14px;
          color: #78350f;
          margin: 0;
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
          border: 2px solid #fbbf24;
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
          max-height: 150px;
          overflow: hidden;
        }
        .task-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 20px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
          font-size: 14px;
        }
        .meta-icon {
          margin-right: 8px;
          font-size: 18px;
        }
        .meta-label {
          color: #6b7280;
          margin-bottom: 4px;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .meta-value {
          font-weight: 600;
          color: #111827;
          display: flex;
          align-items: center;
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
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          background-color: ${statusColor};
        }
        .due-date-highlight {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .due-date-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .due-date-text {
          font-size: 18px;
          font-weight: 700;
          color: #991b1b;
          margin: 0 0 4px 0;
        }
        .due-date-subtext {
          font-size: 14px;
          color: #dc2626;
          margin: 0;
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
        .assignee-info {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 12px 16px;
          margin: 16px 0;
          border-radius: 4px;
        }
        .assignee-label {
          font-size: 12px;
          font-weight: 700;
          color: #1e40af;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .assignee-name {
          font-size: 14px;
          color: #1e3a8a;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>⏰ Task Reminder</h1>
          <p>Your task is due soon!</p>
        </div>

        <!-- Alert Banner -->
        <div class="alert-banner">
          <div class="alert-icon">⚠️</div>
          <div class="alert-text">
            <p class="alert-title">Upcoming Deadline</p>
            <p class="alert-message">This task is due in approximately ${hoursUntilDue} hours</p>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">
            Hi ${userName},
          </div>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            This is a friendly reminder that the following task is <strong>due in 48 hours</strong>:
          </p>

          <!-- Task Card -->
          <div class="task-card">
            <h2 class="task-title">${task.title}</h2>
            
            ${task.description ? `
              <div class="task-description">${task.description}</div>
            ` : ''}

            <div class="task-meta">
              <div class="meta-item">
                <span class="meta-label">⚡ Priority</span>
                <span class="meta-value">
                  <span class="priority-badge">${task.priority}</span>
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">📊 Status</span>
                <span class="meta-value">
                  <span class="status-badge">${statusLabel}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Due Date Highlight -->
          <div class="due-date-highlight">
            <div class="due-date-icon">📅</div>
            <p class="due-date-text">Due: ${formattedDueDate}</p>
            <p class="due-date-subtext">${formattedDueTime}</p>
          </div>

          ${task.assignee ? `
            <div class="assignee-info">
              <div class="assignee-label">Assigned By</div>
              <div class="assignee-name">${task.assignee.name}</div>
            </div>
          ` : ''}

          <!-- CTA Button -->
          <div class="button-container">
            <a href="${taskLink}" class="cta-button">
              View Task Details
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
            Click the button above to view the full task details and update its status.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This is an automated reminder from Task Manager. You're receiving this because you're assigned to this task.
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

module.exports = { taskReminderTemplate };

