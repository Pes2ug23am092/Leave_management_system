// src/controllers/employeeController.js

const { pool } = require('../../db/db');

// Get profile by ID
async function getProfile(req, res) {
  try {
    const userId = req.user.id; // Assuming you set req.user in your auth middleware

    const [rows] = await pool.query(
      `SELECT 
         EmpID AS id,
         FirstName AS first_name,
         LastName AS last_name,
         Email AS email,
         Role AS role,
         Designation AS designation,
         DOB AS dob,
         Gender AS gender,
         ManagerID AS manager_id
       FROM Employee
       WHERE EmpID = ?`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error fetching profile:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getProfile };
