const express = require('express');
const router = express.Router();
const {
  getMyAttendance,
  signAttendance,
  getAllAttendance
} = require('../controllers/attendance.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/my-attendance', getMyAttendance);
router.post('/sign-in', signAttendance);

// Admin routes
router.get('/', isAdminOrSuper, getAllAttendance);

module.exports = router;
