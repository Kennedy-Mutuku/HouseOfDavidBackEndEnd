require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const testCredentials = [
      { username: 'ADMIN', password: 'ADMIN' },
      { username: 'SUPERADMIN', password: 'SUPERADMIN' },
      { username: 'USER', password: 'USER' }
    ];

    for (const cred of testCredentials) {
      console.log(`Testing: ${cred.username} / ${cred.password}`);

      const user = await User.findOne({ username: cred.username.toUpperCase() }).select('+password');

      if (!user) {
        console.log(`❌ User not found: ${cred.username}\n`);
        continue;
      }

      const isMatch = await user.comparePassword(cred.password);

      if (isMatch) {
        console.log(`✅ LOGIN SUCCESS for ${cred.username}`);
      } else {
        console.log(`❌ LOGIN FAILED for ${cred.username} - Incorrect password`);
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testLogin();
