// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// ===============================
// 🛡️ ADMIN AUTHENTICATION MIDDLEWARE
// ===============================

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// ===============================
// 📊 ADMIN DASHBOARD ROUTES
// ===============================

// GET /api/admin/metrics - Admin dashboard metrics
router.get('/metrics', authMiddleware, adminOnly, adminController.getAdminMetrics);

// GET /api/admin/stats - System statistics
router.get('/stats', authMiddleware, adminOnly, adminController.getSystemStats);

// ===============================
// 👥 EMPLOYEE MANAGEMENT ROUTES
// ===============================

// GET /api/admin/employees - Get all employees
router.get('/employees', authMiddleware, adminOnly, adminController.getAllEmployees);

// POST /api/admin/employees - Create new employee
router.post('/employees', authMiddleware, adminOnly, adminController.createEmployee);

// PUT /api/admin/employees/:empId - Update employee
router.put('/employees/:empId', authMiddleware, adminOnly, adminController.updateEmployee);

// DELETE /api/admin/employees/:empId - Delete employee
router.delete('/employees/:empId', authMiddleware, adminOnly, adminController.deleteEmployee);

// ===============================
// 📋 LEAVE TYPE MANAGEMENT ROUTES
// ===============================

// GET /api/admin/leave-types - Get all leave types
router.get('/leave-types', authMiddleware, adminOnly, adminController.getAllLeaveTypes);

// POST /api/admin/leave-types - Create new leave type
router.post('/leave-types', authMiddleware, adminOnly, adminController.createLeaveType);

// PUT /api/admin/leave-types/:leaveTypeId - Update leave type
router.put('/leave-types/:leaveTypeId', authMiddleware, adminOnly, adminController.updateLeaveType);

// DELETE /api/admin/leave-types/:leaveTypeId - Delete leave type
router.delete('/leave-types/:leaveTypeId', authMiddleware, adminOnly, adminController.deleteLeaveType);

// ===============================
// 🗓️ HOLIDAY MANAGEMENT ROUTES
// ===============================

// GET /api/admin/holidays - Get all holidays for a year
router.get('/holidays', authMiddleware, adminOnly, adminController.getAllHolidays);

// POST /api/admin/holidays - Create new holiday
router.post('/holidays', authMiddleware, adminOnly, adminController.createHoliday);

// PUT /api/admin/holidays/:holidayId - Update holiday
router.put('/holidays/:holidayId', authMiddleware, adminOnly, adminController.updateHoliday);

// DELETE /api/admin/holidays/:holidayId - Delete holiday
router.delete('/holidays/:holidayId', authMiddleware, adminOnly, adminController.deleteHoliday);

module.exports = router;