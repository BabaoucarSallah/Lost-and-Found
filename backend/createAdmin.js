const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost/lost-and-found',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Username:', existingAdmin.username);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@reuniteit.com',
      password_hash: 'Admin123!',
      role: 'admin',
      contact_info: '+1234567890',
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@reuniteit.com');
    console.log('Password: Admin123!');
    console.log('Role: admin');
  } catch (error) {
    console.error('Error creating admin user:', error);

    if (error.code === 11000) {
      console.log('User with this email or username already exists');

      // Try to find the existing user and update their role
      try {
        const existingUser = await User.findOne({
          $or: [{ email: 'admin@reuniteit.com' }, { username: 'admin' }],
        });

        if (existingUser) {
          existingUser.role = 'admin';
          await existingUser.save();
          console.log('Updated existing user to admin role');
          console.log('Email:', existingUser.email);
          console.log('Username:', existingUser.username);
        }
      } catch (updateError) {
        console.error('Error updating user role:', updateError);
      }
    }
  } finally {
    mongoose.connection.close();
  }
};

createAdminUser();
