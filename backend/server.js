// server.js
require('dotenv').config(); // Must be first
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { testConnection } = require('./db/db'); // Make sure this path is correct

// Routes
const authRoutes = require('./src/routes/authRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const holidayRoutes = require('./src/routes/holidayRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const leaveCancellationRoutes = require('./src/routes/leaveCancellationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// 🔐 SECURITY & MIDDLEWARE
// ===============================
app.use(helmet());

// ✅ CORS — allow frontend + handle preflight automatically
app.use(cors({
  origin: [
    "http://localhost:5173", // Vite
    "http://127.0.0.1:5173",
    "http://localhost:3000",  // React default port
    "http://localhost:3001"   // React alternate port
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Parse JSON body
app.use(express.json());

// ✅ Request logger middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ===============================
// 🚀 ROUTES (CRITICAL FIX: ADDING /api PREFIX)
// ===============================
app.get('/', (req, res) => {
  res.json({ message: "✅ Auth server is running!" });
});

// 🛑 FIX: ALL API ROUTES SHOULD BE MOUNTED UNDER /api 🛑
app.use('/api/auth', authRoutes);         // Fixes: POST /api/auth/login
app.use('/api/employees', employeeRoutes); // Fixes: GET /api/employees/...
app.use('/api/holidays', holidayRoutes);   // Handles: GET /api/holidays/upcoming
app.use('/api/admin', adminRoutes);        // Handles: GET /api/admin/...
app.use('/api/leave-cancellation', leaveCancellationRoutes); // Handles: POST /api/leave-cancellation/request

// ===============================
// ⚠️ 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ===============================
// ⚠️ GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ===============================
// 🟢 START SERVER
// ===============================
async function start() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    if (process.env.SKIP_DB_CHECK === '1' || process.env.ALLOW_START_WITHOUT_DB === '1') {
      console.warn('⚠️ Database connection failed, but continuing to start server due to SKIP_DB_CHECK flag.');
    } else {
      console.error('❌ Database connection failed. Exiting...');
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

start();