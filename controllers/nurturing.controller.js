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
