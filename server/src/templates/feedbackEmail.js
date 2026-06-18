const { BRAND, emailShell, escapeHtml, card, warningBox } = require('./emailBase');

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

  const userInfoRows = `
    <tr>
      <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium}; width: 120px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Name:</td>
      <td style="padding: 8px 0; color: ${BRAND.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${escapeHtml(name)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Email:</td>
      <td style="padding: 8px 0; color: ${BRAND.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${escapeHtml(email)}</td>
    </tr>
    ${userInfo ? `
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">User ID:</td>
        <td style="padding: 8px 0; color: ${BRAND.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${userInfo.userId || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Account:</td>
        <td style="padding: 8px 0; color: ${BRAND.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${userInfo.isPersonal ? 'Personal' : 'Company'}</td>
      </tr>
      ${!userInfo.isPersonal ? `
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: ${BRAND.textMedium}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Company:</td>
          <td style="padding: 8px 0; color: ${BRAND.textMuted}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${escapeHtml(userInfo.companyName || 'N/A')}</td>
        </tr>
      ` : ''}
    ` : ''}
  `;

  const body = `
    <!-- User Information -->
    ${card(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${userInfoRows}
      </table>
    `)}

    <!-- Feedback -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: white; border: 2px solid ${BRAND.border}; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px;">
          <span style="font-size: 12px; font-weight: 700; color: ${BRAND.textMedium}; text-transform: uppercase; display: block; margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Feedback Message</span>
          <div style="font-size: 15px; color: ${BRAND.textDark}; line-height: 1.6; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${escapeHtml(feedback)}</div>
        </td>
      </tr>
    </table>

    <!-- Metadata -->
    ${warningBox(`
      <strong style="font-size: 12px; text-transform: uppercase;">Submission Details</strong>
      <p style="margin: 8px 0 4px; font-size: 13px;">Submitted: ${submittedAt}</p>
      <p style="margin: 0; font-size: 13px;">Source: Tialz App</p>
    `)}
  `;

  return emailShell(
    'New User Feedback',
    'Someone has submitted feedback from your app',
    body
  );
};

module.exports = { feedbackEmailTemplate };
