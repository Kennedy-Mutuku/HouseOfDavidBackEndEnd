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
    const Member = require('../models/Member.model');

    console.log('[getMyGiving] ===== DEBUG START =====');
    console.log('[getMyGiving] User ID:', req.user._id);
    console.log('[getMyGiving] User email:', req.user.email);

    // Find the Member associated with this user
    const member = await Member.findOne({ email: req.user.email });
    console.log('[getMyGiving] Member found:', member ? member._id : 'NONE');

    // Build query - search by createdBy (User ID) OR donor (Member ID)
    const query = {
      $or: [
        { createdBy: req.user._id }
      ]
    };

    // If member found, also search by donor field (Member ID)
    if (member) {
      query.$or.push({ donor: member._id });
    }

    console.log('[getMyGiving] Query:', JSON.stringify(query));

    // Find donations where user is either the creator OR the donor
    const history = await Donation.find(query)
      .sort('-date')
      .limit(100);

    console.log('[getMyGiving] Total donations found:', history.length);
    console.log('[getMyGiving] Sample donation IDs:', history.slice(0, 3).map(d => d._id));

    // Aggregate stats for donations where user is creator OR donor
    // Use $and to properly combine $or with status filter
    const stats = await Donation.aggregate([
      {
        $match: {
          $and: [
            { status: 'Completed' },
            { $or: query.$or }
          ]
        }
      },
      {
        $group: {
          _id: '$donationType',
          total: { $sum: '$amount' }
        }
      }
    ]);

    console.log('[getMyGiving] Aggregated stats:', JSON.stringify(stats));

    const totalOffering = stats.find(s => s._id === 'Offering')?.total || 0;
    const totalTithe = stats.find(s => s._id === 'Tithe')?.total || 0;
    const totalExtraGivings = stats.find(s => s._id === 'Extra Givings')?.total || 0;
    const totalOther = stats.filter(s => !['Offering', 'Tithe', 'Extra Givings'].includes(s._id))
      .reduce((sum, s) => sum + s.total, 0);
    const totalGiving = totalOffering + totalTithe + totalExtraGivings + totalOther;

    console.log('[getMyGiving] Calculated totals:', {
      totalOffering,
      totalTithe,
      totalExtraGivings,
      totalOther,
      totalGiving
    });
    console.log('[getMyGiving] ===== DEBUG END =====');

    res.status(200).json({
      success: true,
      data: {
        history,
        stats: {
          totalOffering,
          totalTithe,
          totalExtraGivings,
          totalOther,
          totalGiving
        }
      }
    });
  } catch (error) {
    console.error('[getMyGiving] ERROR:', error);
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
    const Member = require('../models/Member.model');

    // Find the Member associated with this user
    const member = await Member.findOne({ email: req.user.email });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found. Please contact an administrator.'
      });
    }

    req.body.createdBy = req.user._id;
    req.body.donor = member._id; // Use Member ID, not User ID

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

// @desc    Get member's donations (Admin/SuperAdmin)
// @route   GET /api/donations/member/:memberId
// @access  Private (Admin/SuperAdmin)
exports.getMemberDonations = async (req, res) => {
  try {
    const { memberId } = req.params;
    const mongoose = require('mongoose');

    console.log('[getMemberDonations] Fetching donations for member:', memberId);

    // Convert to ObjectId using the correct syntax
    const memberObjectId = new mongoose.Types.ObjectId(memberId);

    // First, find the User associated with this Member
    const Member = require('../models/Member.model');
    const User = require('../models/User.model');

    const member = await Member.findById(memberObjectId);
    console.log('[getMemberDonations] Member found:', member ? member.email : 'not found');

    let userObjectId = null;
    if (member && member.email) {
      const user = await User.findOne({ email: member.email });
      if (user) {
        userObjectId = user._id;
        console.log('[getMemberDonations] Associated User found:', userObjectId);
      }
    }

    // Fetch all donations for this member - search by BOTH donor (Member ID) AND createdBy (User ID)
    const query = userObjectId
      ? { $or: [{ donor: memberObjectId }, { createdBy: userObjectId }] }
      : { donor: memberObjectId };

    console.log('[getMemberDonations] Query:', JSON.stringify(query));

    const donations = await Donation.find(query)
      .sort('-createdAt')
      .populate('donor', 'firstName lastName fullName email')
      .populate('createdBy', 'firstName lastName fullName email');

    console.log('[getMemberDonations] Found donations:', donations.length);

    // Calculate stats from all completed donations
    const completedDonations = donations.filter(d => d.status === 'Completed');

    const stats = await Donation.aggregate([
      { $match: { ...query, status: 'Completed' } },
      {
        $group: {
          _id: '$donationType',
          total: { $sum: '$amount' }
        }
      }
    ]);

    console.log('[getMemberDonations] Aggregated stats:', stats);

    const totalOffering = stats.find(s => s._id === 'Offering')?.total || 0;
    const totalTithe = stats.find(s => s._id === 'Tithe')?.total || 0;
    const totalExtraGivings = stats.find(s => s._id === 'Extra Givings')?.total || 0;
    const totalOther = stats.filter(s => !['Offering', 'Tithe', 'Extra Givings'].includes(s._id))
      .reduce((sum, s) => sum + s.total, 0);
    const total = totalOffering + totalTithe + totalExtraGivings + totalOther;

    console.log('[getMemberDonations] Total stats:', { totalOffering, totalTithe, totalExtraGivings, totalOther, total });

    res.status(200).json({
      success: true,
      data: {
        history: donations,
        stats: {
          totalOffering,
          totalTithe,
          totalExtraGivings,
          totalOther,
          total
        }
      }
    });
  } catch (error) {
    console.error('[getMemberDonations] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
