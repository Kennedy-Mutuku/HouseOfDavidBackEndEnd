const Donation = require('../models/Donation.model');

// @desc    Get all donations
// @route   GET /api/donations
// @access  Private
exports.getAllDonations = async (req, res) => {
  try {
    const { donationType, paymentMethod, status, startDate, endDate } = req.query;
    let query = {};

    if (donationType) query.donationType = donationType;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const donations = await Donation.find(query)
      .populate('donor', 'firstName lastName fullName email phone idNumber')
      .populate('createdBy', 'firstName lastName fullName email idNumber')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Private
exports.getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create donation
// @route   POST /api/donations
// @access  Private
exports.createDonation = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const donation = await Donation.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully',
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private (Admin/SuperAdmin)
exports.updateDonation = async (req, res) => {
  try {
    let donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    req.body.updatedBy = req.user._id;

    donation = await Donation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Donation updated successfully',
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    await Donation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get donation statistics
// @route   GET /api/donations/stats
// @access  Private
exports.getDonationStats = async (req, res) => {
  try {
    // Total donations
    const totalDonations = await Donation.countDocuments({ status: 'Completed' });

    // Total amount
    const totalAmount = await Donation.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Donations by type
    const byType = await Donation.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$donationType',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Donations by payment method
    const byPaymentMethod = await Donation.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Recent donations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDonations = await Donation.countDocuments({
      status: 'Completed',
      date: { $gte: thirtyDaysAgo }
    });

    const recentAmount = await Donation.aggregate([
      {
        $match: {
          status: 'Completed',
          date: { $gte: thirtyDaysAgo }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: {
          count: totalDonations,
          amount: totalAmount[0]?.total || 0
        },
        byType,
        byPaymentMethod,
        lastThirtyDays: {
          count: recentDonations,
          amount: recentAmount[0]?.total || 0
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

// @desc    Get user's own giving history
// @route   GET /api/donations/my-giving
// @access  Private
exports.getMyGiving = async (req, res) => {
  try {
    const history = await Donation.find({ createdBy: req.user._id })
      .sort('-date')
      .limit(100);

    const stats = await Donation.aggregate([
      { $match: { createdBy: req.user._id, status: 'Completed' } },
      {
        $group: {
          _id: '$donationType',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalTithe = stats.find(s => s._id === 'Tithe')?.total || 0;
    const totalOffering = stats.find(s => s._id === 'Offering' || s._id === 'Special Offering')?.total || 0;
    const totalExtra = stats.filter(s => !['Tithe', 'Offering', 'Special Offering'].includes(s._id))
      .reduce((sum, s) => sum + s.total, 0);
    const total = totalTithe + totalOffering + totalExtra;

    res.status(200).json({
      success: true,
      data: {
        history,
        stats: {
          totalTithe,
          totalOffering,
          totalExtra,
          total
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

// @desc    Create user's own giving
// @route   POST /api/donations/my-giving
// @access  Private
exports.createMyGiving = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    req.body.donor = req.user._id;

    const donation = await Donation.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Giving recorded successfully',
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
