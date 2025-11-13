const AttendanceSession = require('../models/AttendanceSession.model');

// @desc    Get active attendance session
// @route   GET /api/attendance-sessions/active
// @access  Public (so anyone can see and sign)
exports.getActiveSession = async (req, res) => {
  try {
    const activeSession = await AttendanceSession.findOne({ status: 'Active' })
      .sort('-openedAt')
      .select('-signatures.signature'); // Don't send signature images to client

    if (!activeSession) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active attendance session'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: activeSession._id,
        sessionName: activeSession.sessionName,
        description: activeSession.description,
        openedAt: activeSession.openedAt,
        signatureCount: activeSession.signatures.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new attendance session
// @route   POST /api/attendance-sessions
// @access  Private (Admin/SuperAdmin only)
exports.createSession = async (req, res) => {
  try {
    const { sessionName, description } = req.body;

    // Close any existing active sessions
    await AttendanceSession.updateMany(
      { status: 'Active' },
      {
        status: 'Closed',
        closedAt: new Date(),
        closedBy: req.user._id
      }
    );

    // Create new session
    const session = await AttendanceSession.create({
      sessionName,
      description,
      createdBy: req.user._id,
      status: 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Attendance session created successfully',
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Sign attendance
// @route   POST /api/attendance-sessions/:id/sign
// @access  Public
exports.signAttendance = async (req, res) => {
  try {
    const { fullName, phoneNumber, signature } = req.body;
    const sessionId = req.params.id;

    if (!fullName || !phoneNumber || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Full name, phone number, and signature are required'
      });
    }

    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    if (session.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'This attendance session is closed'
      });
    }

    // Check if already signed (by phone number)
    const alreadySigned = session.signatures.find(
      sig => sig.phoneNumber === phoneNumber
    );

    if (alreadySigned) {
      return res.status(400).json({
        success: false,
        message: 'You have already signed this attendance'
      });
    }

    // Check if phone number matches a User or Member in the database
    const User = require('../models/User.model');
    const Member = require('../models/Member.model');

    let matchedUser = null;
    let matchedMember = null;

    // Try to find user by phone number
    try {
      matchedUser = await User.findOne({ phone: phoneNumber });
    } catch (err) {
      console.log('Error finding user by phone:', err.message);
    }

    // Try to find member by phone number
    try {
      matchedMember = await Member.findOne({ phone: phoneNumber });
    } catch (err) {
      console.log('Error finding member by phone:', err.message);
    }

    const isRegistered = !!(matchedUser || matchedMember);

    // Add signature with user/member links if found
    session.signatures.push({
      fullName,
      phoneNumber,
      signature,
      signedAt: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userId: matchedUser ? matchedUser._id : null,
      memberId: matchedMember ? matchedMember._id : null,
      isRegistered
    });

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Attendance signed successfully',
      data: {
        signatureCount: session.signatures.length,
        linkedToAccount: isRegistered
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Close attendance session
// @route   PUT /api/attendance-sessions/:id/close
// @access  Private (Admin/SuperAdmin only)
exports.closeSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    session.status = 'Closed';
    session.closedAt = new Date();
    session.closedBy = req.user._id;

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Attendance session closed successfully',
      data: session
    });
  } catch (error) {
    console.error('Error closing session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to close attendance session'
    });
  }
};

// @desc    Refresh attendance session (clear all signatures and restart)
// @route   PUT /api/attendance-sessions/:id/refresh
// @access  Private (Admin/SuperAdmin only)
exports.refreshSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    if (session.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Can only refresh active sessions'
      });
    }

    // Clear all signatures and reset the session
    session.signatures = [];
    session.openedAt = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Attendance session refreshed successfully',
      data: session
    });
  } catch (error) {
    console.error('Error refreshing session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh attendance session'
    });
  }
};

