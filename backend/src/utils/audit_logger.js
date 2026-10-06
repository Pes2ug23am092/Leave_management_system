const { pool } = require('../../db/db');

// Logs any action taken by an employee or admin
async function logAction(empId, action, status = 1) {
  try {
    const sql = 'INSERT INTO auditlog (EmpID, Action, Action_status) VALUES (?, ?, ?)';
    await pool.query(sql, [empId || null, action, status ? 1 : 0]);
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAction };

// something about audit logging is not working check properly
