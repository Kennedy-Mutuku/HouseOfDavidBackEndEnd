require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

const testPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const user = await User.findOne({ username: 'SUPERADMIN' }).select('+password');

    if (!user) {
      console.log('❌ SUPERADMIN not found');
      process.exit(1);
    }

    console.log('Testing password: "superadmin" (lowercase)');
    const match1 = await user.comparePassword('superadmin');
    console.log('Result:', match1 ? '✅ MATCH' : '❌ NO MATCH');

    console.log('\nTesting password: "SUPERADMIN" (uppercase)');
    const match2 = await user.comparePassword('SUPERADMIN');
    console.log('Result:', match2 ? '✅ MATCH' : '❌ NO MATCH');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testPassword();
