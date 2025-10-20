const express = require('express');
const router = express.Router();
const {
  getMyInGathering,
  createInGathering,
  updateInGathering,
  getAllInGathering,
  approveInGathering,
  deleteInGathering,
  getMemberInGathering
} = require('../controllers/ingathering.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/my-ingathering', getMyInGathering);
router.post('/', createInGathering);
router.put('/:id', updateInGathering);

// Admin routes
router.get('/', isAdminOrSuper, getAllInGathering);
router.get('/member/:memberId', isAdminOrSuper, getMemberInGathering);
router.put('/:id/approve', isAdminOrSuper, approveInGathering);
router.delete('/:id', isAdminOrSuper, deleteInGathering);

module.exports = router;
