const express = require('express');

function buildApp() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret';
  const app = express();
  app.use(express.json());
  // mount routes like in server.js
  app.use('/api/auth', require('../../backend/src/routes/authRoutes'));
  app.use('/api/employees', require('../../backend/src/routes/employeeRoutes'));
  // minimal not found handler for tests
  app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
  return app;
}

module.exports = { buildApp };
