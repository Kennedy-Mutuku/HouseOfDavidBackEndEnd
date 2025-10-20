require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

async function fixUserRole() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users and their roles
    const users = await User.find({}).select('firstName lastName email username role');

    console.log('\n=================================');
    console.log('Current Users in Database:');
    console.log('=================================');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   Role: ${JSON.stringify(user.role)}`);
      console.log(`   ID: ${user._id}`);
    });

    // Prompt for which user to update
    console.log('\n=================================');
    console.log('Updating user "ken" to superadmin...');
    console.log('=================================');

    // Find user by email or username "ken"
    const userToUpdate = await User.findOne({
      $or: [
        { email: /ken/i },
        { username: /ken/i },
        { firstName: /ken/i }
      ]
    });

    if (!userToUpdate) {
      console.log('❌ User "ken" not found!');
      console.log('\nPlease provide the email or username of the user you want to update:');
      console.log('You can manually run this in MongoDB:');
      console.log('db.users.updateOne({ email: "YOUR_EMAIL" }, { $set: { role: ["superadmin"] } })');
      process.exit(1);
    }

    console.log(`\nFound user: ${userToUpdate.firstName} ${userToUpdate.lastName}`);
    console.log(`Email: ${userToUpdate.email}`);
    console.log(`Current role: ${JSON.stringify(userToUpdate.role)}`);

    // Update role to superadmin
    userToUpdate.role = ['superadmin'];
    await userToUpdate.save();

    console.log(`\n✅ User role updated successfully!`);
    console.log(`New role: ${JSON.stringify(userToUpdate.role)}`);
    console.log('\nPlease log out and log back in for changes to take effect.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixUserRole();
