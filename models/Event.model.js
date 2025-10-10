const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true
  },
  eventType: {
    type: String,
    enum: ['Service', 'Prayer Meeting', 'Bible Study', 'Youth Meeting', 'Conference', 'Outreach', 'Other'],
    default: 'Service'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  organizer: {
    type: String,
    trim: true
  },
  maxAttendees: {
    type: Number,
    default: null
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }],
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees ? this.attendees.length : 0;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
