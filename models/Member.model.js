const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  membershipNumber: {
    type: String,
    unique: true,
    sparse: true
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
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    sparse: true,
    trim: true
  },
  idNo: {
    type: String,
    required: [true, 'ID number is required'],
    unique: true,
    sparse: true,
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

// Generate membership number before saving
memberSchema.pre('save', async function(next) {
  if (!this.membershipNumber && this.isNew) {
    try {
      // Find the highest membership number
      const lastMember = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });

      let nextNumber = 1;
      if (lastMember && lastMember.membershipNumber) {
        // Extract number from format like "HOD-2025-001"
        const match = lastMember.membershipNumber.match(/HOD-\d+-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Format: HOD-YEAR-NUMBER (e.g., HOD-2025-001)
      const year = new Date().getFullYear();
      this.membershipNumber = `HOD-${year}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating membership number:', error);
    }
  }
  next();
});

// Virtual for full name
memberSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
