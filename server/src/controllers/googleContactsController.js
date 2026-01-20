const googleContactsService = require('../services/googleContactsService');
const prisma = require('../lib/prisma');

const googleContactsController = {
  /**
   * Get user's Google contacts
   * GET /api/google-contacts
   */
  getContacts: async (req, res) => {
    try {
      const userId = req.user.id;
      const { search, limit, pageToken } = req.query;

      // Get user with Google tokens
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user has Google contacts access
      if (!googleContactsService.hasContactsAccess(user)) {
        return res.status(403).json({
          error: 'Google contacts access not available',
          needsReconnect: !user.googleId,
          needsPermission: user.googleId && !user.googleContactsScope
        });
      }

      // Fetch contacts
      let result;
      if (search) {
        result = await googleContactsService.searchContacts(user, search, {
          limit: parseInt(limit) || 50,
          pageToken
        });
      } else {
        result = await googleContactsService.getContacts(user, {
          limit: parseInt(limit) || 50,
          pageToken
        });
      }

      res.json({
        success: true,
        contacts: result.contacts,
        nextPageToken: result.nextPageToken,
        totalItems: result.totalItems,
        hasMore: !!result.nextPageToken
      });

    } catch (error) {
      console.error('Error fetching Google contacts:', error);

      const statusCode = error.message.includes('invalid') || error.message.includes('denied') ? 403 : 500;

      res.status(statusCode).json({
        error: error.message,
        success: false
      });
    }
  },

  /**
   * Check Google contacts access status
   * GET /api/google-contacts/status
   */
  getAccessStatus: async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          googleId: true,
          authProvider: true,
          googleContactsScope: true,
          googleAccessToken: true,
          googleTokenExpiry: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hasAccess = googleContactsService.hasContactsAccess(user);
      const tokenExpired = user.googleTokenExpiry && user.googleTokenExpiry <= new Date();

    res.json({
      hasAccess,
      isGoogleUser: user.authProvider === 'google',
      hasContactsScope: user.googleContactsScope,
      tokenExpired,
      needsReconnect: !user.googleId || tokenExpired,
      needsContactsPermission: user.googleId && !user.googleContactsScope
    });

    } catch (error) {
      console.error('Error checking Google contacts access:', error);
      res.status(500).json({ error: 'Failed to check access status' });
    }
  },

  /**
   * Reconnect Google account for contacts access
   * POST /api/google-contacts/connect
   */
  connectGoogleAccount: async (req, res) => {
    try {
      const userId = req.user.id;
      const { forContacts = false } = req.body; // New parameter to indicate if this is for contacts
      console.log('🔗 Backend connectGoogleAccount called, forContacts:', forContacts);

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('👤 User Google status:', {
        hasGoogleId: !!user.googleId,
        hasContactsScope: user.googleContactsScope,
        authProvider: user.authProvider
      });

      // If requesting contacts and user already has contacts scope, return success
      if (forContacts && user.googleId && user.googleContactsScope && user.googleAccessToken) {
        return res.json({
          success: true,
          message: 'Google contacts already connected',
          hasAccess: true
        });
      }

      // If user doesn't have basic Google auth and we're not requesting contacts, redirect to basic auth
      if (!user.googleId && !forContacts) {
        console.log('User has no Google auth, redirecting to basic Google auth');
        const { getAuthUrl } = require('../services/googleAuthService');
        const authUrl = getAuthUrl();

        return res.json({
          success: true,
          authUrl,
          message: 'Redirect user to Google authentication'
        });
      }

      // If user doesn't have basic Google auth but is requesting contacts, they need basic auth first
      if (!user.googleId && forContacts) {
        return res.status(400).json({
          error: 'User must authenticate with Google first',
          needsBasicAuth: true
        });
      }

      // Generate appropriate Google OAuth URL
      const { getContactsAuthUrl, getAuthUrl } = require('../services/googleAuthService');

      // Use incremental auth URL if requesting contacts permission
      const authUrl = forContacts ? getContactsAuthUrl() : getAuthUrl();
      console.log('🔗 Generated auth URL for', forContacts ? 'contacts' : 'basic auth');

      res.json({
        success: true,
        authUrl,
        message: forContacts
          ? 'Redirect user to this URL to grant contacts permission'
          : 'Redirect user to this URL to authenticate with Google'
      });

    } catch (error) {
      console.error('Error connecting Google account:', error);
      res.status(500).json({ error: 'Failed to connect Google account' });
    }
  },

  /**
   * Disconnect Google contacts access
   * POST /api/google-contacts/disconnect
   */
  disconnectGoogleContacts: async (req, res) => {
    try {
      const userId = req.user.id;

      await googleContactsService.revokeContactsAccess(userId);

      res.json({
        success: true,
        message: 'Google contacts access revoked'
      });

    } catch (error) {
      console.error('Error disconnecting Google contacts:', error);
      res.status(500).json({ error: 'Failed to disconnect Google contacts' });
    }
  },

  /**
   * Import selected Google contacts as local contacts
   * POST /api/google-contacts/import
   */
  importContacts: async (req, res) => {
    try {
      const userId = req.user.id;
      const { contactIds } = req.body;

      if (!Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({ error: 'Contact IDs array is required' });
      }

      // Get user with Google tokens
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!googleContactsService.hasContactsAccess(user)) {
        return res.status(403).json({ error: 'Google contacts access not available' });
      }

      // Fetch all Google contacts to get full details
      const result = await googleContactsService.getContacts(user, { limit: 1000 });

      // Filter selected contacts
      const selectedContacts = result.contacts.filter(contact =>
        contactIds.includes(contact.googleId)
      );

      // Import contacts (skip duplicates)
      const importedContacts = [];
      const skippedContacts = [];

      for (const googleContact of selectedContacts) {
        // Check if contact already exists
        const existingContact = await prisma.contact.findFirst({
          where: {
            userId: userId,
            email: googleContact.email.toLowerCase()
          }
        });

        if (existingContact) {
          skippedContacts.push({
            email: googleContact.email,
            reason: 'Contact already exists'
          });
          continue;
        }

        // Create new contact
        const newContact = await prisma.contact.create({
          data: {
            userId: userId,
            name: googleContact.name,
            email: googleContact.email.toLowerCase(),
            phone: googleContact.phone,
            isPersonal: true, // Default to personal
            // Note: We don't store Google-specific metadata in the contact record
          }
        });

        importedContacts.push(newContact);
      }

      res.json({
        success: true,
        imported: importedContacts.length,
        skipped: skippedContacts.length,
        contacts: importedContacts,
        skippedContacts
      });

    } catch (error) {
      console.error('Error importing Google contacts:', error);
      res.status(500).json({ error: 'Failed to import contacts' });
    }
  }
};

module.exports = googleContactsController;