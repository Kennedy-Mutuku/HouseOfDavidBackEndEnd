const express = require('express');
const router = express.Router();
const {
  getAllMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getMemberStats
} = require('../controllers/member.controller');
const { protect, isAdminOrSuper, optionalAuth } = require('../middleware/auth.middleware');

// Stats route requires authentication
router.get('/stats', protect, getMemberStats);

// Routes without full protection
router.route('/')
  .get(protect, getAllMembers)
  .post(protect, createMember); // Still requires auth, but error handling is better

router.route('/:id')
  .get(protect, getMember)
  .put(protect, updateMember)
  .delete(protect, isAdminOrSuper, deleteMember);

module.exports = router;
