import { useState, useRef, useEffect } from 'react';
import { lightModeLogo } from '../hooks/useThemeLogo';

const BRAND = {
  primaryColor: '#6366f1',
  primaryDark: '#4f46e5',
  textDark: '#111827',
  textMedium: '#374151',
  textMuted: '#6b7280',
  bgLight: '#f9fafb',
  bgPage: '#f3f4f6',
  border: '#e5e7eb',
};

const currentYear = new Date().getFullYear();

const logoImg = (width = 64) =>
  `<img src="${lightModeLogo}" alt="Tialz" width="${width}" height="${width}" style="display: block; margin: 0 auto ${width > 40 ? '20px' : '12px'}; width: ${width}px; height: ${width}px; object-fit: contain;${width <= 40 ? ' opacity: 0.6;' : ''}" />`;

const baseStyles = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: ${BRAND.bgPage};
    -webkit-font-smoothing: antialiased;
  }
  .email-container {
    max-width: 600px;
    margin: 40px auto;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  }
  .email-header {
    background: #ffffff;
    padding: 40px 30px 28px;
    text-align: center;
    border-bottom: 1px solid ${BRAND.border};
  }
  .email-header h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 700;
    color: ${BRAND.textDark};
  }
  .email-header p {
    margin: 0;
    font-size: 15px;
    color: ${BRAND.textMuted};
  }
  .email-body {
    padding: 36px 30px;
  }
  .email-footer {
    background: ${BRAND.bgLight};
    padding: 24px 30px;
    text-align: center;
    border-top: 1px solid ${BRAND.border};
  }
  .email-footer p {
    font-size: 13px;
    color: ${BRAND.textMuted};
    margin: 0 0 6px 0;
  }
  .cta-btn {
    display: inline-block;
    background: ${BRAND.primaryColor};
    color: white !important;
    text-decoration: none;
    padding: 14px 36px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 15px;
    text-align: center;
  }
  .card {
    background: ${BRAND.bgLight};
    border: 1px solid ${BRAND.border};
    border-radius: 8px;
    padding: 22px;
    margin: 20px 0;
  }
  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    color: white;
  }
  .warning-box {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    padding: 14px 18px;
    margin: 18px 0;
    color: #92400e;
    font-size: 14px;
  }
  .info-box {
    background: #eff6ff;
    border: 1px solid #93c5fd;
    border-radius: 6px;
    padding: 14px 18px;
    margin: 18px 0;
    color: #1e40af;
    font-size: 14px;
  }
