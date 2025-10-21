const emailService = require('../services/emailService');
const prisma = require('../lib/prisma');

const feedbackController = {
  /**
   * Submit user feedback
   * POST /api/feedback
   */
  async submitFeedback(req, res) {
    try {
      const { name, email, feedback } = req.body;
      
      // Validate input
      if (!name || !email || !feedback) {
        return res.status(400).json({ 
          error: 'Name, email, and feedback are required' 
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Feedback length validation
      if (feedback.length < 10) {
        return res.status(400).json({ 
          error: 'Feedback must be at least 10 characters' 
        });
      }

      if (feedback.length > 2000) {
        return res.status(400).json({ 
          error: 'Feedback must be less than 2000 characters' 
        });
      }

      // Get user info if authenticated
      let userInfo = null;
      if (req.user) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: {
            company: true
          }
        });

        if (user) {
          userInfo = {
            userId: user.id,
            isPersonal: user.company?.isPersonal || false,
            companyName: user.company?.name || null,
            userRole: user.role
          };
        }
      }

      // Send feedback email
      const emailResult = await emailService.sendFeedback({
        name: name.trim(),
        email: email.trim(),
        feedback: feedback.trim(),
        userInfo
      });

      if (!emailResult.success) {
        return res.status(500).json({ 
          error: 'Failed to send feedback. Please try again later.',
          details: emailResult.error 
        });
      }

      res.status(200).json({
        success: true,
        message: 'Thank you for your feedback! We\'ll review it soon.'
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = feedbackController;

