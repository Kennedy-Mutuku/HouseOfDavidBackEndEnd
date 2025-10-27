const express = require('express');
const router = express.Router();
const {
  getOrganizationAnalytics
} = require('../controllers/analytics.controller');
const { protect, isSuperAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and super admin role
router.use(protect);
router.use(isSuperAdmin);

// Get comprehensive organization analytics
router.get('/organization', getOrganizationAnalytics);

module.exports = router;
