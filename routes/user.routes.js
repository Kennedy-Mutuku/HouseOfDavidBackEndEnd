const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} = require('../controllers/user.controller');
const { protect, isAdminOrSuper, isSuperAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and admin privileges
router.use(protect);
router.use(isAdminOrSuper);

router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(isSuperAdmin, deleteUser);

router.patch('/:id/toggle-status', toggleUserStatus);

module.exports = router;
