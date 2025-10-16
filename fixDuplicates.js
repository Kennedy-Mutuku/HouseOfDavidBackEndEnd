const mongoose = require('mongoose');
const Member = require('./models/Member.model');
const User = require('./models/User.model');
require('dotenv').config();

const fixDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/house-of-david');
    console.log('✅ MongoDB Connected\n');

    // Find all members
    const members = await Member.find();
    console.log(`Found ${members.length} members\n`);

    // Group by email and ID
    const emailMap = {};
    const idMap = {};
    const phoneMap = {};

    members.forEach(member => {
      const email = member.email.toLowerCase();
      const idNo = member.idNo;
      const phone = member.phone;

      if (!emailMap[email]) emailMap[email] = [];
      emailMap[email].push(member);

      if (!idMap[idNo]) idMap[idNo] = [];
      idMap[idNo].push(member);

      if (!phoneMap[phone]) phoneMap[phone] = [];
      phoneMap[phone].push(member);
    });

    // Find duplicates
    const duplicateEmails = Object.keys(emailMap).filter(email => emailMap[email].length > 1);
    const duplicateIds = Object.keys(idMap).filter(id => idMap[id].length > 1);
    const duplicatePhones = Object.keys(phoneMap).filter(phone => phoneMap[phone].length > 1);

    console.log('🔍 Duplicates found:');
    console.log(`   Duplicate emails: ${duplicateEmails.length}`);
    console.log(`   Duplicate IDs: ${duplicateIds.length}`);
    console.log(`   Duplicate phones: ${duplicatePhones.length}\n`);

    // Delete all duplicates except the first one
    for (const email of duplicateEmails) {
      const dupes = emailMap[email];
      console.log(`Deleting ${dupes.length - 1} duplicate(s) for email: ${email}`);
      for (let i = 1; i < dupes.length; i++) {
        await Member.findByIdAndDelete(dupes[i]._id);
        console.log(`   ✅ Deleted member: ${dupes[i].firstName} ${dupes[i].lastName}`);
      }
    }

    // Get remaining members
    const remainingMembers = await Member.find();
    console.log(`\n📋 Remaining members: ${remainingMembers.length}\n`);

    // Create User accounts for all members who don't have one
    for (const member of remainingMembers) {
      const existingUser = await User.findOne({ email: member.email.toLowerCase() });

      if (!existingUser) {
        console.log(`Creating user account for: ${member.firstName} ${member.lastName}`);
        try {
          await User.create({
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email.toLowerCase(),
            username: member.idNo,
            idNumber: member.idNo,
            password: member.idNo,
            role: ['user'],
            phone: member.phone,
            isActive: true
          });
          console.log(`   ✅ User account created`);
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`User account already exists for: ${member.email}`);
      }
    }

    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixDuplicates();
