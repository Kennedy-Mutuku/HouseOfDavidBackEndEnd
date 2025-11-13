const mongoose = require('mongoose');
require('dotenv').config();

const Donation = require('../models/Donation.model');
const Member = require('../models/Member.model');
const User = require('../models/User.model');

async function checkDonations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Check total donations
    const totalDonations = await Donation.countDocuments();
    console.log(`\n📊 Total Donations: ${totalDonations}`);

    // 2. Get sample donations
    const sampleDonations = await Donation.find()
      .limit(5)
      .populate('donor', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    console.log('\n📄 Sample Donations:');
    sampleDonations.forEach((donation, index) => {
      console.log(`\n--- Donation ${index + 1} ---`);
      console.log('Donation ID:', donation._id);
      console.log('Amount:', donation.amount);
      console.log('Type:', donation.donationType);
      console.log('Status:', donation.status);
      console.log('Donor ID:', donation.donor);
      console.log('Donor Info:', donation.donor?.firstName || 'Not populated');
      console.log('CreatedBy ID:', donation.createdBy);
      console.log('CreatedBy Info:', donation.createdBy?.firstName || 'Not populated');
    });

    // 3. Check for donor IDs that don't match Members
    console.log('\n🔍 Checking donor field integrity...');
    const allDonations = await Donation.find();
    let invalidDonorCount = 0;

    for (const donation of allDonations) {
      const memberExists = await Member.findById(donation.donor);
      if (!memberExists) {
        invalidDonorCount++;
        // Check if it's actually a User ID
        const userExists = await User.findById(donation.donor);
        if (userExists) {
          console.log(`⚠️  Donation ${donation._id} has User ID in donor field: ${donation.donor}`);
          console.log(`   User: ${userExists.email}`);
        } else {
          console.log(`❌ Donation ${donation._id} has invalid donor ID: ${donation.donor}`);
        }
      }
    }

    console.log(`\n📈 Donor Field Analysis:`);
    console.log(`   Valid donor references: ${allDonations.length - invalidDonorCount}`);
    console.log(`   Invalid donor references: ${invalidDonorCount}`);

    // 4. Check User-Member relationships
    console.log('\n👥 Checking User-Member relationships...');
    const allUsers = await User.find();
    let usersWithoutMembers = 0;

    for (const user of allUsers) {
      const member = await Member.findOne({ email: user.email });
      if (!member) {
        usersWithoutMembers++;
        console.log(`⚠️  User without Member profile: ${user.email} (User ID: ${user._id})`);
      }
    }

    console.log(`\n📊 User-Member Sync:`);
    console.log(`   Total users: ${allUsers.length}`);
    console.log(`   Users without Member profiles: ${usersWithoutMembers}`);

    // 5. Check for specific user (if provided as command line arg)
    const testEmail = process.argv[2];
    if (testEmail) {
      console.log(`\n🔎 Checking specific user: ${testEmail}`);

      const user = await User.findOne({ email: testEmail });
      if (!user) {
        console.log('❌ User not found');
      } else {
        console.log('✅ User found');
        console.log('   User ID:', user._id);
        console.log('   Email:', user.email);

        const member = await Member.findOne({ email: testEmail });
        if (!member) {
          console.log('❌ Member profile not found');
        } else {
          console.log('✅ Member found');
          console.log('   Member ID:', member._id);

          // Check donations
          const donationsByCreatedBy = await Donation.find({ createdBy: user._id });
          const donationsByDonor = await Donation.find({ donor: member._id });

          console.log(`\n   Donations by createdBy (User ID): ${donationsByCreatedBy.length}`);
          console.log(`   Donations by donor (Member ID): ${donationsByDonor.length}`);

          if (donationsByCreatedBy.length > 0 || donationsByDonor.length > 0) {
            const allUserDonations = [...donationsByCreatedBy, ...donationsByDonor];
            const uniqueDonations = [...new Set(allUserDonations.map(d => d._id.toString()))]
              .map(id => allUserDonations.find(d => d._id.toString() === id));

            console.log(`   Total unique donations: ${uniqueDonations.length}`);

            const completedDonations = uniqueDonations.filter(d => d.status === 'Completed');
            const totalAmount = completedDonations.reduce((sum, d) => sum + d.amount, 0);

            console.log(`   Completed donations: ${completedDonations.length}`);
            console.log(`   Total amount: KSH ${totalAmount.toLocaleString()}`);
          }
        }
      }
    }

    console.log('\n✅ Diagnostic check complete!');
    console.log('\n💡 To check a specific user, run:');
    console.log('   node checkDonations.js user@example.com');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

checkDonations();
