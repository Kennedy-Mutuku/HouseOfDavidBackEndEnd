require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const users = await User.find({}).select('+password');

    console.log('\n📋 Users in database:');
    console.log('='.repeat(50));

    for (const user of users) {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Username: ${user.username || 'N/A'}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Role: ${JSON.stringify(user.role)}`);
      console.log(`Has Password: ${!!user.password}`);
      console.log(`Password Hash: ${user.password?.substring(0, 20)}...`);
      console.log(`Active: ${user.isActive}`);
      console.log('-'.repeat(50));
    }

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUsers();
