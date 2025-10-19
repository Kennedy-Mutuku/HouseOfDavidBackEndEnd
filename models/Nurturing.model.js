const mongoose = require('mongoose');

const nurturingSchema = new mongoose.Schema({
  nurturedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  sessions: [{
    date: Date,
    notes: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Nurturing', nurturingSchema);
