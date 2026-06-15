require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

async function createAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const name = process.env.ADMIN_NAME || 'Admin User';
    const password = process.env.ADMIN_PASSWORD;

    const exists = await User.findOne({ email });
    if (exists) {
      console.log(`⚠️  Admin already exists: ${email}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin created successfully!');
    console.log(`   Name:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();