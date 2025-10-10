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
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/stats', getMemberStats);

router.route('/')
  .get(getAllMembers)
  .post(createMember);

router.route('/:id')
  .get(getMember)
  .put(updateMember)
  .delete(isAdminOrSuper, deleteMember);

module.exports = router;
