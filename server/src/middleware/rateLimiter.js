const rateLimit = require('express-rate-limit');
const secureLogger = require('./secureLogger');

const isDevelopment = process.env.NODE_ENV === 'development';

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5,
  message: {
    error: 'Too many login attempts from this IP. Please try again in 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  handler: (req, res) => {
    secureLogger.warn('Rate limit exceeded for auth endpoint', {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      error: 'Too many login attempts from this IP. Please try again in 15 minutes.'
    });
  }
});

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100,
  message: {
    error: 'Too many requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    secureLogger.warn('Rate limit exceeded for API', {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      error: 'Too many requests from this IP. Please try again later.'
    });
  }
});

// AI endpoint rate limit (expensive operations)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI requests per hour (generous for free tier)
  message: {
    error: 'AI request limit reached. Please try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    secureLogger.warn('AI rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      error: 'AI request limit reached. Please try again in an hour.',
      hint: 'Upgrade to Pro for unlimited AI requests'
    });
  }
});

// Feedback endpoint rate limit (prevent spam)
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 feedback submissions per hour
  message: {
    error: 'Too many feedback submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    secureLogger.warn('Feedback rate limit exceeded', {
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      error: 'Too many feedback submissions. Please try again in an hour.'
    });
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  aiLimiter,
  feedbackLimiter
};
