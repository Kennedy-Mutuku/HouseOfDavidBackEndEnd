const express = require('express');
const router = express.Router();
const {
  getMyInGathering,
  createInGathering,
  updateInGathering,
  getAllInGathering
} = require('../controllers/ingathering.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/my-ingathering', getMyInGathering);
router.post('/', createInGathering);
router.put('/:id', updateInGathering);

// Admin routes
router.get('/', isAdminOrSuper, getAllInGathering);

module.exports = router;
