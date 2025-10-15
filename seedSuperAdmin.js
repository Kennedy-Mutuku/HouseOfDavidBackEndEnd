require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

async function seedSuperAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      email: 'superadmin@hod.com'
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists!');
      console.log('Email: superadmin@hod.com');
      console.log('Username: SUPERADMIN');
      console.log('Password: superadmin');
      process.exit(0);
    }

    // Create Super Admin
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@hod.com',
      username: 'SUPERADMIN',
      password: 'superadmin',
      phone: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      role: ['superadmin'],
      peopleGroup: '',
      growthGroup: '',
      isActive: true
    });

    console.log('✅ Super Admin created successfully!');
    console.log('');
    console.log('=================================');
    console.log('Super Admin Login Credentials:');
    console.log('=================================');
    console.log('Email: superadmin@hod.com');
    console.log('Username: SUPERADMIN');
    console.log('Password: superadmin');
    console.log('=================================');
    console.log('');
    console.log('You can now login using:');
    console.log('- Admin Login tab');
    console.log('- Username: SUPERADMIN');
    console.log('- Password: superadmin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedSuperAdmin();
