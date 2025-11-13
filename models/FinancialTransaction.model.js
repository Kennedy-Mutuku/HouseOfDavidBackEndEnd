const mongoose = require('mongoose');

const financialTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Income', 'Expense'],
    required: [true, 'Transaction type is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(value) {
        // Date should not be in the future
        return value <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  receiptUrl: {
    type: String,
    trim: true
  },
  receiptFileName: {
    type: String,
    trim: true
  },
  receiptOriginalName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'Cancelled'],
    default: 'Completed'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recorded by user is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
financialTransactionSchema.index({ type: 1, date: -1 });
financialTransactionSchema.index({ category: 1 });
financialTransactionSchema.index({ recordedBy: 1 });

// Virtual for formatted amount
financialTransactionSchema.virtual('formattedAmount').get(function() {
  return `KSH ${this.amount.toLocaleString()}`;
});

// Method to get receipt file path
financialTransactionSchema.methods.getReceiptPath = function() {
  if (this.receiptFileName) {
    return `/uploads/receipts/${this.receiptFileName}`;
  }
  return null;
};

module.exports = mongoose.model('FinancialTransaction', financialTransactionSchema);
