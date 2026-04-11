const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'Authentication required' } });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } });
      }
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
       return res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND' } });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
