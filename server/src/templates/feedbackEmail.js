const { BRAND, emailShell, escapeHtml } = require('./emailBase');

const feedbackEmailTemplate = ({ name, email, feedback, userInfo }) => {
  const submittedAt = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const body = `
    <!-- User Information -->
    <div class="card">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium}; width: 120px;">Name:</td>
          <td style="padding: 8px 0; color: ${BRAND.textMuted};">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium};">Email:</td>
          <td style="padding: 8px 0; color: ${BRAND.textMuted};">${escapeHtml(email)}</td>
        </tr>
        ${userInfo ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium};">User ID:</td>
            <td style="padding: 8px 0; color: ${BRAND.textMuted};">${userInfo.userId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium};">Account:</td>
            <td style="padding: 8px 0; color: ${BRAND.textMuted};">${userInfo.isPersonal ? 'Personal' : 'Company'}</td>
          </tr>
          ${!userInfo.isPersonal ? `
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium};">Company:</td>
              <td style="padding: 8px 0; color: ${BRAND.textMuted};">${escapeHtml(userInfo.companyName || 'N/A')}</td>
            </tr>
          ` : ''}
        ` : ''}
      </table>
    </div>

    <!-- Feedback -->
    <div style="background: white; border: 2px solid ${BRAND.border}; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <span style="font-size: 12px; font-weight: 700; color: ${BRAND.textMedium}; text-transform: uppercase; display: block; margin-bottom: 12px;">Feedback Message</span>
      <div style="font-size: 15px; color: ${BRAND.textDark}; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(feedback)}</div>
    </div>

    <!-- Metadata -->
    <div class="warning-box">
      <strong style="font-size: 12px; text-transform: uppercase;">Submission Details</strong>
      <p style="margin: 8px 0 4px; font-size: 13px;">Submitted: ${submittedAt}</p>
      <p style="margin: 0; font-size: 13px;">Source: Tialz App</p>
    </div>
  `;

  return emailShell(
    'New User Feedback',
    'Someone has submitted feedback from your app',
    body
  );
};

module.exports = { feedbackEmailTemplate };
