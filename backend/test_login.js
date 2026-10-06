// Test login credentials
require('dotenv').config();
const { pool } = require('./db/db');
const bcrypt = require('bcrypt');

async function testLogin() {
  try {
    const email = 'priya.iyer@lms.com';
    const password = 'password123';

    console.log('🔍 Testing login for:', email);
    console.log('🔑 Password:', password);
    console.log('');

    // Query the database
    const [rows] = await pool.query(
      'SELECT EmpID, FirstName, LastName, Email, PasswordHash, Role FROM Employee WHERE Email = ?',
      [email]
    );

    if (!rows.length) {
      console.log('❌ User not found in database');
      process.exit(1);
    }

    const user = rows[0];
    console.log('✅ User found:');
    console.log('   EmpID:', user.EmpID);
    console.log('   Name:', user.FirstName, user.LastName);
    console.log('   Email:', user.Email);
    console.log('   Role:', user.Role);
    console.log('   Password Hash:', user.PasswordHash);
    console.log('');

    // Test password comparison
    console.log('🔐 Testing password...');
    const match = await bcrypt.compare(password, user.PasswordHash);
    
    if (match) {
      console.log('✅ Password MATCHES! Login should work.');
    } else {
      console.log('❌ Password DOES NOT MATCH!');
      console.log('');
      console.log('🔧 Generating new hash for testing...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('   New hash:', newHash);
      console.log('');
      console.log('💡 To fix, run this SQL:');
      console.log(`   UPDATE Employee SET PasswordHash = '${newHash}' WHERE Email = '${email}';`);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLogin();
