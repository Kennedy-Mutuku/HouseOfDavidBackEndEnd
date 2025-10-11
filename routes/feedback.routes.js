const express = require('express');
const router = express.Router();
const {
  getMyConversations,
  createFeedback,
  replyToConversation,
  getAllFeedback,
  updateFeedbackStatus
} = require('../controllers/feedback.controller');
const { protect, isSuperAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/my-conversations', getMyConversations);
router.post('/', createFeedback);
router.post('/:id/reply', replyToConversation);

// SuperAdmin routes
router.get('/', isSuperAdmin, getAllFeedback);
router.patch('/:id/status', isSuperAdmin, updateFeedbackStatus);

module.exports = router;
