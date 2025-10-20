const express = require('express');
const router = express.Router();
const {
  getMyNurturing,
  createNurturing,
  updateNurturing,
  getAllNurturing,
  approveNurturing,
  deleteNurturing,
  getMemberNurturing
} = require('../controllers/nurturing.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/my-nurturing', getMyNurturing);
router.post('/', createNurturing);
router.put('/:id', updateNurturing);

// Admin routes
router.get('/', isAdminOrSuper, getAllNurturing);
router.get('/member/:memberId', isAdminOrSuper, getMemberNurturing);
router.put('/:id/approve', isAdminOrSuper, approveNurturing);
router.delete('/:id', isAdminOrSuper, deleteNurturing);

module.exports = router;
