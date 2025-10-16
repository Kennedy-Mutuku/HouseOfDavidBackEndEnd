const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/house_of_david';

async function deleteMembers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const membersCollection = db.collection('members');
    const usersCollection = db.collection('users');

    // Get all members first
    const members = await membersCollection.find({}).toArray();
    console.log(`Found ${members.length} member(s) to delete:\n`);

    members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.firstName} ${member.lastName} - ${member.email}`);
    });

    // Delete all members
    const memberResult = await membersCollection.deleteMany({});
    console.log(`\n✓ Deleted ${memberResult.deletedCount} member(s) from members collection`);

    // Delete all non-admin users (keep admin accounts)
    const userResult = await usersCollection.deleteMany({
      role: { $nin: ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'] }
    });
    console.log(`✓ Deleted ${userResult.deletedCount} user(s) from users collection`);

    console.log('\n✅ Successfully deleted all members and their user accounts!');
    console.log('Admin accounts were preserved.');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

deleteMembers();
