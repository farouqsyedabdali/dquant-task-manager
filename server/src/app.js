const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
require('dotenv').config()

// Import secure logger
const secureLogger = require('./middleware/secureLogger')

const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const commentRoutes = require('./routes/comments')
const userRoutes = require('./routes/users')
const aiRoutes = require('./routes/ai')
const notificationRoutes = require('./routes/notifications')
const auditRoutes = require('./routes/audit')
const taskShareRoutes = require('./routes/taskShares')
const taskArchiveRoutes = require('./routes/taskArchive')
const downloadsRoutes = require('./routes/downloads')
const taskInvitationRoutes = require('./routes/taskInvitations')
const feedbackRoutes = require('./routes/feedback')
const emailVerificationRoutes = require('./routes/emailVerification')
const superAdminRoutes = require('./routes/superAdmin')
const securityRoutes = require('./routes/security')
const contactRoutes = require('./routes/contacts')
const reminderRoutes = require('./routes/reminders')
const projectRoutes = require('./routes/projects')
const templateRoutes = require('./routes/templates')
const googleContactsRoutes = require('./routes/googleContacts')
const gmailAgentRoutes = require('./routes/gmailAgent')
const outlookAgentRoutes = require('./routes/outlookAgent')
const deviceTokenRoutes = require('./routes/deviceTokens')
const internalRoutes = require('./routes/internal')

const app = express()

app.set('trust proxy', 1)

// Security Middleware - Helmet (must be early in middleware chain)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim()) : [])],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // For compatibility with external resources
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin requests
}))

// Force HTTPS in production (only when behind a proxy like Railway/Vercel)
// Skip this in development or when running locally
app.use((req, res, next) => {
  const host = req.header('host') || '';
  const forwardedProto = req.header('x-forwarded-proto');
  const isLocalhost = host.includes('localhost') || 
                     host.includes('127.0.0.1') || 
                     host.includes('::1') ||
                     host.startsWith('localhost:') ||
                     host.startsWith('127.0.0.1:');
  
  // Always allow HTTP on localhost (development)
  if (isLocalhost || process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Only enforce HTTPS in production when behind a proxy
  if (process.env.NODE_ENV === 'production') {
    // Only enforce HTTPS if:
    // 1. We're behind a proxy (x-forwarded-proto header exists)
    // 2. AND the protocol is HTTP (not HTTPS)
    if (forwardedProto && forwardedProto !== 'https') {
      secureLogger.warn('⚠️  HTTP request redirected to HTTPS', { path: req.path, host });
      return res.redirect(`https://${host}${req.url}`);
    }
  }
  
  // Allow request to proceed
  next();
});

// CORS Middleware
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim().toLowerCase().replace(/\/$/, ''))
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Server-to-server requests and tools do not need browser CORS headers.
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
    
    if (allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      secureLogger.warn('⚠️  CORS blocked request from origin:', { origin, normalizedOrigin, allowedOrigins });
      // Return false instead of throwing an error to avoid 500 status codes on preflight requests
      callback(null, false);
    }
  },
  credentials: true
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' })) // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Rate limiting temporarily disabled for local Gmail agent testing.
// Re-enable by restoring middleware from ./middleware/rateLimiter.

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/task-shares', taskShareRoutes)
app.use('/api/task-archive', taskArchiveRoutes)
app.use('/api/downloads', downloadsRoutes)
app.use('/api/task-invitations', taskInvitationRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/email-verification', emailVerificationRoutes)
app.use('/api/super-admin', superAdminRoutes)
app.use('/api/security', securityRoutes)
app.use('/api/contacts', contactRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/google-contacts', googleContactsRoutes)
app.use('/api/gmail-agent', gmailAgentRoutes)
app.use('/api/outlook-agent', outlookAgentRoutes)
app.use('/api/device-tokens', deviceTokenRoutes)
app.use('/api/internal', internalRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tialz API is running' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  secureLogger.error('❌ Unhandled error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  })
  
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  })
})

// 404 handler
app.use('*', (req, res) => {
  secureLogger.warn('⚠️  404 - Route not found:', { 
    path: req.originalUrl,
    method: req.method 
  })
  res.status(404).json({ error: 'Route not found' })
})

module.exports = app
