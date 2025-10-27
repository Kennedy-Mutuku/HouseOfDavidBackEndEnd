const express = require('express');
const router = express.Router();
const {
  getMyNurturing,
  createNurturing,
  updateNurturing,
  getAllNurturing,
  approveNurturing,
  deleteNurturing,
  getMemberNurturing,
  getMyNurturingAnalytics,
  getMemberNurturingAnalytics,
  getOrganizationNurturingAnalytics
} = require('../controllers/nurturing.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/my-nurturing', getMyNurturing);
router.get('/my-analytics', getMyNurturingAnalytics);
router.post('/', createNurturing);
router.put('/:id', updateNurturing);

// Admin routes
router.get('/', isAdminOrSuper, getAllNurturing);
router.get('/org-analytics', isAdminOrSuper, getOrganizationNurturingAnalytics);
router.get('/member/:memberId', isAdminOrSuper, getMemberNurturing);
router.get('/member/:memberId/analytics', isAdminOrSuper, getMemberNurturingAnalytics);
router.put('/:id/approve', isAdminOrSuper, approveNurturing);
router.delete('/:id', isAdminOrSuper, deleteNurturing);

module.exports = router;
