// src/controllers/authController.js

require('dotenv').config();
const { pool } = require('../../db/db'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logAction } = require('../utils/audit_logger');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Query Employee table
    const [rows] = await pool.query(
      'SELECT EmpID, PasswordHash, Role FROM Employee WHERE LOWER(Email) = LOWER(?)',
      [String(email || '').trim()]
    );

    if (!rows.length) {
      await logAction(null, `Login attempt failed for ${email}`, 0);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Compare password
    const match = await bcrypt.compare(password, user.PasswordHash || '');
    if (!match) {
      await logAction(user.EmpID, 'Login failed', 0);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.EmpID, role: user.Role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logAction(user.EmpID, 'Login', 1);

    // Send response
    res.json({ token, id: user.EmpID, role: user.Role });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login };
