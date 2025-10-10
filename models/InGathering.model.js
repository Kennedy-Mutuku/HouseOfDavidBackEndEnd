const mongoose = require('mongoose');

const inGatheringSchema = new mongoose.Schema({
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
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
    enum: ['Pending', 'Attended', 'Not Interested'],
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
