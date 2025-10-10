const mongoose = require('mongoose');

const devotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  scripture: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Daily', 'Weekly', 'Special'],
    default: 'Daily'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Devotion', devotionSchema);
