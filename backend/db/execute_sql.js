// db/execute_sql.js
const fs = require('fs/promises');
const path = require('path');
const { pool, testConnection, dbConfig } = require('./db');

async function executeSqlFile(filePath) {
  const sql = await fs.readFile(filePath, 'utf8');
  const conn = await pool.getConnection();
  try {
    console.log('Executing:', path.basename(filePath));
    await conn.query(sql);
    console.log('OK:', path.basename(filePath));
  } catch (err) {
    console.error('Error executing SQL file:', path.basename(filePath), err.message);
    throw err;
  } finally {
    conn.release();
  }
}

async function setupDatabase() {
  console.log('Attempting connection with user:', dbConfig.user);
  if (!await testConnection()) {
    console.error('Cannot proceed — DB connection failed.');
    process.exit(1);
  }
  try {
    await executeSqlFile(path.join(__dirname, 'sql', 'LMS_schema.sql'));
    await executeSqlFile(path.join(__dirname, 'sql', 'Sample_data_lms.sql'));
    console.log('Database setup completed.');
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  setupDatabase();
}
