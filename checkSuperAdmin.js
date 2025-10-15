require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

async function checkSuperAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find super admin
    const superAdmin = await User.findOne({
      email: 'superadmin@hod.com'
    }).select('+password');

    if (!superAdmin) {
      console.log('❌ Super Admin not found!');
      process.exit(1);
    }

    console.log('Super Admin Details:');
    console.log('===================');
    console.log('Email:', superAdmin.email);
    console.log('Username:', superAdmin.username || 'NOT SET');
    console.log('Role:', superAdmin.role);
    console.log('First Name:', superAdmin.firstName);
    console.log('Last Name:', superAdmin.lastName);
    console.log('Has Password:', !!superAdmin.password);
    console.log('Password Length:', superAdmin.password ? superAdmin.password.length : 0);
    console.log('===================\n');

    if (!superAdmin.username) {
      console.log('⚠️  Username is missing! Updating...');
      superAdmin.username = 'SUPERADMIN';
      superAdmin.password = 'superadmin'; // Will be hashed on save
      await superAdmin.save();
      console.log('✅ Super Admin updated with username!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSuperAdmin();
