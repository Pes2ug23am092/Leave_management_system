// backend/src/routes/employeeRoutes.js

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getProfile } = require('../controllers/employeeController');
// 🛑 IMPORT NEW LEAVE CONTROLLER FUNCTIONS 🛑
const { 
    getLeaveBalances, getLeaveRequests, applyLeave, debugEmpLeave, 
    getLeaveTypes, getTeamLeaveRequests, updateLeaveStatus, cancelApprovedLeave 
} = require('../controllers/leaveController'); 
const { getTeamTimeOff, getLeaveActivities, getManagerReports, getTeamLeaveHistory } = require('../controllers/teamController');

const router = express.Router();

// =====================================================
// 🔒 PROTECTED EMPLOYEE ROUTES (Base path is /api/employees)
// =====================================================

// GET /api/employees/profile
router.get('/profile', authMiddleware, getProfile);

// 🛑 NEW DASHBOARD/LEAVE ROUTES 🛑

// GET /api/employees/leave/types (For Leave Application Form)
router.get('/leave/types', authMiddleware, getLeaveTypes);

// GET /api/employees/leave/balances (For Leave Summary Card)
router.get('/leave/balances', authMiddleware, getLeaveBalances); 

// GET /api/employees/leave/requests (For Leave History Table)
router.get('/leave/requests', authMiddleware, getLeaveRequests);

// GET /api/employees/leave/team-requests (For Manager Requests Page)
router.get('/leave/team-requests', authMiddleware, getTeamLeaveRequests);

// Debug route to check authenticated user
router.get('/debug/me', authMiddleware, (req, res) => {
    res.json({ user: req.user, message: 'Authenticated user info' });
});

// Test route without auth
router.get('/test', (req, res) => {
    console.log('🔍 TEST ROUTE HIT - No auth required');
    res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
});

// POST /api/employees/leave/apply (For Leave Application Modal)
router.post('/leave/apply', authMiddleware, applyLeave); 

// GET /api/employees/team/timeoff (For Team Time Off Card)
router.get('/team/timeoff', authMiddleware, getTeamTimeOff);

// GET /api/employees/team/leave-history (For Team Leave History)
router.get('/team/leave-history', authMiddleware, getTeamLeaveHistory);

// GET /api/employees/leave/activities (For Leave Activities Card)
router.get('/leave/activities', authMiddleware, getLeaveActivities);

// GET /api/employees/manager/reports (For Manager Reports Page)
router.get('/manager/reports', authMiddleware, getManagerReports);

// PUT /api/employees/leave/:leaveId/status (For Leave Approval/Rejection)
router.put('/leave/:leaveId/status', authMiddleware, updateLeaveStatus);

// DELETE /api/employees/leave/:leaveId/cancel (For Cancelling Approved Leave)
router.delete('/leave/:leaveId/cancel', authMiddleware, cancelApprovedLeave);

// Dev-only debug route: GET /api/employees/debug/emp_leave/:empId
// NOTE: No auth here for quick local debugging. Remove or protect in production.
router.get('/debug/emp_leave/:empId', debugEmpLeave);

module.exports = router;