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
      const lastMember = await this.constructor.findOne(
        { membershipNumber: { $exists: true, $ne: null } },
        {},
        { sort: { 'membershipNumber': -1 } }
      );

      let letter = 'A';
      let number = 1;

      if (lastMember && lastMember.membershipNumber) {
        // Extract letter and number from format like "A001"
        const match = lastMember.membershipNumber.match(/^([A-Z])(\d+)$/);
        if (match) {
          letter = match[1];
          number = parseInt(match[2]);

          // Increment number
          number++;

          // If number exceeds 999, move to next letter
          if (number > 999) {
            number = 1;
            // Move to next letter
            if (letter === 'Z') {
              letter = 'A'; // Wrap around or handle as needed
            } else {
              letter = String.fromCharCode(letter.charCodeAt(0) + 1);
            }
          }
        }
      }

      // Format: LETTER + NUMBER (e.g., A001, A002, ..., A999, B001, ...)
      this.membershipNumber = `${letter}${String(number).padStart(3, '0')}`;
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
