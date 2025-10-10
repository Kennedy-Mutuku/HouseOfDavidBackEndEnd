const Event = require('../models/Event.model');

// @desc    Get all events
// @route   GET /api/events
// @access  Private
exports.getAllEvents = async (req, res) => {
  try {
    const { status, eventType, startDate, endDate } = req.query;
    let query = {};

    if (status) query.status = status;
    if (eventType) query.eventType = eventType;

    // Date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const events = await Event.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .sort('startDate');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email phone');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private (Admin/SuperAdmin)
exports.createEvent = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin/SuperAdmin)
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    req.body.updatedBy = req.user._id;

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add attendee to event
// @route   POST /api/events/:id/attendees/:memberId
// @access  Private
exports.addAttendee = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if member already registered
    if (event.attendees.includes(req.params.memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Member already registered for this event'
      });
    }

    // Check max attendees
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        message: 'Event has reached maximum capacity'
      });
    }

    event.attendees.push(req.params.memberId);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Attendee added successfully',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove attendee from event
// @route   DELETE /api/events/:id/attendees/:memberId
// @access  Private
exports.removeAttendee = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.attendees = event.attendees.filter(
      attendee => attendee.toString() !== req.params.memberId
    );

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Attendee removed successfully',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
