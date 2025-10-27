const express = require('express');
const router = express.Router();
const {
  getMyInGathering,
  createInGathering,
  updateInGathering,
  getAllInGathering,
  approveInGathering,
  deleteInGathering,
  getMemberInGathering,
  getMyInGatheringAnalytics,
  getMemberInGatheringAnalytics,
  getOrganizationInGatheringAnalytics
} = require('../controllers/ingathering.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/my-ingathering', getMyInGathering);
router.get('/my-analytics', getMyInGatheringAnalytics);
router.post('/', createInGathering);
router.put('/:id', updateInGathering);

// Admin routes
router.get('/', isAdminOrSuper, getAllInGathering);
router.get('/org-analytics', isAdminOrSuper, getOrganizationInGatheringAnalytics);
router.get('/member/:memberId', isAdminOrSuper, getMemberInGathering);
router.get('/member/:memberId/analytics', isAdminOrSuper, getMemberInGatheringAnalytics);
router.put('/:id/approve', isAdminOrSuper, approveInGathering);
router.delete('/:id', isAdminOrSuper, deleteInGathering);

module.exports = router;
