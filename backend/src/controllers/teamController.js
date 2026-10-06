// backend/src/controllers/teamController.js
const { pool } = require('../../db/db');

async function getTeamTimeOff(req, res) {
    try {
        const empId = req.user.id;
        const userRole = req.user.role;
        
        console.log('🔍 Getting team time off for user:', empId, 'Role:', userRole);
        
        let teamQuery;
        let queryParams;
        
        // Different logic based on user role
        if (userRole === 'Manager' || userRole === 'Admin') {
            // For managers: get their direct reports
            teamQuery = `
                WITH TeamMembers AS (
                    SELECT EmpID, FirstName, LastName
                    FROM Employee 
                    WHERE ManagerID = ?
                    UNION
                    SELECT EmpID, FirstName, LastName
                    FROM Employee 
                    WHERE EmpID = ?
                )
                SELECT 
                    LD.FromDate,
                    LD.ToDate,
                    LD.FromSession,
                    LD.ToSession,
                    E.FirstName,
                    E.LastName,
                    LT.LeaveName as leaveType
                FROM Leave_details LD
                JOIN Employee E ON LD.EmpID = E.EmpID
                JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
                JOIN TeamMembers TM ON LD.EmpID = TM.EmpID
                WHERE 
                    LD.Status = 'Approved'
                    AND LD.FromDate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                    AND LD.ToDate >= CURDATE()
                ORDER BY LD.FromDate ASC`;
            queryParams = [empId, empId];
        } else {
            // For employees: get team members (people with same manager)
            teamQuery = `
                WITH TeamMembers AS (
                    SELECT EmpID, FirstName, LastName
                    FROM Employee 
                    WHERE ManagerID = (SELECT ManagerID FROM Employee WHERE EmpID = ?)
                    AND EmpID != ? -- Exclude self from team view
                )
                SELECT 
                    LD.FromDate,
                    LD.ToDate,
                    LD.FromSession,
                    LD.ToSession,
                    E.FirstName,
                    E.LastName,
                    LT.LeaveName as leaveType
                FROM Leave_details LD
                JOIN Employee E ON LD.EmpID = E.EmpID
                JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
                JOIN TeamMembers TM ON LD.EmpID = TM.EmpID
                WHERE 
                    LD.Status = 'Approved'
                    AND LD.FromDate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                    AND LD.ToDate >= CURDATE()
                ORDER BY LD.FromDate ASC`;
            queryParams = [empId, empId];
        }
        
        const [teamLeaves] = await pool.query(teamQuery, queryParams);
        
        console.log(`✅ Found ${teamLeaves.length} approved leaves for team members`);

        // Helper function to calculate days including sessions
        const calculateLeaveDays = (fromDate, toDate, fromSession, toSession) => {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            let totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            
            // Adjust for half days
            if (fromSession === 2) totalDays -= 0.5; // PM start loses morning
            if (toSession === 1) totalDays -= 0.5;   // AM end loses afternoon
            
            return Math.max(0.5, totalDays); // Minimum 0.5 days
        };

        // Group by date and expand date ranges
        const groupedLeaves = {};
        
        teamLeaves.forEach(leave => {
            const fromDate = new Date(leave.FromDate);
            const toDate = new Date(leave.ToDate);
            const fullName = `${leave.FirstName} ${leave.LastName}`;
            const initials = `${leave.FirstName[0]}${leave.LastName[0]}`;
            
            // Create date range for this leave
            let currentDate = new Date(fromDate);
            while (currentDate <= toDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                
                if (!groupedLeaves[dateStr]) {
                    groupedLeaves[dateStr] = {
                        date: dateStr,
                        members: [],
                        memberDetails: []
                    };
                }
                
                // Avoid duplicates for the same person on the same date
                if (!groupedLeaves[dateStr].memberDetails.find(m => m.fullName === fullName)) {
                    groupedLeaves[dateStr].members.push(initials);
                    groupedLeaves[dateStr].memberDetails.push({
                        fullName: fullName,
                        initials: initials,
                        leaveType: leave.leaveType
                    });
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        // Convert to array and sort by date
        const result = Object.values(groupedLeaves)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(item => ({
                date: item.date,
                members: item.members,
                memberDetails: item.memberDetails,
                count: item.members.length
            }));

        console.log(`✅ Grouped into ${result.length} dates with team members on leave`);
        res.json(result);
        
    } catch (err) {
        console.error('❌ Error fetching team time off:', err.message);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ error: 'Failed to fetch team time off' });
    }
}

async function getLeaveActivities(req, res) {
    try {
        const empId = req.user.id;
        
        // Get recent and upcoming leaves (pending, approved, or recently applied)
        const [activities] = await pool.query(
            `SELECT 
                LD.LeaveAppID as id,
                LT.LeaveName as type,
                LD.FromDate as fromDate,
                LD.ToDate as toDate,
                LD.Status as status,
                LD.FromSession as fromSession,
                LD.ToSession as toSession,
                E.FirstName as approverFirstName,
                E.LastName as approverLastName,
                LD.ApplyDate as appliedDate
            FROM Leave_details LD
            JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
            LEFT JOIN Employee E ON LD.ApprovedBy = E.EmpID
            WHERE LD.EmpID = ? 
            AND (
                -- Upcoming leaves (pending or approved, future dates)
                (LD.Status IN ('Pending', 'Approved') AND LD.FromDate >= CURDATE())
                OR 
                -- Recent leaves (any status, within last 30 days)
                (LD.ApplyDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
                OR
                -- Currently ongoing leaves (approved and current date is within leave period)
                (LD.Status = 'Approved' AND LD.FromDate <= CURDATE() AND LD.ToDate >= CURDATE())
            )
            ORDER BY 
                CASE 
                    WHEN LD.Status = 'Pending' THEN 1 
                    WHEN LD.Status = 'Approved' AND LD.FromDate >= CURDATE() THEN 2
                    WHEN LD.Status = 'Approved' AND LD.FromDate <= CURDATE() AND LD.ToDate >= CURDATE() THEN 3
                    ELSE 4 
                END,
                LD.FromDate ASC,
                LD.ApplyDate DESC
            LIMIT 5`,
            [empId]
        );

        // Helper function to calculate leave days
        const calculateDays = (fromDate, toDate, fromSession, toSession) => {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            let totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            
            // Adjust for half days
            if (fromSession === 2) totalDays -= 0.5; // PM start loses morning
            if (toSession === 1) totalDays -= 0.5;   // AM end loses afternoon
            
            return Math.max(0.5, totalDays); // Minimum 0.5 days
        };

        const formattedActivities = activities.map(activity => {
            const days = calculateDays(
                activity.fromDate, 
                activity.toDate, 
                activity.fromSession, 
                activity.toSession
            );
            
            // Determine if leave is ongoing, upcoming, or past
            const today = new Date();
            const fromDate = new Date(activity.fromDate);
            const toDate = new Date(activity.toDate);
            
            let statusLabel = activity.status;
            if (activity.status === 'Approved') {
                if (fromDate <= today && toDate >= today) {
                    statusLabel = 'Ongoing';
                } else if (fromDate > today) {
                    statusLabel = 'Upcoming';
                }
            }
            
            return {
                id: activity.id,
                type: activity.type,
                fromDate: fromDate.toLocaleDateString(),
                toDate: toDate.toLocaleDateString(),
                status: activity.status,
                statusLabel: statusLabel,
                days: days,
                approver: activity.approverFirstName ? 
                    `${activity.approverFirstName} ${activity.approverLastName}` : 
                    'Pending',
                appliedDate: new Date(activity.appliedDate).toLocaleDateString(),
                isUpcoming: fromDate > today,
                isOngoing: fromDate <= today && toDate >= today,
                isPending: activity.status === 'Pending'
            };
        });

        console.log(`✅ Found ${formattedActivities.length} recent/upcoming leave activities for employee ${empId}`);
        res.json(formattedActivities);
    } catch (err) {
        console.error('❌ Error fetching leave activities:', err.message);
        res.status(500).json({ error: 'Failed to fetch leave activities' });
    }
}

async function getManagerReports(req, res) {
    try {
        const managerId = req.user.id;
        const userRole = req.user.role;
        
        console.log('📊 Getting manager reports for user:', managerId, 'Role:', userRole);
        
        if (userRole !== 'Manager' && userRole !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized: Manager access required' });
        }
        
        // Get team leave statistics
        const [leaveStats] = await pool.query(
            `SELECT 
                E.Designation as Department,
                LT.LeaveName as leaveType,
                COUNT(LD.LeaveAppID) as totalApplications,
                SUM(CASE WHEN LD.Status = 'Approved' THEN 1 ELSE 0 END) as approvedCount,
                SUM(CASE WHEN LD.Status = 'Rejected' THEN 1 ELSE 0 END) as rejectedCount,
                SUM(CASE WHEN LD.Status = 'Pending' THEN 1 ELSE 0 END) as pendingCount,
                ROUND(AVG(DATEDIFF(LD.ToDate, LD.FromDate) + 1), 2) as averageDays
            FROM Leave_details LD
            JOIN Employee E ON LD.EmpID = E.EmpID
            JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
            WHERE E.ManagerID = ?
            AND LD.ApplyDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY E.Designation, LT.LeaveName
            ORDER BY E.Designation, LT.LeaveName`,
            [managerId]
        );
        
        // Get monthly trends
        const [monthlyTrends] = await pool.query(
            `SELECT 
                DATE_FORMAT(LD.ApplyDate, '%Y-%m') as month,
                LT.LeaveName as leaveType,
                COUNT(LD.LeaveAppID) as applications,
                SUM(CASE WHEN LD.Status = 'Approved' THEN 1 ELSE 0 END) as approved
            FROM Leave_details LD
            JOIN Employee E ON LD.EmpID = E.EmpID
            JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
            WHERE E.ManagerID = ?
            AND LD.ApplyDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(LD.ApplyDate, '%Y-%m'), LT.LeaveName
            ORDER BY month DESC, LT.LeaveName`,
            [managerId]
        );
        
        // Get team member summary
        const [teamSummary] = await pool.query(
            `SELECT 
                CONCAT(E.FirstName, ' ', E.LastName) as employeeName,
                E.Designation as Department,
                COUNT(LD.LeaveAppID) as totalLeaves,
                SUM(CASE WHEN LD.Status = 'Approved' THEN DATEDIFF(LD.ToDate, LD.FromDate) + 1 ELSE 0 END) as daysTaken,
                SUM(CASE WHEN LD.Status = 'Pending' THEN 1 ELSE 0 END) as pendingRequests
            FROM Employee E
            LEFT JOIN Leave_details LD ON E.EmpID = LD.EmpID AND LD.ApplyDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            WHERE E.ManagerID = ?
            GROUP BY E.EmpID, E.FirstName, E.LastName, E.Designation
            ORDER BY E.Designation, E.FirstName`,
            [managerId]
        );
        
        // Get additional analytics
        const [analytics] = await pool.query(
            `SELECT 
                COUNT(DISTINCT E.EmpID) as totalTeamMembers,
                AVG(CASE WHEN LD.Status = 'Approved' THEN DATEDIFF(LD.ToDate, LD.FromDate) + 1 END) as avgLeaveLength,
                COUNT(CASE WHEN LD.Status = 'Approved' AND LD.ApplyDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as recentApprovals,
                COUNT(CASE WHEN LD.Status = 'Pending' THEN 1 END) as pendingCount,
                MAX(LD.ApplyDate) as lastApplicationDate
            FROM Employee E
            LEFT JOIN Leave_details LD ON E.EmpID = LD.EmpID AND LD.ApplyDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            WHERE E.ManagerID = ?`,
            [managerId]
        );

        // Get leave patterns by day of week
        const [dayPatterns] = await pool.query(
            `SELECT 
                DAYNAME(LD.FromDate) as dayOfWeek,
                COUNT(*) as applicationCount
            FROM Leave_details LD
            JOIN Employee E ON LD.EmpID = E.EmpID
            WHERE E.ManagerID = ?
            AND LD.ApplyDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            AND LD.Status = 'Approved'
            GROUP BY DAYOFWEEK(LD.FromDate), DAYNAME(LD.FromDate)
            ORDER BY DAYOFWEEK(LD.FromDate)`,
            [managerId]
        );

        console.log(`✅ Generated reports: ${leaveStats.length} stats, ${monthlyTrends.length} trends, ${teamSummary.length} team members`);
        
        res.json({
            leaveStatistics: leaveStats,
            monthlyTrends: monthlyTrends,
            teamSummary: teamSummary,
            analytics: analytics[0] || {},
            dayPatterns: dayPatterns,
            period: 'Last 12 months',
            generatedAt: new Date().toISOString()
        });
        
    } catch (err) {
        console.error('❌ Error generating manager reports:', err.message);
        res.status(500).json({ error: 'Failed to generate reports' });
    }
}

async function getTeamLeaveHistory(req, res) {
    try {
        const managerId = req.user.id;
        const userRole = req.user.role;
        
        console.log('📋 Getting team approved leaves (past & future) for manager:', managerId, 'Role:', userRole);
        
        if (userRole !== 'Manager' && userRole !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized: Manager access required' });
        }
        
        console.log('🔍 Executing SQL query for manager ID:', managerId);
        
        // Get ALL approved leaves for team members (past and future)
        const [leaveHistory] = await pool.query(
            `SELECT 
                LD.LeaveAppID as id,
                CONCAT(E.FirstName, ' ', E.LastName) as employeeName,
                E.Designation as department,
                LT.LeaveName as leaveType,
                LD.FromDate,
                LD.ToDate,
                LD.FromSession,
                LD.ToSession,
                LD.Reason,
                LD.ApprovedDate,
                DATEDIFF(LD.ToDate, LD.FromDate) + 1 as duration,
                LD.Status,
                CASE 
                    WHEN LD.FromDate > CURDATE() THEN 'Upcoming'
                    WHEN LD.FromDate <= CURDATE() AND LD.ToDate >= CURDATE() THEN 'Ongoing'
                    ELSE 'Completed'
                END as leaveStatus
            FROM Leave_details LD
            JOIN Employee E ON LD.EmpID = E.EmpID
            JOIN LeaveType LT ON LD.LeaveTypeID = LT.LeaveTypeID
            WHERE E.ManagerID = ?
            AND LD.Status = 'Approved'
            ORDER BY LD.FromDate DESC
            LIMIT 15`,
            [managerId]
        );
        
        console.log('📊 Raw SQL result - Found', leaveHistory.length, 'approved leaves');
        console.log('🔍 Raw data sample:', leaveHistory.slice(0, 2).map(leave => ({
            id: leave.id,
            employee: leave.employeeName,
            type: leave.leaveType,
            fromDate: leave.FromDate,
            toDate: leave.ToDate,
            status: leave.Status,
            leaveStatus: leave.leaveStatus,
            approvedDate: leave.ApprovedDate
        })));
        
        // Format the data for frontend
        const formattedHistory = leaveHistory.map(leave => {
            // Calculate actual days considering sessions
            const calculateDays = (fromDate, toDate, fromSession, toSession) => {
                const start = new Date(fromDate);
                const end = new Date(toDate);
                let totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                
                // Adjust for half days
                if (fromSession === 2) totalDays -= 0.5; // PM start loses morning
                if (toSession === 1) totalDays -= 0.5;   // AM end loses afternoon
                
                return Math.max(0.5, totalDays); // Minimum 0.5 days
            };
            
            const actualDays = calculateDays(
                leave.FromDate,
                leave.ToDate,
                leave.FromSession,
                leave.ToSession
            );
            
            return {
                id: leave.id,
                employeeName: leave.employeeName,
                department: leave.department, // Using aliased field name
                leaveType: leave.leaveType,
                fromDate: leave.FromDate,
                toDate: leave.ToDate,
                reason: leave.Reason,
                approvedDate: leave.ApprovedDate,
                days: actualDays,
                status: leave.Status,
                leaveStatus: leave.leaveStatus // 'Upcoming', 'Ongoing', or 'Completed'
            };
        });
        
        console.log(`✅ Found ${formattedHistory.length} approved leave records (past & future) for team`);
        console.log('📤 Sending formatted data:', formattedHistory.slice(0, 2).map(h => ({
            employee: h.employeeName,
            type: h.leaveType,
            from: h.fromDate,
            to: h.toDate,
            status: h.leaveStatus,
            approved: h.approvedDate
        })));
        
        res.json(formattedHistory);
        
    } catch (err) {
        console.error('❌ Error fetching team approved leaves:', err.message);
        console.error('❌ Error stack:', err.stack);
        console.error('❌ Error code:', err.code);
        res.status(500).json({ 
            error: 'Failed to fetch team approved leaves',
            details: err.message,
            code: err.code 
        });
    }
}

module.exports = {
    getTeamTimeOff,
    getLeaveActivities,
    getManagerReports,
    getTeamLeaveHistory
};