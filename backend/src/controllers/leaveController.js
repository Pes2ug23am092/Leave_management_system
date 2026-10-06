// backend/src/controllers/leaveController.js

const { pool } = require('../../db/db');
const { logAction } = require('../utils/audit_logger');
const emailService = require('../services/emailService');

// Helper to calculate total leave days between two dates (full days only for simplicity)
const calculateDays = (fromDate, toDate, fromSession, toSession) => {
    try {
        // Basic implementation: calculate date difference in days
        const start = new Date(fromDate);
        const end = new Date(toDate);

        // If toDate is before fromDate, return 0 or throw an error
        if (end < start) return 0;

        let totalDays = 0;
        let currentDate = new Date(start);

        // Loop through each day (excluding the start date)
        while (currentDate <= end) {
            // Skip weekends and holidays if necessary (not implemented here)
            totalDays++;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Adjust for half days
        if (fromSession === 2) { // PM half-day start (loses 0.5 day)
            totalDays -= 0.5;
        }
        if (toSession === 1) { // AM half-day end (loses 0.5 day)
            totalDays -= 0.5;
        }

        // Ensure at least 0.5 days are taken if fromDate == toDate and sessions are correct
        if (totalDays < 0.5) {
            // Compare dates as strings or timestamps
            const isSameDay = start.toDateString() === end.toDateString();
            if (isSameDay && fromSession !== toSession) {
                return 0.5;
            }
            if (isSameDay && fromSession === toSession) {
                return 1; // Assuming full day if sessions are the same (e.g., AM to AM)
            }
            return 0; // Prevent negative leave days
        }
        
        return totalDays;
    } catch (err) {
        console.error('❌ Error calculating days:', err.message, {fromDate, toDate, fromSession, toSession});
        return 0; // Return 0 on error to prevent crashes
    }
};


// ===============================================
// 1. GET LEAVE BALANCES (for Dashboard summary cards)
// ===============================================
async function getLeaveBalances(req, res) {
    try {
        const empId = req.user.id;
        const currentYear = new Date().getFullYear();

        const [balances] = await pool.query(
            `SELECT
                L.LeaveName AS label,
                COALESCE(EL.LeaveTotal, L.MaxDays) AS total,
                COALESCE(EL.LeaveBalance, L.MaxDays) AS current,
                COALESCE(EL.LeaveTaken, 0) AS taken
            FROM LeaveType L
            LEFT JOIN Emp_leave EL ON L.LeaveTypeID = EL.LeaveTypeID 
                AND EL.EmpID = ? 
                AND EL.Year = ?
            WHERE L.Year = ?`,
            [empId, currentYear, currentYear]
        );

        // DEBUG: log balances returned from DB to help diagnose missing types
        console.debug(`DEBUG: Leave balances for EmpID=${empId}, Year=${currentYear}:`, balances);

        res.json(balances);
    } catch (err) {
        console.error('❌ Error fetching leave balances:', err.message);
        res.status(500).json({ error: 'Failed to fetch leave balances' });
    }
}


// ===============================================
// Dev-only: Debug endpoint to fetch raw Emp_leave rows for an employee
// WARNING: This is intended for development/testing only. Remove or protect in production.
async function debugEmpLeave(req, res) {
    try {
        const empId = req.params.empId;
        const [rows] = await pool.query(
            `SELECT * FROM Emp_leave WHERE EmpID = ? ORDER BY Year DESC`,
            [empId]
        );
        console.debug(`DEBUG: Emp_leave rows for EmpID=${empId}:`, rows);
        res.json(rows);
    } catch (err) {
        console.error('❌ Error fetching debug Emp_leave rows:', err.message);
        res.status(500).json({ error: 'Failed to fetch Emp_leave rows' });
    }
}


// ===============================================
// 2. GET LEAVE REQUESTS (for Dashboard history table)
// ===============================================
async function getLeaveRequests(req, res) {
    try {
        const empId = req.user.id;
        
        const [requests] = await pool.query(
            `SELECT
                LD.LeaveAppID AS id,
                LT.LeaveName AS type,
                LD.FromDate AS from_date,
                LD.ToDate AS to_date,
                LD.FromSession AS from_session,
                LD.ToSession AS to_session,
                LD.Status AS status,
                LD.Reason AS reason,
                M.FirstName AS approver_first_name,
                M.LastName AS approver_last_name,
                Manager.FirstName AS manager_first_name,
                Manager.LastName AS manager_last_name
            FROM Leave_details LD
            JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
            JOIN Employee E ON LD.EmpID = E.EmpID
            LEFT JOIN Employee M ON LD.ApprovedBy = M.EmpID
            LEFT JOIN Employee Manager ON E.ManagerID = Manager.EmpID
            WHERE LD.EmpID = ?
            ORDER BY LD.ApplyDate DESC`,
            [empId]
        );

        // Calculate Days and format data for frontend
        const formattedRequests = requests.map(request => {
            const days = calculateDays(request.from_date, request.to_date, request.from_session, request.to_session);
            // prefer the actual approver (when approved) otherwise show the manager assigned to the employee
            const approverName = request.approver_first_name
                ? `${request.approver_first_name} ${request.approver_last_name}`
                : (request.manager_first_name ? `${request.manager_first_name} ${request.manager_last_name}` : 'N/A');

            return {
                ...request,
                days: days,
                approver: approverName,
                from: new Date(request.from_date).toLocaleDateString(),
                to: new Date(request.to_date).toLocaleDateString(),
            };
        });

        res.json(formattedRequests);
    } catch (err) {
        console.error('❌ Error fetching leave requests:', err.message);
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
}


// ===============================================
// 3. APPLY FOR LEAVE
// ===============================================
async function applyLeave(req, res) {
    const { leaveTypeId, fromDate, fromSession, toDate, toSession, reason } = req.body;
    const empId = req.user.id; // From auth middleware
    const currentYear = new Date().getFullYear();

    // Calculate requested days
    const requestedDays = calculateDays(fromDate, toDate, fromSession, toSession);

    if (requestedDays <= 0) {
        return res.status(400).json({ message: 'Invalid date range or sessions selected.' });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Get leave type details and create balance record if needed
        const [leaveTypeRows] = await connection.query(
            `SELECT LeaveTypeID, MaxDays
             FROM LeaveType 
             WHERE LeaveTypeID = ? AND Year = ?`,
            [leaveTypeId, currentYear]
        );

        if (!leaveTypeRows.length) {
            await connection.rollback();
            return res.status(400).json({ message: 'Invalid leave type selected.' });
        }

        const maxDays = leaveTypeRows[0].MaxDays;

        // Check existing balance or create new record
        const [balanceRows] = await connection.query(
            `SELECT LeaveBalance, LeaveTypeID, EmpLeaveID 
             FROM Emp_leave 
             WHERE EmpID = ? AND LeaveTypeID = ? AND Year = ? FOR UPDATE`,
            [empId, leaveTypeId, currentYear]
        );

        let LeaveBalance;
        
        if (!balanceRows.length) {
            // Create new balance record with default values
            console.debug(`Creating new leave balance record for EmpID=${empId}, LeaveTypeID=${leaveTypeId}, Year=${currentYear}`);
            
            const [insertResult] = await connection.query(
                `INSERT INTO Emp_leave (EmpID, LeaveTypeID, Year, LeaveTotal, LeaveBalance, LeaveTaken)
                 VALUES (?, ?, ?, ?, ?, 0)`,
                [empId, leaveTypeId, currentYear, maxDays, maxDays]
            );
            
            LeaveBalance = maxDays;
        } else {
            LeaveBalance = balanceRows[0].LeaveBalance;
        }

        // Validate against available balance
        if (LeaveBalance < requestedDays) {
            await connection.rollback();
            return res.status(400).json({ 
                message: `Insufficient leave balance. Requested ${requestedDays} days, but only ${LeaveBalance} days available.`,
                requestedDays,
                availableBalance: LeaveBalance
            });
        }

        // 2. Get employee and manager details for email
        const [empDetails] = await connection.query(
            `SELECT E.*, M.FirstName as ManagerFirstName, M.LastName as ManagerLastName, M.Email as ManagerEmail,
                    LT.LeaveName
             FROM Employee E 
             JOIN Employee M ON E.ManagerID = M.EmpID
             JOIN LeaveType LT ON LT.LeaveTypeID = ?
             WHERE E.EmpID = ?`,
            [leaveTypeId, empId]
        );

        if (!empDetails.length) {
            await connection.rollback();
            return res.status(400).json({ message: 'Employee or manager details not found.' });
        }

        // 3. Insert into Leave_details
        const [result] = await connection.query(
            `INSERT INTO Leave_details 
             (EmpID, LeaveTypeID, FromDate, FromSession, ToDate, ToSession, Reason, Status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [empId, leaveTypeId, fromDate, fromSession, toDate, toSession, reason]
        );
        
        await connection.commit();
        await logAction(empId, `Leave application submitted for ${requestedDays} days (ID: ${result.insertId})`, 1);

        // 4. Send email notification to manager
        if (empDetails[0].ManagerEmail) {
            try {
                const employeeData = {
                    firstName: empDetails[0].FirstName,
                    lastName: empDetails[0].LastName,
                    email: empDetails[0].Email
                };

                const managerData = {
                    firstName: empDetails[0].ManagerFirstName,
                    lastName: empDetails[0].ManagerLastName,
                    email: empDetails[0].ManagerEmail
                };

                const leaveData = {
                    leaveType: empDetails[0].LeaveName,
                    startDate: fromDate,
                    endDate: toDate,
                    reason: reason
                };

                await emailService.notifyLeaveApplication(employeeData, managerData, leaveData);
                console.log('✅ Leave application email sent to manager');
            } catch (emailError) {
                console.error('⚠️ Failed to send leave application email:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.status(201).json({ 
            message: 'Leave application submitted successfully, pending manager approval.', 
            leaveAppId: result.insertId 
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('❌ Error submitting leave application:', err.message);
        await logAction(empId, `Leave application submission failed: ${err.message}`, 0);
        res.status(500).json({ error: 'Internal server error during leave submission' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}


// ===============================================
// 4. GET LEAVE TYPES
// ===============================================
async function getLeaveTypes(req, res) {
    try {
        const currentYear = new Date().getFullYear();
        console.debug(`Fetching leave types for year ${currentYear}`);

        const [types] = await pool.query(
            `SELECT LeaveTypeID, LeaveName, MaxDays, Year
             FROM LeaveType
             WHERE Year = ?
             ORDER BY LeaveTypeID`,
            [currentYear]
        );

        console.debug('Leave types fetched:', types); // Debug log

        if (!Array.isArray(types)) {
            console.error('Invalid data format from database - not an array:', types);
            return res.status(500).json({ error: 'Data format error' });
        }

        if (types.length === 0) {
            console.warn(`No leave types found for year ${currentYear}`);
            // Return an empty array rather than an error - the frontend will handle this
            return res.json([]);
        }

        // Validate each leave type has required fields
        const validTypes = types.filter(type => 
            type && typeof type === 'object' && 
            type.LeaveTypeID && 
            typeof type.LeaveName === 'string'
        );

        if (validTypes.length !== types.length) {
            console.error('Some leave types are missing required fields:', 
                types.filter(t => !validTypes.includes(t)));
        }

        res.json(validTypes);
    } catch (err) {
        console.error('❌ Error fetching leave types:', err.message);
        console.error(err.stack); // Log the full stack trace
        res.status(500).json({ error: 'Failed to fetch leave types' });
    }
}

// ===============================================
// 5. GET TEAM LEAVE REQUESTS (for Manager)
// ===============================================
async function getTeamLeaveRequests(req, res) {
    console.log('🔍 GET TEAM LEAVE REQUESTS - Function called');
    try {
        const managerId = req.user.id;
        console.log('🔍 Fetching team leave requests for manager ID:', managerId);
        
        console.log('📊 Executing SQL query...');
        const [requests] = await pool.query(
            `SELECT
                LD.LeaveAppID AS id,
                LD.EmpID AS employeeId,
                E.FirstName AS employeeFirstName,
                E.LastName AS employeeLastName,
                LT.LeaveName AS type,
                LD.FromDate AS from_date,
                LD.ToDate AS to_date,
                LD.FromSession AS from_session,
                LD.ToSession AS to_session,
                LD.Status AS status,
                LD.Reason AS reason,
                LD.ApplyDate AS applyDate
            FROM Leave_details LD
            JOIN Employee E ON LD.EmpID = E.EmpID
            JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
            WHERE E.ManagerID = ?
            ORDER BY 
                CASE LD.Status 
                    WHEN 'Pending' THEN 1 
                    WHEN 'Approved' THEN 2 
                    WHEN 'Rejected' THEN 3 
                    ELSE 4 
                END,
                LD.ApplyDate DESC`,
            [managerId]
        );

        console.log(`✅ Found ${requests.length} leave requests for manager ${managerId}`);

        // Format data for frontend WITH proper calculateDays function
        console.log('🔄 Formatting requests...');
        const formattedRequests = requests.map(request => {
            // Calculate actual days for each request
            const days = calculateDays(
                request.from_date,
                request.to_date,
                request.from_session,
                request.to_session
            );

            return {
                id: request.id,
                employeeId: request.employeeId,
                employee: `${request.employeeFirstName} ${request.employeeLastName}`,
                type: request.type,
                from: new Date(request.from_date).toLocaleDateString(),
                to: new Date(request.to_date).toLocaleDateString(),
                from_date: request.from_date,
                to_date: request.to_date,
                from_session: request.from_session,
                to_session: request.to_session,
                days: days,
                status: request.status,
                reason: request.reason,
                applyDate: request.applyDate,
                approver: 'You (Manager)'
            };
        });

        console.log('✅ Sending formatted requests:', formattedRequests.length);
        res.json(formattedRequests);
    } catch (err) {
        console.error('❌ Error fetching team leave requests:', err.message);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ error: 'Failed to fetch team leave requests', details: err.message });
    }
}


// ===============================================
// 6. UPDATE LEAVE STATUS (Approve/Reject)
// ===============================================
async function updateLeaveStatus(req, res) {
    const { leaveId } = req.params;
    const { status, remarks } = req.body;
    const managerId = req.user.id; // From auth middleware
    const currentYear = new Date().getFullYear();
    let connection;

    console.log('🔍 UPDATE LEAVE STATUS - Function called');
    console.log('📝 Leave ID:', leaveId, 'Status:', status, 'Manager:', managerId);

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Get leave request details with proper join to get current year balance
        const [leaveDetails] = await connection.query(
            `SELECT LD.*, EL.LeaveBalance, EL.EmpLeaveID, EL.LeaveTaken, EL.LeaveTotal,
                    E.FirstName, E.LastName, E.Email,
                    LT.LeaveName, LT.MaxDays
             FROM Leave_details LD
             JOIN Employee E ON LD.EmpID = E.EmpID
             JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
             LEFT JOIN Emp_leave EL ON LD.EmpID = EL.EmpID 
                AND LD.LeaveTypeID = EL.LeaveTypeID 
                AND EL.Year = ?
             WHERE LD.LeaveAppID = ? AND LD.Status = 'Pending'
             FOR UPDATE`,
            [currentYear, leaveId]
        );

        if (!leaveDetails.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Leave request not found or already processed.' });
        }

        const leave = leaveDetails[0];
        console.log('✅ Found leave request:', leave);
        
        // Calculate actual leave days using the existing calculateDays function
        const requestedDays = calculateDays(
            leave.FromDate, 
            leave.ToDate, 
            leave.FromSession, 
            leave.ToSession
        );

        console.log('📊 Calculated leave days:', requestedDays);

        // 2. If no Emp_leave record exists for this year, create one
        if (!leave.EmpLeaveID && status === 'Approved') {
            console.log('📝 Creating new leave balance record...');
            const [insertResult] = await connection.query(
                `INSERT INTO Emp_leave (EmpID, LeaveTypeID, Year, LeaveTotal, LeaveBalance, LeaveTaken)
                 VALUES (?, ?, ?, ?, ?, 0)`,
                [leave.EmpID, leave.LeaveTypeID, currentYear, leave.MaxDays, leave.MaxDays]
            );
            
            // Update the leave object with new values
            leave.EmpLeaveID = insertResult.insertId;
            leave.LeaveBalance = leave.MaxDays;
            leave.LeaveTaken = 0;
            leave.LeaveTotal = leave.MaxDays;
        }

        // 3. Update Leave_details status and approval information
        console.log('📊 Updating leave status...');
        await connection.query(
            `UPDATE Leave_details 
             SET Status = ?, ApprovedBy = ?, ApprovedDate = CURRENT_TIMESTAMP, RejectionReason = ?
             WHERE LeaveAppID = ?`,
            [status, managerId, status === 'Rejected' ? remarks : null, leaveId]
        );

        // 4. If approved, update leave balance
        let newBalance = leave.LeaveBalance;
        let newTaken = leave.LeaveTaken;

        if (status === 'Approved' && leave.EmpLeaveID) {
            console.log('✅ Updating leave balance...');
            
            // Check if sufficient balance is available
            if (leave.LeaveBalance < requestedDays) {
                await connection.rollback();
                return res.status(400).json({ 
                    message: `Cannot approve: Insufficient leave balance. Required: ${requestedDays} days, Available: ${leave.LeaveBalance} days`,
                    requestedDays: requestedDays,
                    availableBalance: leave.LeaveBalance
                });
            }

            newBalance = leave.LeaveBalance - requestedDays;
            newTaken = leave.LeaveTaken + requestedDays;

            await connection.query(
                `UPDATE Emp_leave 
                 SET LeaveBalance = ?, LeaveTaken = ?
                 WHERE EmpLeaveID = ?`,
                [newBalance, newTaken, leave.EmpLeaveID]
            );

            console.log(`✅ Leave balance updated: Balance: ${newBalance}, Taken: ${newTaken}`);
        }

        await connection.commit();
        console.log('✅ Leave status updated successfully');
        
        // Log action with details
        await logAction(managerId, 
            `Leave request ${leaveId} ${status.toLowerCase()} for ${leave.FirstName} ${leave.LastName} - ${requestedDays} days of ${leave.LeaveName}`, 
            1
        );

        // Send email notification to employee
        try {
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

            if (status === 'Approved') {
                await emailService.notifyLeaveApproval(employeeData, managerData, leaveData);
                console.log('✅ Leave approval email sent to employee');
            } else if (status === 'Rejected') {
                await emailService.notifyLeaveRejection(employeeData, managerData, leaveData, remarks);
                console.log('✅ Leave rejection email sent to employee');
            }
        } catch (emailErr) {
            console.warn('⚠️ Email notification failed:', emailErr.message);
            // Don't fail the whole operation if email fails
        }

        res.json({ 
            message: `Leave request ${status.toLowerCase()} successfully.`,
            leaveId: leaveId,
            requestedDays: requestedDays,
            updatedBalance: newBalance,
            employee: `${leave.FirstName} ${leave.LastName}`,
            leaveType: leave.LeaveName
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('❌ Error updating leave status:', err.message);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ error: 'Failed to update leave status', details: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// ===============================================
// 7. CANCEL APPROVED LEAVE (Restore Balance)
// ===============================================
async function cancelApprovedLeave(req, res) {
    const { leaveId } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;
    const currentYear = new Date().getFullYear();
    let connection;

    console.log('🔍 CANCEL APPROVED LEAVE - Function called');
    console.log('📝 Leave ID:', leaveId, 'Manager:', managerId);

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Get approved leave request details
        const [leaveDetails] = await connection.query(
            `SELECT LD.*, EL.LeaveBalance, EL.EmpLeaveID, EL.LeaveTaken,
                    E.FirstName, E.LastName, E.Email,
                    LT.LeaveName
             FROM Leave_details LD
             JOIN Employee E ON LD.EmpID = E.EmpID
             JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
             LEFT JOIN Emp_leave EL ON LD.EmpID = EL.EmpID 
                AND LD.LeaveTypeID = EL.LeaveTypeID 
                AND EL.Year = ?
             WHERE LD.LeaveAppID = ? AND LD.Status = 'Approved'
             FOR UPDATE`,
            [currentYear, leaveId]
        );

        if (!leaveDetails.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Approved leave request not found.' });
        }

        const leave = leaveDetails[0];
        
        // Calculate leave days to restore
        const leaveDays = calculateDays(
            leave.FromDate, 
            leave.ToDate, 
            leave.FromSession, 
            leave.ToSession
        );

        // 2. Update Leave_details status to Cancelled
        await connection.query(
            `UPDATE Leave_details 
             SET Status = 'Cancelled', CancelledDate = CURRENT_TIMESTAMP, RejectionReason = ?
             WHERE LeaveAppID = ?`,
            [reason, leaveId]
        );

        // 3. Restore leave balance
        if (leave.EmpLeaveID) {
            const newBalance = leave.LeaveBalance + leaveDays;
            const newTaken = Math.max(0, leave.LeaveTaken - leaveDays);

            await connection.query(
                `UPDATE Emp_leave 
                 SET LeaveBalance = ?, LeaveTaken = ?
                 WHERE EmpLeaveID = ?`,
                [newBalance, newTaken, leave.EmpLeaveID]
            );

            console.log(`✅ Leave balance restored: +${leaveDays} days, New Balance: ${newBalance}`);
        }

        await connection.commit();
        
        // Log action
        await logAction(managerId, 
            `Cancelled approved leave ${leaveId} for ${leave.FirstName} ${leave.LastName} - restored ${leaveDays} days of ${leave.LeaveName}`, 
            1
        );

        res.json({ 
            message: 'Leave cancelled successfully and balance restored.',
            leaveId: leaveId,
            restoredDays: leaveDays,
            employee: `${leave.FirstName} ${leave.LastName}`,
            leaveType: leave.LeaveName
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('❌ Error cancelling leave:', err.message);
        res.status(500).json({ error: 'Failed to cancel leave', details: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    getLeaveBalances,
    getLeaveRequests,
    applyLeave,
    debugEmpLeave,
    getLeaveTypes,
    getTeamLeaveRequests,
    updateLeaveStatus,
    cancelApprovedLeave,
    // exported for unit testing internal helper branches
    calculateDays,
};