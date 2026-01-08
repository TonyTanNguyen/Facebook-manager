import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Consistent UUID for internal admin user (used for database queries)
export const INTERNAL_ADMIN_ID = '00000000-0000-0000-0000-000000000000';

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      facebookId: user.facebookId,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Verify JWT token middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle internal admin token (no database lookup needed)
    if (decoded.type === 'internal') {
      req.user = {
        id: INTERNAL_ADMIN_ID, // Use consistent UUID for database queries
        type: 'internal',
        role: decoded.role,
        name: process.env.ADMIN_NAME || 'Admin',
      };
      return next();
    }

    // Fetch user from database (for Facebook OAuth users)
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if Facebook token is still valid
    if (user.tokenExpiresAt && new Date(user.tokenExpiresAt) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Facebook token expired, please re-authenticate',
        code: 'FB_TOKEN_EXPIRED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional auth - doesn't fail if no token, but attaches user if valid
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
};

