const mongoose = require('mongoose');
const User = require('./models/User.model');
require('dotenv').config();

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/house-of-david');
    console.log('✅ MongoDB Connected');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'mutukukennedy5@gmail.com' });

    if (existingUser) {
      console.log('ℹ️  User already exists');
      console.log('Email:', existingUser.email);
      console.log('ID Number:', existingUser.idNumber);
      process.exit(0);
    }

    // Create user with email and ID number
    const user = await User.create({
      firstName: 'Kennedy',
      lastName: 'Mutuku',
      email: 'mutukukennedy5@gmail.com',
      username: '41113805', // Using ID number as username too
      idNumber: '41113805',
      password: '41113805', // ID number is used as password
      role: ['user'],
      phone: '0712345678',
      isActive: true
    });

    console.log('✅ User created successfully!');
    console.log('\n📋 User Credentials:');
    console.log('='.repeat(50));
    console.log('Email:', user.email);
    console.log('Password/ID Number:', '41113805');
    console.log('='.repeat(50));
    console.log('\nYou can now login with:');
    console.log('  Email: mutukukennedy5@gmail.com');
    console.log('  Password: 41113805');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUser();
