const express = require('express');
const router = express.Router();
const {
  createContactRequest,
  getAllContactRequests,
  getPendingContactRequests,
  updateContactRequestStatus,
  deleteContactRequest
} = require('../controllers/contact.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// Public routes
router.post('/', createContactRequest);

// Protected routes (Admin/SuperAdmin)
router.get('/', protect, isAdminOrSuper, getAllContactRequests);
router.get('/pending', protect, isAdminOrSuper, getPendingContactRequests);
router.patch('/:id', protect, isAdminOrSuper, updateContactRequestStatus);
router.delete('/:id', protect, isAdminOrSuper, deleteContactRequest);

module.exports = router;
