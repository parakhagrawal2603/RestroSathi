const SuperAdmin = require('../modules/user/superAdmin.model');
const bcrypt = require('bcryptjs');

/**
 * Initializes the Super Admin account from environment variables if it doesn't exist.
 */
const initSuperAdmin = async () => {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env. Skipping auto-initialization.');
      return;
    }

    const existingAdmin = await SuperAdmin.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log('🚀 Initializing Super Admin...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await SuperAdmin.create({
        email: adminEmail,
        password: hashedPassword
      });

      console.log('✅ Super Admin initialized successfully.');
    } else {
      console.log('ℹ️  Super Admin already exists.');
    }
  } catch (error) {
    console.error('❌ Error initializing Super Admin:', error.message);
  }
};

module.exports = initSuperAdmin;
