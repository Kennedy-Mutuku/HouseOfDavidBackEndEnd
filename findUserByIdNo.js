const mongoose = require('mongoose');
const User = require('./models/User.model');
require('dotenv').config();

const findUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/house-of-david');
    console.log('✅ MongoDB Connected\n');

    const user = await User.findOne({ idNumber: '41113805' });

    if (user) {
      console.log('✅ User found with ID Number: 41113805');
      console.log('='.repeat(50));
      console.log('Email:', user.email);
      console.log('Name:', user.fullName);
      console.log('Username:', user.username);
      console.log('ID Number:', user.idNumber);
      console.log('Role:', user.role);
      console.log('='.repeat(50));
      console.log('\nLogin with:');
      console.log('  Email:', user.email);
      console.log('  Password: 41113805 (ID Number)');
    } else {
      console.log('❌ No user found with ID Number: 41113805');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

findUser();
