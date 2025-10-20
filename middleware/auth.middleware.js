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
      console.log('[protect] Token decoded, user ID:', decoded.id);

      // Find user by id
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.error('[protect] User not found for ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('[protect] User found:', req.user.email, 'Role:', req.user.role);

      if (!req.user.isActive) {
        console.error('[protect] User inactive:', req.user.email);
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (error) {
      console.error('[protect] Auth failed:', error.message);
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
  if (!req.user) {
    console.error('[isAdminOrSuper] req.user is undefined - auth may have failed');
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in again.'
    });
  }

  console.log('[isAdminOrSuper] User:', req.user.email, 'Role:', req.user.role, 'Type:', typeof req.user.role);

  const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
  console.log('[isAdminOrSuper] Processed roles:', userRoles);

  const hasAdminRole = userRoles.includes('admin') || userRoles.includes('superadmin');
  console.log('[isAdminOrSuper] Has admin role:', hasAdminRole);

  if (!hasAdminRole) {
    console.error('[isAdminOrSuper] ACCESS DENIED - User:', req.user.email, 'Roles:', userRoles);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
      debug: {
        email: req.user.email,
        roles: userRoles,
        roleType: typeof req.user.role
      }
    });
  }

  console.log('[isAdminOrSuper] ACCESS GRANTED for', req.user.email);
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
