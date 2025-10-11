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
      pending: inGathering.filter(item => item.status === 'Pending').length
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