`;

function shell(title, subtitle, bodyHtml, footerExtra = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      ${logoImg(64)}
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    <div class="email-body">
      ${bodyHtml}
    </div>
    <div class="email-footer">
      ${footerExtra}
      ${logoImg(28)}
      <p>This email was sent by Tialz. If you didn't expect this, you can safely ignore it.</p>
      <p>&copy; ${currentYear} Tialz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

const EMAIL_MOCKUPS = [
  {
    id: 'email-verification',
    name: 'Email Verification',
    description: 'Sent when a user signs up and needs to verify their email address.',
    trigger: 'User registration (company or personal)',
    html: () => shell(
      'Verify Your Email',
      'Welcome to Tialz',
      `
        <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">Hi Alex Johnson,</p>
        <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
          Thank you for signing up for Tialz! To complete your registration and start managing your tasks, please verify your email address.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: ${BRAND.bgLight}; border: 2px solid ${BRAND.border}; border-radius: 12px; padding: 30px; display: inline-block;">
            <p style="margin: 0 0 15px 0; color: ${BRAND.textMuted}; font-size: 16px;">Your verification code is:</p>
            <div style="font-size: 36px; font-weight: bold; color: ${BRAND.textDark}; letter-spacing: 8px; font-family: 'Courier New', monospace; background: white; padding: 20px 30px; border-radius: 8px; border: 2px solid ${BRAND.primaryColor}; display: inline-block;">
              847291
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
      `
    )
  },
  {
    id: 'employee-invitation',
    name: 'Employee Invitation',
    description: 'Sent when an admin invites a new employee to join the company on Tialz.',
    trigger: 'Admin creates a new employee or resends an invitation',
    html: () => shell(
      'Welcome to Acme Corp',
      'Complete Your Account Setup',
      `
        <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">Hi Sarah Chen,</p>
        <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
          <strong>James Wilson</strong> has invited you to join <strong>Acme Corp</strong> on Tialz!
        </p>
        <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
          To get started managing tasks and collaborating with your team, complete your account setup by setting a password.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="#" class="cta-btn" style="color: white;">Complete Account Setup</a>
        </div>
        <div style="background: ${BRAND.bgLight}; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 14px; word-break: break-all; color: ${BRAND.textMedium};">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <strong>https://app.tialz.com/complete-employee-setup?token=abc123def456</strong>
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
          If you have any questions, reach out to James Wilson or your IT team.
        </p>
        <p style="font-size: 15px; color: ${BRAND.textMedium}; font-weight: 600;">Welcome to the team!</p>
      `
    )
  },
  {
    id: 'task-invitation',
    name: 'Task Invitation',
    description: 'Sent when a user shares a task with someone via email (registered or unregistered user).',
    trigger: 'User sends a task invitation from the task share feature',
    html: () => shell(
      "You've Received a Task!",
      'Maria Garcia has sent you a task to complete',
      `
        <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">Hi David Kim,</p>
        <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
          <strong>Maria Garcia</strong> has sent you a task and would like you to work on it:
        </p>
        <div class="card">
          <h2 style="font-size: 20px; font-weight: 700; color: ${BRAND.textDark}; margin: 0 0 16px 0;">
            Design Homepage Mockup
          </h2>
          <p style="font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6; margin-bottom: 20px;">
            Create a modern, responsive homepage design for the new marketing site. Include hero section, features grid, and testimonials.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0;">
                <span style="font-size: 13px; color: ${BRAND.textMuted}; margin-right: 8px;">Priority:</span>
                <span class="badge" style="background-color: #ef4444;">HIGH</span>
              </td>
              <td style="padding: 8px 0;">
                <span style="font-size: 13px; color: ${BRAND.textMuted}; margin-right: 8px;">Due:</span>
                <span style="font-weight: 600; color: ${BRAND.textDark}; font-size: 14px;">March 15, 2026</span>
              </td>
            </tr>
          </table>
        </div>
        <div class="warning-box">
          <strong style="font-size: 12px; text-transform: uppercase;">Message from Maria Garcia</strong>
          <p style="margin: 8px 0 0; font-style: italic;">"Hey David, this is high priority for the launch. Let me know if you need the brand assets!"</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="#" class="cta-btn" style="color: white;">View Task &amp; Respond</a>
        </div>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px 16px; text-align: center; margin: 20px 0;">
          <p style="font-size: 13px; color: #991b1b; margin: 0;">This invitation expires in 7 days</p>
        </div>
        <p style="font-size: 14px; color: ${BRAND.textMuted}; text-align: center; margin-top: 24px;">
          Click the button above to view full task details and choose to accept or decline.
        </p>
      `
    )
  },
  {
    id: 'invitation-accepted',
    name: 'Task Invitation Accepted',
    description: 'Sent to the task sender when the recipient accepts their task invitation.',
    trigger: 'Recipient clicks "Accept" on a task invitation',
    html: () => shell(
      'Task Invitation Accepted!',
      'David Kim is now collaborating on your task',
      `
        <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">Hi Maria Garcia,</p>
        <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
          <strong>David Kim</strong> has accepted your task invitation:
        </p>
        <div class="card" style="text-align: center;">
          <p style="font-size: 18px; font-weight: bold; color: ${BRAND.primaryColor}; margin: 0 0 12px 0;">
            Design Homepage Mockup
          </p>
          <span class="badge" style="background-color: #10b981;">Accepted</span>
        </div>
        <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
          They can now view and work on this task from their account.
        </p>
      `
    )
  },
  {
    id: 'task-reminder',
    name: 'Task Reminder',
    description: 'Automated email sent 48 hours before a task is due.',
    trigger: 'Scheduled job runs and finds tasks due within 48 hours',
    html: () => shell(
      'Task Reminder',
      'Your task is due soon!',
      `
        <div class="warning-box" style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 24px;">&#9888;&#65039;</div>
          <div>
            <strong style="font-size: 15px;">Upcoming Deadline</strong>
            <p style="margin: 4px 0 0; font-size: 14px;">This task is due in approximately 47 hours</p>
          </div>
        </div>
        <p style="font-size: 15px; color: ${BRAND.textMedium}; margin-bottom: 20px;">Hi Alex Johnson,</p>
        <p style="font-size: 15px; color: ${BRAND.textMedium}; line-height: 1.6;">
          This is a friendly reminder that the following task is <strong>due in 48 hours</strong>:
        </p>
        <div class="card" style="border: 2px solid #fbbf24;">
          <h2 style="font-size: 20px; font-weight: 700; color: ${BRAND.textDark}; margin: 0 0 16px 0;">
            Finalize Q1 Report
          </h2>
          <p style="font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6; margin-bottom: 20px;">
            Compile all department data and finalize the Q1 performance report for the board meeting.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0;">
                <span style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: ${BRAND.textMuted};">Priority</span><br>
                <span class="badge" style="background-color: #dc2626; margin-top: 4px;">URGENT</span>
              </td>
              <td style="padding: 8px 0;">
                <span style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: ${BRAND.textMuted};">Status</span><br>
                <span class="badge" style="background-color: #3b82f6; margin-top: 4px;">In Progress</span>
              </td>
            </tr>
          </table>
        </div>
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 18px; font-weight: 700; color: #991b1b; margin: 0 0 4px 0;">Due: March 17, 2026</p>
          <p style="font-size: 14px; color: #dc2626; margin: 0;">5:00 PM</p>
        </div>
        <div class="info-box">
          <strong style="font-size: 12px; text-transform: uppercase;">Assigned By</strong>
          <p style="margin: 4px 0 0; font-weight: 600;">James Wilson</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="#" class="cta-btn" style="color: white;">View Task Details</a>
        </div>
        <p style="font-size: 14px; color: ${BRAND.textMuted}; text-align: center; margin-top: 24px;">
          Click the button above to view the full task details and update its status.
        </p>
      `,
      `<p style="font-size: 13px; color: ${BRAND.textMuted}; margin-bottom: 8px;">You're receiving this because you're assigned to this task.</p>`
    )
  },
  {
    id: 'feedback',
    name: 'User Feedback (Internal)',
    description: 'Sent to the Tialz feedback inbox when a user submits feedback from the app.',
    trigger: 'User submits the feedback form in the app',
    html: () => shell(
      'New User Feedback',
      'Someone has submitted feedback from your app',
      `
        <div class="card">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium}; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: ${BRAND.textMuted};">Rachel Thompson</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium};">Email:</td>
              <td style="padding: 8px 0; color: ${BRAND.textMuted};">rachel@example.com</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium};">User ID:</td>
              <td style="padding: 8px 0; color: ${BRAND.textMuted};">42</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium};">Account:</td>
              <td style="padding: 8px 0; color: ${BRAND.textMuted};">Company</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium};">Company:</td>
              <td style="padding: 8px 0; color: ${BRAND.textMuted};">Acme Corp</td>
            </tr>
          </table>
        </div>
        <div style="background: white; border: 2px solid ${BRAND.border}; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <span style="font-size: 12px; font-weight: 700; color: ${BRAND.textMedium}; text-transform: uppercase; display: block; margin-bottom: 12px;">Feedback Message</span>
          <div style="font-size: 15px; color: ${BRAND.textDark}; line-height: 1.6;">Love the AI chat feature! It would be great if you could add the ability to create tasks directly from the chat response. Also, the dark mode toggle sometimes resets after refreshing. Otherwise, the app is fantastic and has improved our team's productivity significantly.</div>
        </div>
        <div class="warning-box">
          <strong style="font-size: 12px; text-transform: uppercase;">Submission Details</strong>
          <p style="margin: 8px 0 4px; font-size: 13px;">Submitted: Sunday, February 15, 2026, 02:30 PM EST</p>
          <p style="margin: 0; font-size: 13px;">Source: Tialz App</p>
        </div>
      `
    )
  }
];

function IframePreview({ html }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(html);
      doc.close();

      const resizeObserver = new ResizeObserver(() => {
        if (iframeRef.current && doc.body) {
          iframeRef.current.style.height = doc.body.scrollHeight + 40 + 'px';
        }
      });

      const checkHeight = () => {
        if (doc.body) {
          iframeRef.current.style.height = doc.body.scrollHeight + 40 + 'px';
          resizeObserver.observe(doc.body);
        }
      };

      setTimeout(checkHeight, 100);
      setTimeout(checkHeight, 500);

      return () => resizeObserver.disconnect();
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title="Email Preview"
      style={{
        width: '100%',
        border: 'none',
        minHeight: '400px',
        borderRadius: '8px',
        background: '#f3f4f6',
      }}
    />
  );
}

export default function EmailMockup() {
  const [activeEmail, setActiveEmail] = useState(EMAIL_MOCKUPS[0].id);

  const active = EMAIL_MOCKUPS.find(e => e.id === activeEmail);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      {/* Top Bar */}
      <div style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src={lightModeLogo} alt="Tialz" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'white' }}>Email Mockup Gallery</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Preview all Tialz email templates with sample data</p>
          </div>
        </div>
        <span style={{
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
          color: '#a5b4fc',
        }}>
          {EMAIL_MOCKUPS.length} templates
        </span>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <div style={{
          width: 320,
          minWidth: 320,
          background: '#1e293b',
          borderRight: '1px solid #334155',
          padding: '20px 0',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '0 16px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b' }}>
            Email Templates
          </div>
          {EMAIL_MOCKUPS.map((email) => (
            <button
              key={email.id}
              onClick={() => setActiveEmail(email.id)}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 20px',
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
                background: activeEmail === email.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderLeft: activeEmail === email.id ? '3px solid #6366f1' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeEmail !== email.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeEmail !== email.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{
                fontSize: 14,
                fontWeight: activeEmail === email.id ? 700 : 500,
                color: activeEmail === email.id ? '#a5b4fc' : '#cbd5e1',
                marginBottom: 4,
              }}>
                {email.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                {email.description}
              </div>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          {active && (
            <>
              {/* Info Bar */}
              <div style={{
                background: '#1e293b',
                borderRadius: 10,
                padding: '18px 24px',
                marginBottom: 24,
                display: 'flex',
                gap: 32,
                alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
                    {active.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
                    {active.description}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 8,
                  padding: '10px 16px',
                  whiteSpace: 'nowrap',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#818cf8', marginBottom: 4 }}>
                    Trigger
                  </div>
                  <div style={{ fontSize: 13, color: '#c7d2fe' }}>
                    {active.trigger}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div style={{
                background: '#f3f4f6',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}>
                <div style={{
                  background: '#e2e8f0',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
                  <div style={{
                    flex: 1,
                    background: 'white',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12,
                    color: '#64748b',
                    textAlign: 'center',
                    marginLeft: 8,
                  }}>
                    Email Client Preview
                  </div>
                </div>
                <IframePreview html={active.html()} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
