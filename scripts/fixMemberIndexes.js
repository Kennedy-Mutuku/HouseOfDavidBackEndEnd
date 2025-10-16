const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/house_of_david';

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const membersCollection = db.collection('members');

    console.log('\nChecking existing indexes...');
    const indexes = await membersCollection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the idNo_1 index if it exists (non-sparse)
    try {
      console.log('\nDropping old idNo_1 index...');
      await membersCollection.dropIndex('idNo_1');
      console.log('✓ Dropped idNo_1 index');
    } catch (error) {
      console.log('Note: idNo_1 index may not exist:', error.message);
    }

    // Drop the phone_1 index if it exists (non-sparse)
    try {
      console.log('\nDropping old phone_1 index...');
      await membersCollection.dropIndex('phone_1');
      console.log('✓ Dropped phone_1 index');
    } catch (error) {
      console.log('Note: phone_1 index may not exist:', error.message);
    }

    // Create new sparse indexes
    console.log('\nCreating new sparse indexes...');

    await membersCollection.createIndex({ idNo: 1 }, { unique: true, sparse: true });
    console.log('✓ Created sparse unique index on idNo');

    await membersCollection.createIndex({ phone: 1 }, { unique: true, sparse: true });
    console.log('✓ Created sparse unique index on phone');

    console.log('\nVerifying new indexes...');
    const newIndexes = await membersCollection.indexes();
    console.log('Updated indexes:', JSON.stringify(newIndexes, null, 2));

    console.log('\n✓ Successfully fixed all indexes!');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing indexes:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixIndexes();
