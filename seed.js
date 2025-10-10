require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create users
    const users = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@hod.com',
        password: 'password',
        role: 'superadmin',
        phone: '+1234567890',
        isActive: true
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hod.com',
        password: 'password',
        role: 'admin',
        phone: '+1234567891',
        isActive: true
      },
      {
        firstName: 'Regular',
        lastName: 'User',
        email: 'user@hod.com',
        password: 'password',
        role: 'user',
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
    console.log('Super Admin: superadmin@hod.com / password');
    console.log('Admin: admin@hod.com / password');
    console.log('User: user@hod.com / password');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers();
