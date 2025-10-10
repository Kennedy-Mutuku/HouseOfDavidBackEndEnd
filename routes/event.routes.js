const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addAttendee,
  removeAttendee
} = require('../controllers/event.controller');
const { protect, isAdminOrSuper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getAllEvents)
  .post(isAdminOrSuper, createEvent);

router.route('/:id')
  .get(getEvent)
  .put(isAdminOrSuper, updateEvent)
  .delete(isAdminOrSuper, deleteEvent);

router.post('/:id/attendees/:memberId', addAttendee);
router.delete('/:id/attendees/:memberId', removeAttendee);

module.exports = router;
