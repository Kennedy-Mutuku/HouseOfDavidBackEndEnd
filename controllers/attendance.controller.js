const Attendance = require('../models/Attendance.model');

// @desc    Get user's attendance records
// @route   GET /api/attendance/my-attendance
// @access  Private
exports.getMyAttendance = async (req, res) => {
  try {
    const history = await Attendance.find({ user: req.user._id })
      .sort('-date')
      .limit(50);

    // Check if already signed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: today }
    });

    // Calculate stats
    const total = await Attendance.countDocuments({ user: req.user._id });

    const thisMonth = await Attendance.countDocuments({
      user: req.user._id,
      date: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    const thisYear = await Attendance.countDocuments({
      user: req.user._id,
      date: { $gte: new Date(new Date().getFullYear(), 0, 1) }
    });

    const percentage = thisYear > 0 ? Math.round((thisYear / 52) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        history,
        todayAttendance,
        stats: {
          total,
          thisMonth,
          percentage
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

// @desc    Sign attendance
// @route   POST /api/attendance/sign-in
// @access  Private
exports.signAttendance = async (req, res) => {
  try {
    const { serviceType, date, time } = req.body;

    // Check if already signed today
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    const existingAttendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already signed for today'
      });
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      serviceType,
      date,
      time
    });

    res.status(201).json({
      success: true,
      message: 'Attendance signed successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all attendance (Admin/SuperAdmin)
// @route   GET /api/attendance
// @access  Private (Admin/SuperAdmin)
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, serviceType } = req.query;
    let query = {};

    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      query.date = {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    const attendance = await Attendance.find(query)
      .populate('user', 'firstName lastName email group')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
