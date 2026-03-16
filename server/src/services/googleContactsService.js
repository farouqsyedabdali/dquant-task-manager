const { google } = require('googleapis');
const prisma = require('../lib/prisma');

const googleContactsService = {
  /**
   * Create OAuth2 client with user's tokens
   * @param {Object} user - User object with Google tokens
   * @returns {OAuth2Client} Configured OAuth2 client
   */
  createOAuthClient: (user) => {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (user.googleAccessToken && user.googleRefreshToken) {
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
        expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : null
      });
    }

    return oauth2Client;
  },

  /**
   * Refresh Google access token if needed
   * @param {Object} user - User object
   * @returns {Object} Updated user with fresh tokens
   */
  refreshAccessToken: async (user) => {
    try {
      const oauth2Client = googleContactsService.createOAuthClient(user);

      // Get fresh tokens
      const { credentials } = await oauth2Client.refreshAccessToken();
      const expiryDate = new Date(credentials.expiry_date);

      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleAccessToken: credentials.access_token,
          googleRefreshToken: credentials.refresh_token || user.googleRefreshToken,
          googleTokenExpiry: expiryDate
        }
      });

      // Update the client with new credentials
      oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || user.googleRefreshToken,
        expiry_date: expiryDate.getTime()
      });

      return { user: updatedUser, oauth2Client };
    } catch (error) {
      console.error('Error refreshing Google access token:', error);
      throw new Error('Failed to refresh Google access token');
    }
  },

  /**
   * Get user's Google contacts
   * @param {Object} user - User object
   * @param {Object} options - Query options
   * @returns {Array} Array of contact objects
   */
  getContacts: async (user, options = {}) => {
    try {
      let oauth2Client = googleContactsService.createOAuthClient(user);

      // Check if token is expired and refresh if needed
      if (user.googleTokenExpiry && user.googleTokenExpiry <= new Date()) {
        console.log('Google access token expired, refreshing...');
        const result = await googleContactsService.refreshAccessToken(user);
        user = result.user;
        oauth2Client = result.oauth2Client;
      }

      // Create People API client
      const people = google.people({ version: 'v1', auth: oauth2Client });

      // Prepare request parameters
      // Include metadata - sometimes needed for full contact data from the API
      const requestParams = {
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers,photos,metadata',
        pageSize: options.limit || 100
      };

      if (options.pageToken) {
        requestParams.pageToken = options.pageToken;
      }

      // Fetch from connections (saved contacts) and otherContacts (email-derived, not in groups)
      const response = await people.people.connections.list(requestParams);
      let allConnections = response.data.connections || [];

      const firstConnection = (response.data.connections || [])[0];
      console.log('[Google Contacts] connections.list:', {
        count: (response.data.connections || []).length,
        totalItems: response.data.totalItems,
        firstContactKeys: firstConnection ? Object.keys(firstConnection) : [],
        firstContactHasEmail: firstConnection?.emailAddresses?.length > 0,
        firstContactRaw: firstConnection ? JSON.stringify(firstConnection, null, 2).slice(0, 500) : 'none'
      });

      // Also fetch otherContacts - users' contacts may be here (e.g. from Gmail) if not in contact groups
      try {
        const otherResponse = await people.otherContacts.list({
          readMask: 'names,emailAddresses,phoneNumbers,photos',
          pageSize: 100
        });
        const others = otherResponse.data.otherContacts || [];
        console.log('[Google Contacts] otherContacts.list response:', { count: others.length, sample: others[0] });
        others.forEach(p => { p._fromOther = true; });
        allConnections = [...allConnections, ...others];
      } catch (otherErr) {
        console.log('[Google Contacts] otherContacts unavailable:', otherErr.message);
      }

      const seenKeys = new Set();

      const transformPerson = (person) => {
        const primaryEmail = person.emailAddresses?.find(e => e.metadata?.primary) || person.emailAddresses?.[0];
        const email = primaryEmail?.value || null;
        const primaryName = person.names?.find(n => n.metadata?.primary) || person.names?.[0];
        const primaryPhone = person.phoneNumbers?.find(p => p.metadata?.primary) || person.phoneNumbers?.[0];
        const primaryPhoto = person.photos?.find(p => p.metadata?.primary) || person.photos?.[0];
        const rawId = person.resourceName?.replace(/^people\//, '') || '';
        const googleId = person._fromOther ? `other_${rawId}` : rawId;

        // Use email for dedup, or resourceName if no email
        const dedupKey = email || googleId;
        if (seenKeys.has(dedupKey)) return null;
        seenKeys.add(dedupKey);

        const name = primaryName?.displayName || primaryName?.givenName || email || primaryPhone?.value || 'Unknown Contact';
        // Contacts need email to import; show others in list but they won't be importable
        const canImport = !!email;

        return {
          googleId,
          name,
          email: email || '', // Empty string for display when no email
          phone: primaryPhone?.value || null,
          photoUrl: primaryPhoto?.url || null,
          isPrimary: true,
          canImport
        };
      };

      const contacts = allConnections
        .map(transformPerson)
        .filter(Boolean);

      console.log('[Google Contacts] Final contacts count:', contacts.length, 'from', allConnections.length, 'raw entries');

      return {
        contacts,
        nextPageToken: response.data.nextPageToken,
        totalItems: response.data.totalItems ?? contacts.length
      };

    } catch (error) {
      console.error('Error fetching Google contacts:', error);

      // Handle specific Google API errors
      if (error.code === 401) {
        throw new Error('Google access token is invalid. Please reconnect your Google account.');
      } else if (error.code === 403) {
        throw new Error('Google Contacts access denied. Please grant contacts permission.');
      } else if (error.code === 429) {
        throw new Error('Google API rate limit exceeded. Please try again later.');
      }

      throw new Error('Failed to fetch Google contacts: ' + error.message);
    }
  },

  /**
   * Search Google contacts
   * @param {Object} user - User object
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @returns {Array} Array of matching contacts
   */
  searchContacts: async (user, query, options = {}) => {
    try {
      const result = await googleContactsService.getContacts(user, { ...options, limit: 200 });

      if (!query || query.trim().length < 2) {
        return result;
      }

      const searchTerm = query.toLowerCase().trim();

      // Filter contacts by search term
      const filteredContacts = result.contacts.filter(contact => {
        return (
          contact.name.toLowerCase().includes(searchTerm) ||
          contact.email.toLowerCase().includes(searchTerm) ||
          (contact.phone && contact.phone.includes(searchTerm))
        );
      });

      return {
        ...result,
        contacts: filteredContacts
      };

    } catch (error) {
      console.error('Error searching Google contacts:', error);
      throw error;
    }
  },

  /**
   * Update user's Google contacts access status
   * @param {number} userId - User ID
   * @param {boolean} hasAccess - Whether user has contacts access
   */
  updateContactsAccess: async (userId, hasAccess) => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { googleContactsScope: hasAccess }
      });
    } catch (error) {
      console.error('Error updating Google contacts access:', error);
      throw new Error('Failed to update Google contacts access status');
    }
  },

  /**
   * Check if user has Google contacts access
   * @param {Object} user - User object
   * @returns {boolean} Whether user has access
   */
  hasContactsAccess: (user) => {
    return !!(
      user.googleId &&
      user.googleAccessToken &&
      user.googleContactsScope
    );
  },

  /**
   * Revoke Google contacts access
   * @param {number} userId - User ID
   */
  revokeContactsAccess: async (userId) => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: null,
          googleRefreshToken: null,
          googleTokenExpiry: null,
          googleContactsScope: false
        }
      });
    } catch (error) {
      console.error('Error revoking Google contacts access:', error);
      throw new Error('Failed to revoke Google contacts access');
    }
  }
};

module.exports = googleContactsService;