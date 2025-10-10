const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['Sunday Service', 'Mid-Week Service', 'Prayer Meeting', 'Bible Study', 'Youth Service', 'Special Service'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  time: {
    type: String,
    required: true
  },
  signedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
attendanceSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
