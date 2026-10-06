// backend/src/controllers/leaveCancellationController.js
const { pool } = require('../../db/db');
const emailService = require('../services/emailService');

const leaveCancellationController = {
  // Request leave cancellation
  async requestCancellation(req, res) {
    const connection = await pool.getConnection();
    try {
      const { leaveAppId, cancellationReason } = req.body;
      const employeeId = req.user.id;

      console.log(`🔄 Processing cancellation request for leave ${leaveAppId} by employee ${employeeId}`);

      await connection.beginTransaction();

      // Get leave details and verify ownership
      const [leaveResults] = await connection.execute(`
        SELECT ld.*, e.FirstName, e.LastName, e.Email, e.ManagerID,
               lt.LeaveName, m.FirstName as ManagerFirstName, m.LastName as ManagerLastName, m.Email as ManagerEmail
        FROM Leave_details ld
        JOIN Employee e ON ld.EmpID = e.EmpID
        JOIN LeaveType lt ON ld.LeaveTypeID = lt.LeaveTypeID
        LEFT JOIN Employee m ON e.ManagerID = m.EmpID
        WHERE ld.LeaveAppID = ? AND ld.EmpID = ?
      `, [leaveAppId, employeeId]);

      if (leaveResults.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Leave application not found or unauthorized' });
      }

      const leave = leaveResults[0];

      // Check if leave can be cancelled
      if (!['Pending', 'Approved'].includes(leave.Status)) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `Cannot cancel leave with status: ${leave.Status}` 
        });
      }

      // Check if already has a pending cancellation request
      const [existingRequests] = await connection.execute(`
        SELECT id FROM leave_cancellation_requests 
        WHERE leave_request_id = ? AND status = 'Pending'
      `, [leaveAppId]);

      if (existingRequests.length > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'A cancellation request is already pending for this leave' 
        });
      }

      if (leave.Status === 'Pending') {
        // If leave is still pending, cancel it directly
        await connection.execute(`
          UPDATE Leave_details 
          SET Status = 'Cancelled', CancelledDate = NOW() 
          WHERE LeaveAppID = ?
        `, [leaveAppId]);

        // Restore leave balance
        const leaveDays = Math.ceil((new Date(leave.ToDate) - new Date(leave.FromDate)) / (1000 * 60 * 60 * 24)) + 1;
        await connection.execute(`
          UPDATE Emp_leave 
          SET LeaveTaken = LeaveTaken - ?, LeaveBalance = LeaveBalance + ?
          WHERE EmpID = ? AND LeaveTypeID = ? AND Year = YEAR(?)
        `, [leaveDays, leaveDays, employeeId, leave.LeaveTypeID, leave.FromDate]);

        await connection.commit();

        console.log(`✅ Leave ${leaveAppId} cancelled directly (was pending)`);
        res.json({ 
          message: 'Leave cancelled successfully',
          status: 'Cancelled'
        });

      } else if (leave.Status === 'Approved') {
        // If leave is approved, create a cancellation request
        await connection.execute(`
          INSERT INTO leave_cancellation_requests (leave_request_id, employee_id, cancellation_reason)
          VALUES (?, ?, ?)
        `, [leaveAppId, employeeId, cancellationReason]);

        // Update leave status to indicate cancellation is requested
        await connection.execute(`
          UPDATE Leave_details 
          SET Status = 'Cancellation Requested'
          WHERE LeaveAppID = ?
        `, [leaveAppId]);

        await connection.commit();

        // Send email notification to manager
        if (leave.ManagerEmail) {
          const employeeData = {
            firstName: leave.FirstName,
            lastName: leave.LastName,
            email: leave.Email
          };
          const managerData = {
            firstName: leave.ManagerFirstName,
            lastName: leave.ManagerLastName,
            email: leave.ManagerEmail
          };
          const leaveData = {
            leaveType: leave.LeaveName,
            startDate: leave.FromDate,
            endDate: leave.ToDate
          };

          await emailService.notifyLeaveCancellationRequest(
            employeeData, managerData, leaveData, cancellationReason
          );
        }

        console.log(`✅ Cancellation request created for leave ${leaveAppId}`);
        res.json({ 
          message: 'Cancellation request submitted to manager',
          status: 'Cancellation Requested'
        });
      }

    } catch (error) {
      await connection.rollback();
      console.error('❌ Error requesting leave cancellation:', error);
      res.status(500).json({ error: 'Failed to process cancellation request' });
    } finally {
      connection.release();
    }
  },

  // Get cancellation requests for manager
  async getCancellationRequests(req, res) {
    try {
      const managerId = req.user.id;
      const userRole = req.user.role;

      // Check if user has manager permissions
      if (userRole !== 'Manager' && userRole !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Manager role required.' });
      }

      console.log(`🔍 Fetching cancellation requests for manager ${managerId}, role: ${userRole}`);

      const [requests] = await pool.execute(`
        SELECT 
          lcr.*, 
          ld.FromDate, 
          ld.ToDate, 
          ld.Reason as LeaveReason,
          lt.LeaveName, 
          e.FirstName, 
          e.LastName, 
          e.Email,
          CONCAT(e.FirstName, ' ', e.LastName) as employee_name,
          e.Designation as department,
          DATEDIFF(ld.ToDate, ld.FromDate) + 1 as days,
          lt.LeaveName as leave_type,
          ld.FromDate as from_date,
          ld.ToDate as to_date,
          lcr.cancellation_reason as reason,
          lcr.request_date as requested_at
        FROM leave_cancellation_requests lcr
        JOIN Leave_details ld ON lcr.leave_request_id = ld.LeaveAppID
        JOIN Employee e ON lcr.employee_id = e.EmpID
        JOIN LeaveType lt ON ld.LeaveTypeID = lt.LeaveTypeID
        WHERE e.ManagerID = ? AND lcr.status = 'Pending'
        ORDER BY lcr.request_date DESC
      `, [managerId]);

  console.log(`✅ Found ${requests.length} pending cancellation requests`);
  // Return plain array to match frontend expectations
  res.json(requests);

    } catch (error) {
      console.error('❌ Error fetching cancellation requests:', error);
      res.status(500).json({ error: 'Failed to fetch cancellation requests' });
    }
  },

  // Approve/reject cancellation request
  async handleCancellationRequest(req, res) {
    const connection = await pool.getConnection();
    try {
      const { requestId } = req.params;
      const { action, managerComments } = req.body; // action: 'approve' or 'reject'
      const managerId = req.user.id;
      const userRole = req.user.role;

      // Check if user has manager permissions
      if (userRole !== 'Manager' && userRole !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Manager role required.' });
      }

      console.log(`🔄 Processing cancellation request ${requestId} - action: ${action}, manager: ${managerId}`);

      await connection.beginTransaction();

      // Get cancellation request details
      const [requestResults] = await connection.execute(`
        SELECT lcr.*, ld.*, lt.LeaveName, e.FirstName, e.LastName, e.Email,
               m.FirstName as ManagerFirstName, m.LastName as ManagerLastName
        FROM leave_cancellation_requests lcr
        JOIN Leave_details ld ON lcr.leave_request_id = ld.LeaveAppID
        JOIN Employee e ON lcr.employee_id = e.EmpID
        JOIN LeaveType lt ON ld.LeaveTypeID = lt.LeaveTypeID
        JOIN Employee m ON e.ManagerID = m.EmpID
        WHERE lcr.id = ? AND e.ManagerID = ? AND lcr.status = 'Pending'
      `, [requestId, managerId]);

      if (requestResults.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Cancellation request not found or unauthorized' });
      }

      const request = requestResults[0];

      if (action === 'approve') {
        // Approve cancellation - cancel the leave and restore balance
        await connection.execute(`
          UPDATE leave_cancellation_requests 
          SET status = 'Approved', manager_response_date = NOW(), manager_comments = ?
          WHERE id = ?
        `, [managerComments, requestId]);

        await connection.execute(`
          UPDATE Leave_details 
          SET Status = 'Cancelled', CancelledDate = NOW()
          WHERE LeaveAppID = ?
        `, [request.leave_request_id]);

        // Restore leave balance
        const leaveDays = Math.ceil((new Date(request.ToDate) - new Date(request.FromDate)) / (1000 * 60 * 60 * 24)) + 1;
        await connection.execute(`
          UPDATE Emp_leave 
          SET LeaveTaken = LeaveTaken - ?, LeaveBalance = LeaveBalance + ?
          WHERE EmpID = ? AND LeaveTypeID = ? AND Year = YEAR(?)
        `, [leaveDays, leaveDays, request.EmpID, request.LeaveTypeID, request.FromDate]);

        await connection.commit();

        // Send approval email to employee
        const employeeData = {
          firstName: request.FirstName,
          lastName: request.LastName,
          email: request.Email
        };
        const managerData = {
          firstName: request.ManagerFirstName,
          lastName: request.ManagerLastName
        };
        const leaveData = {
          leaveType: request.LeaveName,
          startDate: request.FromDate,
          endDate: request.ToDate
        };

        await emailService.notifyLeaveCancellationApproval(employeeData, managerData, leaveData);

        console.log(`✅ Cancellation request ${requestId} approved`);
        res.json({ message: 'Cancellation approved successfully' });

      } else if (action === 'reject') {
        // Reject cancellation - restore original leave status
        await connection.execute(`
          UPDATE leave_cancellation_requests 
          SET status = 'Rejected', manager_response_date = NOW(), manager_comments = ?
          WHERE id = ?
        `, [managerComments, requestId]);

        await connection.execute(`
          UPDATE Leave_details 
          SET Status = 'Approved'
          WHERE LeaveAppID = ?
        `, [request.leave_request_id]);

        await connection.commit();

        console.log(`✅ Cancellation request ${requestId} rejected`);
        res.json({ message: 'Cancellation rejected successfully' });

      } else {
        await connection.rollback();
        res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
      }

    } catch (error) {
      await connection.rollback();
      console.error('❌ Error handling cancellation request:', error);
      res.status(500).json({ error: 'Failed to process cancellation request' });
    } finally {
      connection.release();
    }
  },

  // Get cancellation history for employee
  async getMyCancellationRequests(req, res) {
    try {
      const employeeId = req.user.id;

      const [requests] = await pool.execute(`
        SELECT lcr.*, ld.FromDate, ld.ToDate, lt.LeaveName
        FROM leave_cancellation_requests lcr
        JOIN Leave_details ld ON lcr.leave_request_id = ld.LeaveAppID
        JOIN LeaveType lt ON ld.LeaveTypeID = lt.LeaveTypeID
        WHERE lcr.employee_id = ?
        ORDER BY lcr.request_date DESC
      `, [employeeId]);

      res.json(requests);

    } catch (error) {
      console.error('❌ Error fetching employee cancellation requests:', error);
      res.status(500).json({ error: 'Failed to fetch cancellation requests' });
    }
  }
};

module.exports = leaveCancellationController;