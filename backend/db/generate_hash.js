const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('\nPassword:', password);
    console.log('Hash:', hash);
    console.log('\nSQL UPDATE command:');
    console.log(`UPDATE Employee SET PasswordHash = '${hash}' WHERE Email = 'ankit.gupta@lms.com';`);
}

generateHash();