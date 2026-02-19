const BRAND = {
  name: 'Tialz',
  primaryColor: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  accentColor: '#8b5cf6',
  textDark: '#111827',
  textMedium: '#374151',
  textMuted: '#6b7280',
  bgLight: '#f9fafb',
  bgPage: '#f3f4f6',
  border: '#e5e7eb',
};

const currentYear = new Date().getFullYear();

function getLogoUrl() {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].replace(/\/$/, '');
  return `${clientUrl}/tialz-logo.png`;
}

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
    color: white;
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

function emailHeader(title, subtitle) {
  const logoUrl = getLogoUrl();
  return `
    <div class="email-header">
      <img src="${logoUrl}" alt="Tialz" width="64" height="64" style="display: block; margin: 0 auto 20px; width: 64px; height: 64px; object-fit: contain;" />
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
  `;
}

function emailFooter(extra) {
  const logoUrl = getLogoUrl();
  return `
    <div class="email-footer">
      ${extra || ''}
      <img src="${logoUrl}" alt="Tialz" width="28" height="28" style="display: block; margin: 0 auto 12px; width: 28px; height: 28px; object-fit: contain; opacity: 0.6;" />
      <p>This email was sent by ${BRAND.name}. If you didn't expect this, you can safely ignore it.</p>
      <p>&copy; ${currentYear} ${BRAND.name}. All rights reserved.</p>
    </div>
  `;
}

function emailShell(title, subtitle, bodyHtml, footerExtra) {
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
    ${emailHeader(title, subtitle)}
    <div class="email-body">
      ${bodyHtml}
    </div>
    ${emailFooter(footerExtra)}
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { BRAND, emailShell, emailHeader, emailFooter, baseStyles, getLogoUrl, escapeHtml };
