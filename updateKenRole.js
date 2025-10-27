require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

async function updateKenRole() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find and update the other Kennedy account
    const user = await User.findOne({ email: 'mutukukennedy53@gmail.com' });

    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log(`Found user: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Current role: ${JSON.stringify(user.role)}`);

    // Update role to superadmin
    user.role = ['superadmin'];
    await user.save();

    console.log(`\n✅ User role updated successfully!`);
    console.log(`New role: ${JSON.stringify(user.role)}`);
    console.log('\nPlease log out and log back in for changes to take effect.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

updateKenRole();
