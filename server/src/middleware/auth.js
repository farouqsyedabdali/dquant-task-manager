const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const secureLogger = require('./secureLogger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    secureLogger.debug('🔑 AUTH MIDDLEWARE:', {
      path: req.path,
      hasToken: !!token,
      tokenLength: token?.length,
      timestamp: new Date().toISOString()
    });
    
    if (!token) {
      secureLogger.warn('❌ NO TOKEN provided', { path: req.path });
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    secureLogger.debug('🔓 TOKEN DECODED:', {
      userId: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        company: true
      }
    });

    if (!user) {
      secureLogger.warn('❌ USER NOT FOUND in database', { userId: decoded.userId });
      return res.status(401).json({ error: 'Invalid token.' });
    }

    secureLogger.debug('✅ AUTH SUCCESS:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });

    // Add company context to request
    req.user = user;
    req.companyId = user.companyId;
    next();
  } catch (error) {
    secureLogger.warn('❌ AUTH ERROR:', { message: error.message, path: req.path });
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth; 