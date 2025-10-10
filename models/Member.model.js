const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  membershipDate: {
    type: Date,
    default: Date.now
  },
  membershipStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active'
  },
  department: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    trim: true
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed'],
    default: 'Single'
  },
  occupation: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  notes: {
    type: String,
    trim: true
  },
  profileImage: {
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

// Virtual for full name
memberSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
