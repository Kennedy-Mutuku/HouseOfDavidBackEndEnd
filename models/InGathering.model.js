const mongoose = require('mongoose');

const inGatheringSchema = new mongoose.Schema({
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  // Keep old fields for backward compatibility
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  invitedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Attended', 'Not Interested', 'Rejected'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  attendedDates: [{
    type: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('InGathering', inGatheringSchema);
