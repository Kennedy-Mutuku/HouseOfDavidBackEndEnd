require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');
const bcrypt = require('bcryptjs');

async function debugLogin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find super admin
    const superAdmin = await User.findOne({
      username: 'SUPERADMIN'
    }).select('+password');

    if (!superAdmin) {
      console.log('❌ Super Admin not found by username!');

      // Try by email
      const byEmail = await User.findOne({ email: 'superadmin@hod.com' }).select('+password');
      if (byEmail) {
        console.log('✅ Found by email!');
        console.log('Username:', byEmail.username);
        console.log('Email:', byEmail.email);
      }
      process.exit(1);
    }

    console.log('Super Admin Found:');
    console.log('==================');
    console.log('Email:', superAdmin.email);
    console.log('Username:', superAdmin.username);
    console.log('Role:', superAdmin.role);
    console.log('Has Password:', !!superAdmin.password);
    console.log('Password Hash:', superAdmin.password.substring(0, 20) + '...');
    console.log('');

    // Test password comparison
    const testPassword = 'superadmin';
    console.log('Testing password comparison with:', testPassword);

    const isMatch = await bcrypt.compare(testPassword, superAdmin.password);
    console.log('Password Match Result:', isMatch);
    console.log('');

    if (!isMatch) {
      console.log('❌ Password does not match!');
      console.log('This means the password in database is NOT "superadmin"');
      console.log('');
      console.log('FIXING: Setting password to "superadmin" and saving...');

      superAdmin.password = testPassword;
      await superAdmin.save();

      console.log('✅ Password updated successfully!');
      console.log('');
      console.log('Verifying new password...');

      const updatedAdmin = await User.findOne({ username: 'SUPERADMIN' }).select('+password');
      const newMatch = await bcrypt.compare(testPassword, updatedAdmin.password);
      console.log('New Password Match Result:', newMatch);

      if (newMatch) {
        console.log('✅ Password is now correct! Try logging in again.');
      }
    } else {
      console.log('✅ Password is correct!');
      console.log('The issue must be in the login endpoint logic.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugLogin();
