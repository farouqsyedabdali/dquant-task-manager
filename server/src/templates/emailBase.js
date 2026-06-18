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

// ── Inline-style helpers (no CSS classes needed) ────────────────────────────

function ctaButton(href, label) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 28px auto;">
      <tr>
        <td align="center" style="border-radius: 8px; background: ${BRAND.primaryColor};">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
            href="${href}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" strokecolor="${BRAND.primaryColor}" fillcolor="${BRAND.primaryColor}">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${label}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; background: ${BRAND.primaryColor};">
            ${label}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;
}

function card(innerHtml, extraStyle) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${BRAND.bgLight}; border: 1px solid ${BRAND.border}; border-radius: 8px; margin: 20px 0;${extraStyle || ''}">
      <tr>
        <td style="padding: 22px;">
          ${innerHtml}
        </td>
      </tr>
    </table>
  `;
}

function badge(label, bgColor) {
  return `<span style="display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 12px; font-weight: 700; color: white; background-color: ${bgColor || BRAND.primaryColor};">${label}</span>`;
}

function warningBox(innerHtml) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; margin: 18px 0;">
      <tr>
        <td style="padding: 14px 18px; color: #92400e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">
          ${innerHtml}
        </td>
      </tr>
    </table>
  `;
}

function infoBox(innerHtml) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 6px; margin: 18px 0;">
      <tr>
        <td style="padding: 14px 18px; color: #1e40af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">
          ${innerHtml}
        </td>
      </tr>
    </table>
  `;
}

// ── Kept for backward compat but no longer required inside emailShell ────────
const baseStyles = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: ${BRAND.bgPage};
    -webkit-font-smoothing: antialiased;
  }
`;

// ── Layout components ────────────────────────────────────────────────────────

function emailHeader(title, subtitle) {
  const logoUrl = getLogoUrl();
  return `
    <!-- Gradient accent bar -->
    <tr>
      <td style="height: 6px; background: linear-gradient(90deg, ${BRAND.primaryColor} 0%, ${BRAND.accentColor} 100%); font-size: 0; line-height: 0;">&nbsp;</td>
    </tr>
    <!-- Header -->
    <tr>
      <td align="center" style="background: #ffffff; padding: 36px 30px 28px; border-bottom: 1px solid ${BRAND.border};">
        <img src="${logoUrl}" alt="${BRAND.name}" width="56" height="56" style="display: block; margin: 0 auto 18px; width: 56px; height: 56px; object-fit: contain; border: 0;" />
        <h1 style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 700; color: ${BRAND.textDark};">${title}</h1>
        ${subtitle ? `<p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: ${BRAND.textMuted};">${subtitle}</p>` : ''}
      </td>
    </tr>
  `;
}

function emailFooter(extra) {
  const logoUrl = getLogoUrl();
  return `
    <!-- Footer -->
    <tr>
      <td style="background: ${BRAND.bgLight}; padding: 24px 30px; text-align: center; border-top: 1px solid ${BRAND.border};">
        ${extra || ''}
        <img src="${logoUrl}" alt="${BRAND.name}" width="24" height="24" style="display: block; margin: 0 auto 10px; width: 24px; height: 24px; object-fit: contain; opacity: 0.5; border: 0;" />
        <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${BRAND.textMuted};">This email was sent by ${BRAND.name}. If you didn't expect this, you can safely ignore it.</p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${BRAND.textMuted};">&copy; ${currentYear} ${BRAND.name}. All rights reserved.</p>
      </td>
    </tr>
  `;
}

function emailShell(title, subtitle, bodyHtml, footerExtra) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    img { border: 0; display: block; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.bgPage}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Outer wrapper -->
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${BRAND.bgPage};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Email container -->
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          ${emailHeader(title, subtitle)}
          <!-- Body -->
          <tr>
            <td style="padding: 36px 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              ${bodyHtml}
            </td>
          </tr>
          ${emailFooter(footerExtra)}
        </table>
      </td>
    </tr>
  </table>
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

module.exports = {
  BRAND,
  emailShell,
  emailHeader,
  emailFooter,
  baseStyles,
  getLogoUrl,
  escapeHtml,
  ctaButton,
  card,
  badge,
  warningBox,
  infoBox,
};
