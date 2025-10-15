const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword
} = require('../controllers/auth.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// Public routes
router.post('/login', login);

// Protected routes - Admin only can register users
router.post('/register', protect, isAdminOrSuper, register);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
