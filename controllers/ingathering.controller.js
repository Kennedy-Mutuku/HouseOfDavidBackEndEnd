const InGathering = require('../models/InGathering.model');

// @desc    Get user's in-gathering records
// @route   GET /api/ingathering/my-ingathering
// @access  Private
exports.getMyInGathering = async (req, res) => {
  try {
    const list = await InGathering.find({ invitedBy: req.user._id })
      .sort('-invitedDate');

    const stats = {
      total: list.length,
      attended: list.filter(item => item.status === 'Attended').length,
      pending: list.filter(item => item.status === 'Pending').length
    };

    res.status(200).json({
      success: true,
      data: {
        list,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create in-gathering record
// @route   POST /api/ingathering
// @access  Private
exports.createInGathering = async (req, res) => {
  try {
    req.body.invitedBy = req.user._id;
    const inGathering = await InGathering.create(req.body);

    res.status(201).json({
      success: true,
      message: 'In-gathering record created successfully',
      data: inGathering
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update in-gathering record
// @route   PUT /api/ingathering/:id
// @access  Private
exports.updateInGathering = async (req, res) => {
  try {
    let inGathering = await InGathering.findById(req.params.id);

    if (!inGathering) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Check ownership
    if (inGathering.invitedBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this record'
      });
    }

    inGathering = await InGathering.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: inGathering
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all in-gathering records (Admin/SuperAdmin)
// @route   GET /api/ingathering
// @access  Private (Admin/SuperAdmin)
exports.getAllInGathering = async (req, res) => {
  try {
    const inGathering = await InGathering.find()
      .populate('invitedBy', 'firstName lastName email group')
      .sort('-invitedDate');

    const stats = {
      total: inGathering.length,
      attended: inGathering.filter(item => item.status === 'Attended').length,
      pending: inGathering.filter(item => item.status === 'Pending').length,
      approved: inGathering.filter(item => item.status === 'Approved').length,
      rejected: inGathering.filter(item => item.status === 'Rejected').length
    };

    res.status(200).json({
      success: true,
      count: inGathering.length,
      data: inGathering,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve in-gathering record (Admin/SuperAdmin)
// @route   PUT /api/ingathering/:id/approve
// @access  Private (Admin/SuperAdmin)
exports.approveInGathering = async (req, res) => {
  try {
    const inGathering = await InGathering.findById(req.params.id);

    if (!inGathering) {
      return res.status(404).json({
        success: false,
        message: 'In-gathering record not found'
      });
    }

    inGathering.status = 'Approved';
    await inGathering.save();

    res.status(200).json({
      success: true,
      message: 'In-gathering approved successfully',
      data: inGathering
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete in-gathering record (Admin/SuperAdmin)
// @route   DELETE /api/ingathering/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteInGathering = async (req, res) => {
  try {
    const inGathering = await InGathering.findById(req.params.id);

    if (!inGathering) {
      return res.status(404).json({
        success: false,
        message: 'In-gathering record not found'
      });
    }

    await InGathering.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'In-gathering deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get member's in-gathering records (Admin/SuperAdmin)
// @route   GET /api/ingathering/member/:memberId
// @access  Private (Admin/SuperAdmin)
exports.getMemberInGathering = async (req, res) => {
  try {
    const { memberId } = req.params;

    const inGathering = await InGathering.find({ invitedBy: memberId })
      .sort('-invitedDate')
      .limit(5);

    const total = await InGathering.countDocuments({ invitedBy: memberId });

    res.status(200).json({
      success: true,
      data: {
        history: inGathering,
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user's in-gathering analytics (monthly breakdown)
// @route   GET /api/ingathering/my-analytics
// @access  Private
exports.getMyInGatheringAnalytics = async (req, res) => {
  try {
    const User = require('../models/User.model');

    // Get user's ID from the authenticated user
    const userId = req.user._id;

    // Get all in-gathering records for this user
    const records = await InGathering.find({ invitedBy: userId });

    // Group by month
    const monthlyData = {};
    records.forEach(record => {
      const date = new Date(record.invitedDate);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthYear,
          count: 0,
          year: date.getFullYear(),
          monthNum: date.getMonth()
        };
      }
      monthlyData[monthYear].count++;
    });

    // Convert to array and sort by date
    const monthlyArray = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });

    res.status(200).json({
      success: true,
      data: {
        monthlyData: monthlyArray,
        totalCount: records.length
      }
    });
  } catch (error) {
    console.error('Error fetching user in-gathering analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get specific member's in-gathering analytics (Admin/SuperAdmin)
// @route   GET /api/ingathering/member/:memberId/analytics
// @access  Private (Admin/SuperAdmin)
exports.getMemberInGatheringAnalytics = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Get all in-gathering records for this member
    const records = await InGathering.find({ invitedBy: memberId });

    // Group by month
    const monthlyData = {};
    records.forEach(record => {
      const date = new Date(record.invitedDate);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthYear,
          count: 0,
          year: date.getFullYear(),
          monthNum: date.getMonth()
        };
      }
      monthlyData[monthYear].count++;
    });

    // Convert to array and sort by date
    const monthlyArray = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });

    res.status(200).json({
      success: true,
      data: {
        monthlyData: monthlyArray,
        totalCount: records.length
      }
    });
  } catch (error) {
    console.error('Error fetching member in-gathering analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get organization-wide in-gathering analytics
// @route   GET /api/ingathering/org-analytics
// @access  Private (Admin/SuperAdmin only)
exports.getOrganizationInGatheringAnalytics = async (req, res) => {
  try {
    // Get all in-gathering records
    const allRecords = await InGathering.find();

    // Group by month
    const monthlyData = {};
    allRecords.forEach(record => {
      const date = new Date(record.invitedDate);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthYear,
          count: 0,
          year: date.getFullYear(),
          monthNum: date.getMonth()
        };
      }
      monthlyData[monthYear].count++;
    });

    // Convert to array and sort by date
    const monthlyArray = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });

    // Get status breakdown
    const statusBreakdown = {
      attended: allRecords.filter(r => r.status === 'Attended').length,
      pending: allRecords.filter(r => r.status === 'Pending').length,
      approved: allRecords.filter(r => r.status === 'Approved').length,
      rejected: allRecords.filter(r => r.status === 'Rejected').length
    };

    res.status(200).json({
      success: true,
      data: {
        monthlyData: monthlyArray,
        totalCount: allRecords.length,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching organization in-gathering analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
