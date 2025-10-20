const express = require('express');
const router = express.Router();
const {
  getActiveSession,
  createSession,
  signAttendance,
  closeSession,
  refreshSession,
  getAllSessions,
  getSession,
  deleteSession
} = require('../controllers/attendanceSession.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// Public routes (no authentication required)
router.get('/active', getActiveSession);
router.post('/:id/sign', signAttendance);

// Protected routes (authentication required)
router.use(protect);

// Admin/SuperAdmin only routes
router.post('/', isAdminOrSuper, createSession);
router.get('/', isAdminOrSuper, getAllSessions);
router.get('/:id', isAdminOrSuper, getSession);
router.put('/:id/close', isAdminOrSuper, closeSession);
router.put('/:id/refresh', isAdminOrSuper, refreshSession);
router.delete('/:id', isAdminOrSuper, deleteSession);

module.exports = router;
