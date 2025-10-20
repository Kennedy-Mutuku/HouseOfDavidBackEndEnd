const mongoose = require('mongoose');

const attendanceSignatureSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  signature: {
    type: String, // Base64 encoded signature image
    required: [true, 'Signature is required']
  },
  signedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  }
}, { _id: true });

const attendanceSessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: [true, 'Session name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Closed'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  signatures: [attendanceSignatureSchema],
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
attendanceSessionSchema.index({ status: 1, openedAt: -1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
