const mongoose = require('mongoose');
require('dotenv').config();

async function fixUsernameIndex() {
  try {
    // Connect to MongoDB using environment variable
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List current indexes
    console.log('\n=== Current Indexes ===');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}, unique: ${idx.unique}, sparse: ${idx.sparse}`);
    });

    // Drop the old username index if it exists
    try {
      console.log('\n=== Dropping old username_1 index ===');
      await collection.dropIndex('username_1');
      console.log('✓ Successfully dropped username_1 index');
    } catch (e) {
      if (e.code === 27) {
        console.log('✓ Index username_1 does not exist (already dropped)');
      } else {
        console.log('Error dropping index:', e.message);
      }
    }

    // Create new sparse unique index
    console.log('\n=== Creating new sparse unique index on username ===');
    await collection.createIndex(
      { username: 1 },
      { unique: true, sparse: true, name: 'username_1' }
    );
    console.log('✓ Successfully created sparse unique index on username');

    // List indexes after changes
    console.log('\n=== Updated Indexes ===');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}, unique: ${idx.unique}, sparse: ${idx.sparse}`);
    });

    console.log('\n✓ Index fix completed successfully!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUsernameIndex();
