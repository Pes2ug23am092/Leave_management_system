// Fix all user passwords
require('dotenv').config();
const { pool } = require('./db/db');
const bcrypt = require('bcrypt');

async function fixPasswords() {
  try {
    console.log('🔧 Fixing all user passwords to "password123"...\n');

    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Generated hash:', hash);
    console.log('');

    // Update all employee passwords
    const [result] = await pool.query(
      'UPDATE Employee SET PasswordHash = ?',
      [hash]
    );

    console.log(`✅ Updated ${result.affectedRows} employee passwords`);
    console.log('');
    console.log('🎉 All users can now login with password: password123');
    console.log('');
    console.log('Test with any of these emails:');
    console.log('  - amit.sharma@lms.com (Admin/CEO)');
    console.log('  - priya.iyer@lms.com (Engineering Manager)');
    console.log('  - rahul.verma@lms.com (HR Manager)');
    console.log('  - sneha.rao@lms.com (Finance Manager)');
    console.log('  - karan.patel@lms.com (Employee)');
    console.log('  - neha.kapoor@lms.com (Employee)');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPasswords();
