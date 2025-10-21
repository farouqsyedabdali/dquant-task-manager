const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔑 AUTH MIDDLEWARE:', {
      path: req.path,
      hasToken: !!token,
      tokenLength: token?.length,
      timestamp: new Date().toISOString()
    });
    
    if (!token) {
      console.log('❌ NO TOKEN provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 TOKEN DECODED:', {
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
      console.log('❌ USER NOT FOUND in database');
      return res.status(401).json({ error: 'Invalid token.' });
    }

    console.log('✅ AUTH SUCCESS:', {
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
    console.log('❌ AUTH ERROR:', error.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth; 