const User = require('../models/User.model');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/SuperAdmin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/SuperAdmin)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin/SuperAdmin)
exports.createUser = async (req, res) => {
  try {
    const { email, idNumber, username, password, role } = req.body;

    // Check if user exists by email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Convert role to array if it's a string
    const roles = Array.isArray(role) ? role : [role];
    req.body.role = roles;

    // Check if any admin roles are present
    const hasAdminRole = roles.includes('admin') || roles.includes('superadmin');
    const hasUserRole = roles.includes('user');

    // Validation based on roles
    if (hasAdminRole) {
      // For admin/superadmin: require username and password
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required for Admin and Super Admin users'
        });
      }

      // Check if username exists
      const usernameExists = await User.findOne({ username: username.toUpperCase() });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      req.body.username = username.toUpperCase();
      req.body.password = password;
    }

    if (hasUserRole && !hasAdminRole) {
      // For regular users only: require ID number, phone, and date of birth
      if (!idNumber) {
        return res.status(400).json({
          success: false,
          message: 'ID number is required for regular users'
        });
      }

      if (!req.body.phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for regular users'
        });
      }

      if (!req.body.dateOfBirth) {
        return res.status(400).json({
          success: false,
          message: 'Date of birth is required for regular users'
        });
      }

      // Check if ID number exists
      const idExists = await User.findOne({ idNumber });
      if (idExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this ID number already exists'
        });
      }

      // Set ID number as default password if not provided
      if (!password) {
        req.body.password = idNumber;
      }
    }

    req.body.createdBy = req.user._id;
    const user = await User.create(req.body);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    const message = hasAdminRole
      ? `User created successfully with username: ${username}`
      : 'User created successfully. Default password is their ID number.';

    res.status(201).json({
      success: true,
      message,
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin/SuperAdmin)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert role to array if it's a string
    if (req.body.role && !Array.isArray(req.body.role)) {
      req.body.role = [req.body.role];
    }

    // Handle password update if provided
    if (req.body.password) {
      user.password = req.body.password;
      await user.save();
      delete req.body.password;
    }

    // Update other fields
    Object.assign(user, req.body);
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (SuperAdmin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/users/:id/toggle-status
// @access  Private (Admin/SuperAdmin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