// @desc    Get all attendance sessions (with signatures)
// @route   GET /api/attendance-sessions
// @access  Private (Admin/SuperAdmin only)
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find()
      .populate('createdBy', 'firstName lastName email')
      .populate('closedBy', 'firstName lastName email')
      .sort('-openedAt');

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single session with all signatures
// @route   GET /api/attendance-sessions/:id
// @access  Private (Admin/SuperAdmin only)
exports.getSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('closedBy', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete attendance session
// @route   DELETE /api/attendance-sessions/:id
// @access  Private (Admin/SuperAdmin only)
exports.deleteSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByIdAndDelete(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete attendance session'
    });
  }
};

// @desc    Get current user's attendance statistics
// @route   GET /api/attendance-sessions/my-stats
// @access  Private
exports.getUserAttendanceStats = async (req, res) => {
  try {
    // Get all sessions (both Active and Closed) - count sessions as soon as they're opened
    const allSessions = await AttendanceSession.find();
    const totalSessions = allSessions.length;

    // Count sessions where the current user's ID is linked in signatures
    const attendedSessions = allSessions.filter(session =>
      session.signatures.some(sig =>
        sig.userId && sig.userId.toString() === req.user._id.toString()
      )
    ).length;

    const missed = totalSessions - attendedSessions;
    const attendanceRate = totalSessions > 0
      ? ((attendedSessions / totalSessions) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        attended: attendedSessions,
        missed,
        attendanceRate: parseFloat(attendanceRate)
      }
    });
  } catch (error) {
    console.error('Error fetching user attendance stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get specific member's attendance statistics
// @route   GET /api/attendance-sessions/member/:memberId/stats
// @access  Private (Admin/SuperAdmin only)
exports.getMemberAttendanceStats = async (req, res) => {
  try {
    const Member = require('../models/Member.model');
    const { memberId } = req.params;

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Get all sessions (both Active and Closed) - count sessions as soon as they're opened
    const allSessions = await AttendanceSession.find();
    const totalSessions = allSessions.length;

    // Count sessions where the member's ID is linked in signatures
    const attendedSessions = allSessions.filter(session =>
      session.signatures.some(sig =>
        sig.memberId && sig.memberId.toString() === memberId
      )
    ).length;

    const missed = totalSessions - attendedSessions;
    const attendanceRate = totalSessions > 0
      ? ((attendedSessions / totalSessions) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        attended: attendedSessions,
        missed,
        attendanceRate: parseFloat(attendanceRate)
      }
    });
  } catch (error) {
    console.error('Error fetching member attendance stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get organization-wide attendance statistics
// @route   GET /api/attendance-sessions/org-stats
// @access  Private (Admin/SuperAdmin only)
exports.getOrganizationAttendanceStats = async (req, res) => {
  try {
    const Member = require('../models/Member.model');

    // Get all sessions (both Active and Closed) - count sessions as soon as they're opened
    const allSessions = await AttendanceSession.find();
    const totalSessions = allSessions.length;

    // Get total active members
    const totalMembers = await Member.countDocuments({ status: 'Active' });

    // Calculate total possible attendances (members * sessions)
    const totalPossibleAttendances = totalMembers * totalSessions;

    // Count unique attendances across all sessions
    let totalAttendances = 0;
    allSessions.forEach(session => {
      totalAttendances += session.signatures.length;
    });

    // Calculate organization-wide attendance rate
    const organizationAttendanceRate = totalPossibleAttendances > 0
      ? ((totalAttendances / totalPossibleAttendances) * 100).toFixed(1)
      : 0;

    // Average attendance per session
    const averageAttendancePerSession = totalSessions > 0
      ? (totalAttendances / totalSessions).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        totalMembers,
        totalAttendances,
        totalPossibleAttendances,
        missedAttendances: totalPossibleAttendances - totalAttendances,
        organizationAttendanceRate: parseFloat(organizationAttendanceRate),
        averageAttendancePerSession: parseFloat(averageAttendancePerSession)
      }
    });
  } catch (error) {
    console.error('Error fetching organization attendance stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
