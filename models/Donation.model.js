const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, 'Donor is required']
  },
  amount: {
    type: Number,
    required: [true, 'Donation amount is required'],
    min: [0, 'Amount must be positive']
  },
  donationType: {
    type: String,
    enum: ['Offering', 'Tithe', 'Extra Givings', 'Building Fund', 'Mission', 'Other'],
    default: 'Offering'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Check', 'Card', 'Bank Transfer', 'Mobile Money', 'Other'],
    default: 'Cash'
  },
  transactionReference: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Completed'
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

// Generate receipt number before saving
donationSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const count = await mongoose.model('Donation').countDocuments();
    this.receiptNumber = `HOD-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Donation', donationSchema);
