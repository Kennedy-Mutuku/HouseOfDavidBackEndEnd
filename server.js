require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const memberRoutes = require('./routes/member.routes');
const eventRoutes = require('./routes/event.routes');
const donationRoutes = require('./routes/donation.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const inGatheringRoutes = require('./routes/ingathering.routes');
const contentRoutes = require('./routes/content.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const contactRoutes = require('./routes/contact.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ingathering', inGatheringRoutes);
app.use('/api', contentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/contact-requests', contactRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to House of David API',
    status: 'running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});
