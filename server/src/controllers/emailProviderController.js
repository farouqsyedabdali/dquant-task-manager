const dns = require('dns').promises;

const WELL_KNOWN_DOMAINS = {
  'gmail.com': 'google',
  'googlemail.com': 'google',
  'outlook.com': 'microsoft',
  'hotmail.com': 'microsoft',
  'live.com': 'microsoft',
  'msn.com': 'microsoft',
};

const MX_PATTERNS = [
  { pattern: /google\.com$/i, provider: 'google' },
  { pattern: /googlemail\.com$/i, provider: 'google' },
  { pattern: /outlook\.com$/i, provider: 'microsoft' },
  { pattern: /protection\.outlook\.com$/i, provider: 'microsoft' },
  { pattern: /hostinger\.com$/i, provider: 'hostinger' },
  { pattern: /titan\.email$/i, provider: 'hostinger' },
  { pattern: /secureserver\.net$/i, provider: 'godaddy' },
  { pattern: /emailsrvr\.com$/i, provider: 'rackspace' },
  { pattern: /yahoodns\.net$/i, provider: 'yahoo' },
  { pattern: /zoho\.com$/i, provider: 'zoho' },
];

const SUPPORTED_PROVIDERS = new Set(['google', 'microsoft', 'hostinger']);

async function detectProviderFromDomain(domain) {
  // Fast-path: well-known consumer domains
  const wellKnown = WELL_KNOWN_DOMAINS[domain.toLowerCase()];
  if (wellKnown) {
    return {
      provider: wellKnown,
      supported: SUPPORTED_PROVIDERS.has(wellKnown),
      domain,
      mxRecords: [],
      source: 'well_known',
    };
  }

  // DNS MX lookup
  let mxRecords = [];
  try {
    const records = await dns.resolveMx(domain);
    mxRecords = records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange.toLowerCase().replace(/\.$/, ''));
  } catch (err) {
    // ENODATA / ENOTFOUND means no MX records — not an error
    if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
      console.error(`MX lookup error for ${domain}:`, err.message);
    }
    return {
      provider: 'unknown',
      supported: false,
      domain,
      mxRecords: [],
      source: 'dns_error',
    };
  }

  // Pattern-match MX records
  for (const mx of mxRecords) {
    for (const { pattern, provider } of MX_PATTERNS) {
      if (pattern.test(mx)) {
        return {
          provider,
          supported: SUPPORTED_PROVIDERS.has(provider),
          domain,
          mxRecords,
          source: 'mx_lookup',
        };
      }
    }
  }

  return {
    provider: 'unknown',
    supported: false,
    domain,
    mxRecords,
    source: 'mx_lookup',
  };
}

const detect = async (req, res) => {
  try {
    const email = req.user.email;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'User email is not set' });
    }

    const domain = email.split('@')[1].toLowerCase();
    const result = await detectProviderFromDomain(domain);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Email provider detection error:', error);
    res.status(500).json({ error: 'Failed to detect email provider' });
  }
};

module.exports = {
  detect,
  detectProviderFromDomain,
};
