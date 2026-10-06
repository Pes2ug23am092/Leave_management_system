const express = require('express');
const { body } = require('express-validator');
const { login } = require('../controllers/authController');

const router = express.Router();

// =====================================================
// 🔐 LOGIN ROUTE
// POST /auth/login
// =====================================================
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 4 })
      .withMessage('Password must be at least 4 characters long'),
  ],
  login
);

module.exports = router;
