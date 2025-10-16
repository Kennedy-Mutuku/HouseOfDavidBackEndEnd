const mongoose = require('mongoose');
const User = require('./models/User.model');
require('dotenv').config();

const createAdminUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/house-of-david');
    console.log('✅ MongoDB Connected');

    // Delete existing admin users with these emails
    await User.deleteMany({
      email: { $in: ['admin@admissionadmin.hod.com', 'admin@superadmin.hod.com'] }
    });
    console.log('🗑️  Removed old admin users');

    // Create Admission Admin
    const admissionAdmin = await User.create({
      firstName: 'Admission',
      lastName: 'Admin',
      email: 'admin@admissionadmin.hod.com',
      username: 'ADMISSIONADMIN',
      password: 'houseofdavid',
      role: ['admin'],
      phone: '0700000001',
      isActive: true
    });
    console.log('✅ Created Admission Admin:', admissionAdmin.email);

    // Create Super Admin
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@superadmin.hod.com',
      username: 'SUPERADMIN2',
      password: 'houseofdavid',
      role: ['superadmin'],
      phone: '0700000002',
      isActive: true
    });
    console.log('✅ Created Super Admin:', superAdmin.email);

    console.log('\n📋 Admin Credentials:');
    console.log('='.repeat(50));
    console.log('Admission Admin:');
    console.log('  Email: admin@admissionadmin.hod.com');
    console.log('  Password: houseofdavid');
    console.log('');
    console.log('Super Admin:');
    console.log('  Email: admin@superadmin.hod.com');
    console.log('  Password: houseofdavid');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdminUsers();
