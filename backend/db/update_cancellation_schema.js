// db/update_cancellation_schema.js
const fs = require('fs/promises');
const path = require('path');
const { pool, testConnection, dbConfig } = require('./db');

async function updateCancellationSchema() {
  console.log('Attempting connection with user:', dbConfig.user);
  if (!await testConnection()) {
    console.error('Cannot proceed — DB connection failed.');
    process.exit(1);
  }

  const conn = await pool.getConnection();
  try {
    console.log('🔄 Updating database schema for leave cancellation...');
    
    const sql = await fs.readFile(path.join(__dirname, 'sql', 'leave_cancellation_schema.sql'), 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await conn.query(statement);
          console.log('✅ Executed statement successfully');
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('Duplicate column')) {
            console.log('⚠️ Schema already up to date:', err.message);
          } else {
            throw err;
          }
        }
      }
    }
    
    console.log('✅ Leave cancellation schema update completed');
  } catch (err) {
    console.error('❌ Schema update failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

updateCancellationSchema();