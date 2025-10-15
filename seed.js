require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB Connected');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create users
    const users = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        username: 'SUPERADMIN',
        email: 'superadmin@hod.com',
        password: 'SUPERADMIN',
        role: ['superadmin'],
        phone: '+1234567890',
        isActive: true
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        username: 'ADMIN',
        email: 'admin@hod.com',
        password: 'ADMIN',
        role: ['admin'],
        phone: '+1234567891',
        isActive: true
      },
      {
        firstName: 'Regular',
        lastName: 'User',
        username: 'USER',
        email: 'user@hod.com',
        password: 'USER',
        role: ['user'],
        phone: '+1234567892',
        isActive: true
      }
    ];

    for (const userData of users) {
      const user = await User.create(userData);
      console.log(`✅ Created ${user.role}: ${user.email}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Super Admin: SUPERADMIN / SUPERADMIN');
    console.log('Admin: ADMIN / ADMIN');
    console.log('User: USER / USER');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers();
