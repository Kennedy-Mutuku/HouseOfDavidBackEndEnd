const Nurturing = require('../models/Nurturing.model');

// @desc    Get user's nurturing records
// @route   GET /api/nurturing/my-nurturing
// @access  Private
exports.getMyNurturing = async (req, res) => {
  try {
    const list = await Nurturing.find({ nurturedBy: req.user._id })
      .sort('-startDate');

    const stats = {
      total: list.length,
      inProgress: list.filter(item => item.status === 'In Progress').length,
      pending: list.filter(item => item.status === 'Pending').length,
      completed: list.filter(item => item.status === 'Completed').length,
      approved: list.filter(item => item.status === 'Approved').length
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

// @desc    Create nurturing record
// @route   POST /api/nurturing
// @access  Private
exports.createNurturing = async (req, res) => {
  try {
    req.body.nurturedBy = req.user._id;
    const nurturing = await Nurturing.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Nurturing record created successfully',
      data: nurturing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update nurturing record
// @route   PUT /api/nurturing/:id
// @access  Private
exports.updateNurturing = async (req, res) => {
  try {
    let nurturing = await Nurturing.findById(req.params.id);

    if (!nurturing) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Check ownership
    if (nurturing.nurturedBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this record'
      });
    }

    nurturing = await Nurturing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: nurturing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all nurturing records (Admin/SuperAdmin)
// @route   GET /api/nurturing
// @access  Private (Admin/SuperAdmin)
exports.getAllNurturing = async (req, res) => {
  try {
    const nurturing = await Nurturing.find()
      .populate('nurturedBy', 'firstName lastName email group')
      .sort('-startDate');

    const stats = {
      total: nurturing.length,
      inProgress: nurturing.filter(item => item.status === 'In Progress').length,
      pending: nurturing.filter(item => item.status === 'Pending').length,
      completed: nurturing.filter(item => item.status === 'Completed').length,
      approved: nurturing.filter(item => item.status === 'Approved').length,
      rejected: nurturing.filter(item => item.status === 'Rejected').length
    };

    res.status(200).json({
      success: true,
      count: nurturing.length,
      data: nurturing,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve nurturing record (Admin/SuperAdmin)
// @route   PUT /api/nurturing/:id/approve
// @access  Private (Admin/SuperAdmin)
exports.approveNurturing = async (req, res) => {
  try {
    const nurturing = await Nurturing.findById(req.params.id);

    if (!nurturing) {
      return res.status(404).json({
        success: false,
        message: 'Nurturing record not found'
      });
    }

    nurturing.status = 'Approved';
    await nurturing.save();

    res.status(200).json({
      success: true,
      message: 'Nurturing approved successfully',
      data: nurturing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete nurturing record (Admin/SuperAdmin)
// @route   DELETE /api/nurturing/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteNurturing = async (req, res) => {
  try {
    const nurturing = await Nurturing.findById(req.params.id);

    if (!nurturing) {
      return res.status(404).json({
        success: false,
        message: 'Nurturing record not found'
      });
    }

    await Nurturing.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Nurturing deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get member's nurturing records (Admin/SuperAdmin)
// @route   GET /api/nurturing/member/:memberId
// @access  Private (Admin/SuperAdmin)
exports.getMemberNurturing = async (req, res) => {
  try {
    const { memberId } = req.params;

    const nurturing = await Nurturing.find({ nurturedBy: memberId })
      .sort('-startDate')
      .limit(5);

    const total = await Nurturing.countDocuments({ nurturedBy: memberId });

    res.status(200).json({
      success: true,
      data: {
        history: nurturing,
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

// @desc    Get current user's nurturing analytics (monthly breakdown)
// @route   GET /api/nurturing/my-analytics
// @access  Private
exports.getMyNurturingAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all nurturing records for this user
    const records = await Nurturing.find({ nurturedBy: userId });

    // Group by month
    const monthlyData = {};
    records.forEach(record => {
      const date = new Date(record.startDate);
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

    // Status breakdown
    const statusBreakdown = {
      inProgress: records.filter(r => r.status === 'In Progress').length,
      pending: records.filter(r => r.status === 'Pending').length,
      completed: records.filter(r => r.status === 'Completed').length,
      approved: records.filter(r => r.status === 'Approved').length
    };

    res.status(200).json({
      success: true,
      data: {
        monthlyData: monthlyArray,
        totalCount: records.length,
        activeCount: records.filter(r => r.status === 'In Progress').length,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching user nurturing analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get specific member's nurturing analytics (Admin/SuperAdmin)
// @route   GET /api/nurturing/member/:memberId/analytics
// @access  Private (Admin/SuperAdmin)
exports.getMemberNurturingAnalytics = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Get all nurturing records for this member
    const records = await Nurturing.find({ nurturedBy: memberId });

    // Group by month
    const monthlyData = {};
    records.forEach(record => {
      const date = new Date(record.startDate);
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

    // Status breakdown
    const statusBreakdown = {
      inProgress: records.filter(r => r.status === 'In Progress').length,
      pending: records.filter(r => r.status === 'Pending').length,
      completed: records.filter(r => r.status === 'Completed').length,
      approved: records.filter(r => r.status === 'Approved').length
    };

    res.status(200).json({
      success: true,
      data: {
        monthlyData: monthlyArray,
        totalCount: records.length,
        activeCount: records.filter(r => r.status === 'In Progress').length,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching member nurturing analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get organization-wide nurturing analytics
// @route   GET /api/nurturing/org-analytics
// @access  Private (Admin/SuperAdmin only)
exports.getOrganizationNurturingAnalytics = async (req, res) => {
  try {
    // Get all nurturing records
    const allRecords = await Nurturing.find();

    // Group by month
    const monthlyData = {};
    allRecords.forEach(record => {
      const date = new Date(record.startDate);
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

    // Status breakdown
    const statusBreakdown = {
      inProgress: allRecords.filter(r => r.status === 'In Progress').length,
      pending: allRecords.filter(r => r.status === 'Pending').length,
      completed: allRecords.filter(r => r.status === 'Completed').length,
      approved: allRecords.filter(r => r.status === 'Approved').length,
      rejected: allRecords.filter(r => r.status === 'Rejected').length
    };

    res.status(200).json({
      success: true,
      data: {
        monthlyData: monthlyArray,
        totalCount: allRecords.length,
        activeCount: allRecords.filter(r => r.status === 'In Progress').length,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching organization nurturing analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
