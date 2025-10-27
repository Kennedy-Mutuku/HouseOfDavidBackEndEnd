const Member = require('../models/Member.model');
const Donation = require('../models/Donation.model');
const InGathering = require('../models/InGathering.model');
const Nurturing = require('../models/Nurturing.model');
const AttendanceSession = require('../models/AttendanceSession.model');

// @desc    Get comprehensive organization analytics
// @route   GET /api/analytics/organization
// @access  Private (SuperAdmin only)
exports.getOrganizationAnalytics = async (req, res) => {
  try {
    // ===== MEMBER STATISTICS =====
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: 'Active' });
    const inactiveMembers = totalMembers - activeMembers;

    // Member growth over time (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const memberGrowth = await Member.aggregate([
      {
        $match: {
          membershipDate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$membershipDate' },
            month: { $month: '$membershipDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Members by people group
    const membersByPeopleGroup = await Member.aggregate([
      {
        $match: { status: 'Active' }
      },
      {
        $group: {
          _id: '$peopleGroup',
          count: { $sum: 1 }
        }
      }
    ]);

    // Members by growth group
    const membersByGrowthGroup = await Member.aggregate([
      {
        $match: { status: 'Active' }
      },
      {
        $group: {
          _id: '$growthGroup',
          count: { $sum: 1 }
        }
      }
    ]);

    // ===== GIVING STATISTICS =====
    const totalDonations = await Donation.countDocuments({ status: 'Completed' });

    const totalGivingAmount = await Donation.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Giving by type
    const givingByType = await Donation.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$donationType',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Monthly giving trends (last 12 months)
    const monthlyGiving = await Donation.aggregate([
      {
        $match: {
          status: 'Completed',
          date: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top 10 donors
    const topDonors = await Donation.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$donor',
          totalGiven: { $sum: '$amount' },
          donationCount: { $sum: 1 }
        }
      },
      { $sort: { totalGiven: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'members',
          localField: '_id',
          foreignField: '_id',
          as: 'memberInfo'
        }
      },
      { $unwind: { path: '$memberInfo', preserveNullAndEmptyArrays: true } }
    ]);

    // ===== ATTENDANCE STATISTICS =====
    const totalSessions = await AttendanceSession.countDocuments();
    const closedSessions = await AttendanceSession.find({ status: 'Closed' });

    let totalAttendances = 0;
    closedSessions.forEach(session => {
      totalAttendances += session.signatures.length;
    });

    const averageAttendancePerSession = totalSessions > 0
      ? (totalAttendances / totalSessions).toFixed(1)
      : 0;

    const organizationAttendanceRate = (activeMembers * totalSessions) > 0
      ? ((totalAttendances / (activeMembers * totalSessions)) * 100).toFixed(1)
      : 0;

    // Attendance trends over time
    const attendanceTrends = closedSessions
      .filter(session => session.closedAt && session.closedAt >= twelveMonthsAgo)
      .map(session => ({
        date: session.openedAt,
        count: session.signatures.length,
        sessionName: session.sessionName
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // ===== IN-GATHERING STATISTICS =====
    const totalInGathering = await InGathering.countDocuments();

    const inGatheringByStatus = await InGathering.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly in-gathering trends
    const monthlyInGathering = await InGathering.aggregate([
      {
        $match: {
          invitedDate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$invitedDate' },
            month: { $month: '$invitedDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top in-gathering performers
    const topInGatheringPerformers = await InGathering.aggregate([
      {
        $group: {
          _id: '$invitedBy',
          totalInvited: { $sum: 1 }
        }
      },
      { $sort: { totalInvited: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } }
    ]);

    // ===== NURTURING STATISTICS =====
    const totalNurturing = await Nurturing.countDocuments();

    const nurturingByStatus = await Nurturing.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly nurturing trends
    const monthlyNurturing = await Nurturing.aggregate([
      {
        $match: {
          startDate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top nurturing performers
    const topNurturingPerformers = await Nurturing.aggregate([
      {
        $group: {
          _id: '$nurturedBy',
          totalNurtured: { $sum: 1 }
        }
      },
      { $sort: { totalNurtured: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } }
    ]);

    // ===== RESPONSE =====
    res.status(200).json({
      success: true,
      data: {
        members: {
          total: totalMembers,
          active: activeMembers,
          inactive: inactiveMembers,
          growthTrend: memberGrowth,
          byPeopleGroup: membersByPeopleGroup,
          byGrowthGroup: membersByGrowthGroup
        },
        giving: {
          totalDonations,
          totalAmount: totalGivingAmount[0]?.total || 0,
          averagePerMember: activeMembers > 0
            ? ((totalGivingAmount[0]?.total || 0) / activeMembers).toFixed(2)
            : 0,
          byType: givingByType,
          monthlyTrends: monthlyGiving,
          topDonors: topDonors.map(donor => ({
            name: donor.memberInfo
              ? `${donor.memberInfo.firstName} ${donor.memberInfo.lastName}`
              : 'Unknown',
            totalGiven: donor.totalGiven,
            donationCount: donor.donationCount
          }))
        },
        attendance: {
          totalSessions,
          totalAttendances,
          averagePerSession: parseFloat(averageAttendancePerSession),
          organizationRate: parseFloat(organizationAttendanceRate),
          trends: attendanceTrends
        },
        inGathering: {
          total: totalInGathering,
          byStatus: inGatheringByStatus,
          monthlyTrends: monthlyInGathering,
          topPerformers: topInGatheringPerformers.map(performer => ({
            name: performer.userInfo
              ? `${performer.userInfo.firstName || ''} ${performer.userInfo.lastName || ''}`.trim()
              : 'Unknown',
            totalInvited: performer.totalInvited
          }))
        },
        nurturing: {
          total: totalNurturing,
          byStatus: nurturingByStatus,
          monthlyTrends: monthlyNurturing,
          topPerformers: topNurturingPerformers.map(performer => ({
            name: performer.userInfo
              ? `${performer.userInfo.firstName || ''} ${performer.userInfo.lastName || ''}`.trim()
              : 'Unknown',
            totalNurtured: performer.totalNurtured
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching organization analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
