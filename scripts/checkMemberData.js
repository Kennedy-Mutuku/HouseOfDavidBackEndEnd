const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/house_of_david';

async function checkMembers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const membersCollection = db.collection('members');

    const members = await membersCollection.find({}).toArray();

    console.log(`Found ${members.length} member(s) in database:\n`);

    members.forEach((member, index) => {
      console.log(`--- Member ${index + 1} ---`);
      console.log('Name:', member.firstName, member.lastName);
      console.log('Email:', member.email);
      console.log('Phone:', member.phone);
      console.log('ID Number (idNo):', member.idNo);
      console.log('Membership Number:', member.membershipNumber);
      console.log('Date of Birth:', member.dateOfBirth);
      console.log('Membership Date:', member.membershipDate);
      console.log('Created At:', member.createdAt);
      console.log('All fields:', Object.keys(member));
      console.log('');
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkMembers();
