// db/hash_password.js
const bcrypt = require('bcrypt');

// All employees now use the same password for easy demo
const password = 'password123';

const employees = [
  { id: 1, email: 'amit.sharma@lms.com', name: 'Amit Sharma' },
  { id: 2, email: 'priya.iyer@lms.com', name: 'Priya Iyer' },
  { id: 3, email: 'rahul.verma@lms.com', name: 'Rahul Verma' },
  { id: 4, email: 'sneha.rao@lms.com', name: 'Sneha Rao' },
  { id: 5, email: 'karan.patel@lms.com', name: 'Karan Patel' },
  { id: 6, email: 'neha.kapoor@lms.com', name: 'Neha Kapoor' },
  { id: 7, email: 'ankit.gupta@lms.com', name: 'Ankit Gupta' },
  { id: 8, email: 'rohit.mehta@lms.com', name: 'Rohit Mehta' },
  { id: 9, email: 'pooja.singh@lms.com', name: 'Pooja Singh' },
  { id: 10, email: 'vikram.reddy@lms.com', name: 'Vikram Reddy' },
  { id: 11, email: 'divya.menon@lms.com', name: 'Divya Menon' },
  { id: 12, email: 'ayesha.khan@lms.com', name: 'Ayesha Khan' },
  { id: 13, email: 'ramesh.yadav@lms.com', name: 'Ramesh Yadav' },
  { id: 14, email: 'siddharth.nair@lms.com', name: 'Siddharth Nair' },
  { id: 15, email: 'meena.joshi@lms.com', name: 'Meena Joshi' },
  { id: 16, email: 'sunita.das@lms.com', name: 'Sunita Das' }
];

async function generateSQL() {
  console.log('-- Updated Employee passwords with bcrypt hashes --');
  console.log('-- All passwords are: password123 --\n');
  
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}\n`);
  
  for (const emp of employees) {
    console.log(`UPDATE Employee SET PasswordHash='${hash}' WHERE EmpID=${emp.id}; -- ${emp.name} (${emp.email})`);
  }
}

generateSQL();
