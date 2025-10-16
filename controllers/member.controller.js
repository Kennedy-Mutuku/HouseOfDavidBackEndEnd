const Member = require('../models/Member.model');
const User = require('../models/User.model');

// @desc    Get all members
// @route   GET /api/members
// @access  Private
exports.getAllMembers = async (req, res) => {
  try {
    const { status, department, search } = req.query;
    let query = {};

    // Filter by status
    if (status) {
      query.membershipStatus = status;
    }

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await Member.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Private
exports.getMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create member
// @route   POST /api/members
// @access  Private
exports.createMember = async (req, res) => {
  try {
    const { email, phone, idNo, firstName, lastName } = req.body;

    // Check for duplicate email in Member model
    const existingMemberEmail = await Member.findOne({ email: email.toLowerCase() });
    if (existingMemberEmail) {
      return res.status(400).json({
        success: false,
        message: 'A member with this email already exists'
      });
    }

    // Check for duplicate phone in Member model
    const existingMemberPhone = await Member.findOne({ phone });
    if (existingMemberPhone) {
      return res.status(400).json({
        success: false,
        message: 'A member with this phone number already exists'
      });
    }

    // Check for duplicate ID number in Member model
    const existingMemberIdNo = await Member.findOne({ idNo });
    if (existingMemberIdNo) {
      return res.status(400).json({
        success: false,
        message: 'A member with this ID number already exists'
      });
    }

    // Check for duplicate email in User model
    const existingUserEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserEmail) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered in the system'
      });
    }

    // Check for duplicate ID number in User model
    const existingUserIdNo = await User.findOne({ idNumber: idNo });
    if (existingUserIdNo) {
      return res.status(400).json({
        success: false,
        message: 'This ID number is already registered in the system'
      });
    }

    // Set createdBy if user is authenticated
    if (req.user && req.user._id) {
      req.body.createdBy = req.user._id;
    } else {
      console.error('No authenticated user found. User object:', req.user);
      return res.status(401).json({
        success: false,
        message: 'You must be logged in as an admin to add members. Please log in and try again.'
      });
    }

    const member = await Member.create(req.body);

    // Create corresponding User account for login
    try {
      const newUser = await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        idNumber: idNo,
        password: idNo, // ID number is the default password
        role: ['user'],
        phone,
        isActive: true
      });
      console.log('User account created successfully for:', email);
    } catch (userError) {
      console.error('ERROR creating user account for:', email);
      console.error('Error message:', userError.message);
      console.error('Error details:', userError);

      // Delete the member if user creation fails to maintain consistency
      await Member.findByIdAndDelete(member._id);

      return res.status(500).json({
        success: false,
        message: `Member profile was created but user login account failed: ${userError.message}. Please try again.`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Member created successfully. They can now log in with their email and ID number.',
      data: member
    });
  } catch (error) {
    console.error('Error creating member:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating member'
    });
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private
exports.updateMember = async (req, res) => {
  try {
    let member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    req.body.updatedBy = req.user._id;

    member = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    await Member.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get member statistics
// @route   GET /api/members/stats
// @access  Private
exports.getMemberStats = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ membershipStatus: 'Active' });
    const inactiveMembers = await Member.countDocuments({ membershipStatus: 'Inactive' });
    const pendingMembers = await Member.countDocuments({ membershipStatus: 'Pending' });

    // Members by gender
    const maleMembers = await Member.countDocuments({ gender: 'Male' });
    const femaleMembers = await Member.countDocuments({ gender: 'Female' });

    res.status(200).json({
      success: true,
      data: {
        total: totalMembers,
        active: activeMembers,
        inactive: inactiveMembers,
        pending: pendingMembers,
        byGender: {
          male: maleMembers,
          female: femaleMembers
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
