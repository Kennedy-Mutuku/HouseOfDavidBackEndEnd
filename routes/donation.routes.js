const express = require('express');
const router = express.Router();
const {
  getAllDonations,
  getDonation,
  createDonation,
  updateDonation,
  deleteDonation,
  getDonationStats,
  getMyGiving,
  createMyGiving
} = require('../controllers/donation.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/stats', getDonationStats);
router.get('/my-giving', getMyGiving);
router.post('/my-giving', createMyGiving);

router.route('/')
  .get(getAllDonations)
  .post(createDonation);

router.route('/:id')
  .get(getDonation)
  .put(isAdminOrSuper, updateDonation)
  .delete(isAdminOrSuper, deleteDonation);

module.exports = router;
