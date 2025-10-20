const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()

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

const app = express()

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Task Manager API is running' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

module.exports = app
