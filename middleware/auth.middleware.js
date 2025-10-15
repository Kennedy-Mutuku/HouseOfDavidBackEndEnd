const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `User roles '${userRoles.join(', ')}' are not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is admin or superadmin
exports.isAdminOrSuper = (req, res, next) => {
  const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
  const hasAdminRole = userRoles.includes('admin') || userRoles.includes('superadmin');

  if (!hasAdminRole) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if user is superadmin only
exports.isSuperAdmin = (req, res, next) => {
  const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];

  if (!userRoles.includes('superadmin')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.'
    });
  }
  next();
};
