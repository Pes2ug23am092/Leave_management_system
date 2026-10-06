// db.js
require('dotenv').config(); // Must be first

const mysql = require('mysql2/promise');

// Database configuration using environment variables
const dbConfig = {
  host: process.env.DB_HOST,                      // e.g., 'localhost'
  user: process.env.DB_USER,                      // e.g., 'root'
  password: process.env.DB_PASS,                  // e.g., 'HIprepra1515'
  database: process.env.DB_NAME,                  // e.g., 'lms'
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test the DB connection
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ DB connection OK');
    return true;
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    return false;
  }
}

// Simple query wrapper
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Export everything
module.exports = { pool, testConnection, dbConfig, query };
