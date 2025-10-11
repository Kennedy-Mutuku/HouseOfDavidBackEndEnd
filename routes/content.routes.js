const express = require('express');
const router = express.Router();
const {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllDevotions,
  createDevotion,
  getAllNews,
  createNews
} = require('../controllers/content.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// Public or protected routes
router.get('/announcements', protect, getAllAnnouncements);
router.get('/devotions', protect, getAllDevotions);
router.get('/news', protect, getAllNews);

// Admin routes
router.post('/announcements', protect, isAdminOrSuper, createAnnouncement);
router.put('/announcements/:id', protect, isAdminOrSuper, updateAnnouncement);
router.delete('/announcements/:id', protect, isAdminOrSuper, deleteAnnouncement);

router.post('/devotions', protect, isAdminOrSuper, createDevotion);
router.post('/news', protect, isAdminOrSuper, createNews);

module.exports = router;
