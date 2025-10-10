const Member = require('../models/Member.model');

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
    req.body.createdBy = req.user._id;
    const member = await Member.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
