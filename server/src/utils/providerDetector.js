const dns = require('dns');
const { promisify } = require('util');

const resolveMx = promisify(dns.resolveMx);

/**
 * Detects the mail/calendar provider for an email address by checking MX records.
 * Returns 'google', 'microsoft', 'caldav', or 'unknown'.
 *
 * @param {string} email - Full email address (e.g. user@domain.com)
 * @returns {Promise<'google'|'microsoft'|'caldav'|'unknown'>}
 */
async function detectProvider(email) {
  const parts = (email || '').split('@');
  const domain = (parts[1] || '').toLowerCase().trim();
  if (!domain) return 'unknown';

  // ── Fast-path: well-known consumer domains ──────────────────────────
  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'google';
  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) return 'microsoft';

  // ── MX record lookup ───────────────────────────────────────────────
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) return 'unknown';

    // Sort by priority (lower = higher priority)
    mxRecords.sort((a, b) => a.priority - b.priority);

    for (const record of mxRecords) {
      const exchange = record.exchange.toLowerCase();

      // Google Workspace / Gmail
      if (exchange.includes('google.com') || exchange.includes('aspmx.l.google.com') || exchange.includes('googlemail.com')) {
        return 'google';
      }

      // Microsoft 365 / Outlook
      if (exchange.includes('outlook.com') || exchange.includes('protection.outlook.com') || exchange.includes('mail.protection.outlook.com')) {
        return 'microsoft';
      }

      // Hostinger (Titan Mail)
      if (exchange.includes('hostinger.com') || exchange.includes('titan.email') || exchange.includes('titanmail.com')) {
        return 'caldav';
      }

      // Zoho Mail
      if (exchange.includes('zoho.com') || exchange.includes('zohomail.com')) {
        return 'caldav';
      }
    }

    // Private/unrecognised domain — default to CalDAV with auto-discovery
    return 'caldav';
  } catch (err) {
    console.error('MX Lookup failed for', domain, err.message || err);
    return 'unknown';
  }
}

module.exports = { detectProvider };
