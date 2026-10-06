// src/controllers/adminController.js

const { pool } = require('../../db/db');
const bcrypt = require('bcrypt');

// ===============================
// 📊 ADMIN DASHBOARD METRICS
// ===============================

async function getAdminMetrics(req, res) {
  try {
    console.log('🔍 Fetching admin metrics...');
    
    // Get total employees count
    const [employeeCount] = await pool.query(
      `SELECT COUNT(*) as total FROM Employee WHERE Role != 'Admin'`
    );
    
    // Get total leave days taken this year
    const currentYear = new Date().getFullYear();
    const [leaveDaysTaken] = await pool.query(
      `SELECT COALESCE(SUM(el.LeaveTaken), 0) as total 
       FROM Emp_leave el 
       WHERE el.Year = ?`,
      [currentYear]
    );
    
    // Get pending requests count
    const [pendingRequests] = await pool.query(
      `SELECT COUNT(*) as total FROM Leave_details WHERE Status = 'Pending'`
    );
    
    // Get approved requests today
    const [approvedToday] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM Leave_details 
       WHERE Status = 'Approved' AND DATE(ApprovedDate) = CURDATE()`
    );
    
    const metrics = {
      totalEmployees: employeeCount[0].total,
      totalLeaveDaysTaken: leaveDaysTaken[0].total,
      pendingRequests: pendingRequests[0].total,
      approvedToday: approvedToday[0].total
    };
    
    console.log('✅ Admin metrics fetched:', metrics);
    res.json(metrics);
    
  } catch (error) {
    console.error('❌ Error fetching admin metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin metrics',
      details: error.message 
    });
  }
}

// ===============================
// 👥 EMPLOYEE MANAGEMENT
// ===============================

async function getAllEmployees(req, res) {
  try {
    console.log('🔍 Fetching all employees...');
    
    const [employees] = await pool.query(
      `SELECT 
         e.EmpID,
         e.FirstName,
         e.LastName,
         e.Email,
         e.Designation,
         e.Role,
         e.Gender,
         e.DOB,
         e.ManagerID,
         CONCAT(m.FirstName, ' ', m.LastName) as ManagerName
       FROM Employee e
       LEFT JOIN Employee m ON e.ManagerID = m.EmpID
       ORDER BY e.EmpID`
    );
    
    console.log(`✅ Found ${employees.length} employees`);
    res.json(employees);
    
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      details: error.message 
    });
  }
}

async function createEmployee(req, res) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      designation, 
      role, 
      gender, 
      dob, 
      managerId 
    } = req.body;
    
    console.log('🔍 Creating new employee:', { firstName, lastName, email, role });
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, password' 
      });
    }
    
    // Check if email already exists
    const [existingEmployee] = await pool.query(
      'SELECT EmpID FROM Employee WHERE Email = ?',
      [email]
    );
    
    if (existingEmployee.length > 0) {
      return res.status(400).json({ 
        error: 'Employee with this email already exists' 
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create employee
    const [result] = await pool.query(
      `INSERT INTO Employee 
       (FirstName, LastName, Email, PasswordHash, Designation, Role, Gender, DOB, ManagerID) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, passwordHash, designation, role || 'Employee', gender, dob, managerId || null]
    );
    
    const empId = result.insertId;
    
    // Create default leave allocations for the current year
    await createDefaultLeaveAllocations(empId);
    
    console.log(`✅ Employee created with ID: ${empId}`);
    res.status(201).json({ 
      message: 'Employee created successfully',
      empId: empId
    });
    
  } catch (error) {
    console.error('❌ Error creating employee:', error);
    res.status(500).json({ 
      error: 'Failed to create employee',
      details: error.message 
    });
  }
}

async function updateEmployee(req, res) {
  try {
    const { empId } = req.params;
    const updateData = req.body;
    
    console.log('🔍 Updating employee:', empId, updateData);
    
    // Remove password from update if it's empty
    if (updateData.password && updateData.password.trim() === '') {
      delete updateData.password;
    }
    
    // Hash password if provided
    if (updateData.password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(updateData.password, saltRounds);
      delete updateData.password;
    }
    
    // Build dynamic update query
    const fields = Object.keys(updateData).filter(key => 
      ['firstName', 'lastName', 'email', 'passwordHash', 'designation', 'role', 'gender', 'dob', 'managerId'].includes(key)
    );
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const setClause = fields.map(field => {
      const dbField = field === 'firstName' ? 'FirstName' :
                     field === 'lastName' ? 'LastName' :
                     field === 'email' ? 'Email' :
                     field === 'passwordHash' ? 'PasswordHash' :
                     field === 'designation' ? 'Designation' :
                     field === 'role' ? 'Role' :
                     field === 'gender' ? 'Gender' :
                     field === 'dob' ? 'DOB' :
                     field === 'managerId' ? 'ManagerID' : field;
      return `${dbField} = ?`;
    }).join(', ');
    
    const values = fields.map(field => updateData[field]);
    values.push(empId);
    
    const [result] = await pool.query(
      `UPDATE Employee SET ${setClause} WHERE EmpID = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    console.log(`✅ Employee ${empId} updated successfully`);
    res.json({ message: 'Employee updated successfully' });
    
  } catch (error) {
    console.error('❌ Error updating employee:', error);
    res.status(500).json({ 
      error: 'Failed to update employee',
      details: error.message 
    });
  }
}

async function deleteEmployee(req, res) {
  try {
    const { empId } = req.params;
    
    console.log('🔍 Deleting employee:', empId);
    
    // Check if employee exists
    const [employee] = await pool.query(
      'SELECT EmpID, Role FROM Employee WHERE EmpID = ?',
      [empId]
    );
    
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Prevent deletion of admin users
    if (employee[0].Role === 'Admin') {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }
    
    // Delete employee (cascade will handle related records)
    const [result] = await pool.query(
      'DELETE FROM Employee WHERE EmpID = ?',
      [empId]
    );
    
    console.log(`✅ Employee ${empId} deleted successfully`);
    res.json({ message: 'Employee deleted successfully' });
    
  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    res.status(500).json({ 
      error: 'Failed to delete employee',
      details: error.message 
    });
  }
}

// ===============================
// 📋 LEAVE TYPE MANAGEMENT
// ===============================

async function getAllLeaveTypes(req, res) {
  try {
    console.log('🔍 Fetching all leave types...');
    
    const currentYear = new Date().getFullYear();
    const [leaveTypes] = await pool.query(
      `SELECT LeaveTypeID, LeaveName, MaxDays, Year 
       FROM LeaveType 
       WHERE Year = ? 
       ORDER BY LeaveTypeID`,
      [currentYear]
    );
    
    console.log(`✅ Found ${leaveTypes.length} leave types`);
    res.json(leaveTypes);
    
  } catch (error) {
    console.error('❌ Error fetching leave types:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leave types',
      details: error.message 
    });
  }
}

async function createLeaveType(req, res) {
  try {
    const { leaveName, maxDays, year } = req.body;
    
    console.log('🔍 Creating leave type:', { leaveName, maxDays, year });
    
    if (!leaveName || !maxDays) {
      return res.status(400).json({ 
        error: 'Missing required fields: leaveName, maxDays' 
      });
    }
    
    const targetYear = year || new Date().getFullYear();
    
    // Check if leave type already exists for this year
    const [existing] = await pool.query(
      'SELECT LeaveTypeID FROM LeaveType WHERE LeaveName = ? AND Year = ?',
      [leaveName, targetYear]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Leave type already exists for this year' 
      });
    }
    
    // Create leave type
    const [result] = await pool.query(
      'INSERT INTO LeaveType (LeaveName, MaxDays, Year) VALUES (?, ?, ?)',
      [leaveName, maxDays, targetYear]
    );
    
    const leaveTypeId = result.insertId;
    
    // Create leave allocations for all existing employees
    await createLeaveAllocationsForAllEmployees(leaveTypeId, maxDays, targetYear);
    
    console.log(`✅ Leave type created with ID: ${leaveTypeId}`);
    res.status(201).json({ 
      message: 'Leave type created successfully',
      leaveTypeId: leaveTypeId
    });
    
  } catch (error) {
    console.error('❌ Error creating leave type:', error);
    res.status(500).json({ 
      error: 'Failed to create leave type',
      details: error.message 
    });
  }
}

async function updateLeaveType(req, res) {
  try {
    const { leaveTypeId } = req.params;
    const { leaveName, maxDays, year } = req.body;
    
    console.log('🔍 Updating leave type:', leaveTypeId, { leaveName, maxDays, year });
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    
    if (leaveName) {
      updates.push('LeaveName = ?');
      values.push(leaveName);
    }
    if (maxDays) {
      updates.push('MaxDays = ?');
      values.push(maxDays);
    }
    if (year) {
      updates.push('Year = ?');
      values.push(year);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(leaveTypeId);
    
    const [result] = await pool.query(
      `UPDATE LeaveType SET ${updates.join(', ')} WHERE LeaveTypeID = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Leave type not found' });
    }
    
    console.log(`✅ Leave type ${leaveTypeId} updated successfully`);
    res.json({ message: 'Leave type updated successfully' });
    
  } catch (error) {
    console.error('❌ Error updating leave type:', error);
    res.status(500).json({ 
      error: 'Failed to update leave type',
      details: error.message 
    });
  }
}

async function deleteLeaveType(req, res) {
  try {
    const { leaveTypeId } = req.params;
    
    console.log('🔍 Deleting leave type:', leaveTypeId);
    
    // Check if leave type has any associated leave records
    const [leaveRecords] = await pool.query(
      'SELECT COUNT(*) as count FROM Leave_details WHERE LeaveTypeID = ?',
      [leaveTypeId]
    );
    
    if (leaveRecords[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete leave type with existing leave records' 
      });
    }
    
    // Delete leave type (cascade will handle Emp_leave records)
    const [result] = await pool.query(
      'DELETE FROM LeaveType WHERE LeaveTypeID = ?',
      [leaveTypeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Leave type not found' });
    }
    
    console.log(`✅ Leave type ${leaveTypeId} deleted successfully`);
    res.json({ message: 'Leave type deleted successfully' });
    
  } catch (error) {
    console.error('❌ Error deleting leave type:', error);
    res.status(500).json({ 
      error: 'Failed to delete leave type',
      details: error.message 
    });
  }
}

// ===============================
// 🏢 SYSTEM MANAGEMENT
// ===============================

async function getSystemStats(req, res) {
  try {
    console.log('🔍 Fetching system statistics...');
    
    const currentYear = new Date().getFullYear();
    
    // Get department-wise employee count
    const [deptStats] = await pool.query(
      `SELECT 
         Designation as department,
         COUNT(*) as count
       FROM Employee 
       WHERE Role != 'Admin'
       GROUP BY Designation
       ORDER BY count DESC`
    );
    
    // Get leave type utilization
    const [leaveStats] = await pool.query(
      `SELECT 
         lt.LeaveName,
         SUM(el.LeaveTaken) as totalTaken,
         SUM(el.LeaveTotal) as totalAllocated
       FROM LeaveType lt
       LEFT JOIN Emp_leave el ON lt.LeaveTypeID = el.LeaveTypeID AND el.Year = ?
       WHERE lt.Year = ?
       GROUP BY lt.LeaveTypeID, lt.LeaveName
       ORDER BY totalTaken DESC`,
      [currentYear, currentYear]
    );
    
    // Get monthly leave trends
    const [monthlyTrends] = await pool.query(
      `SELECT 
         MONTH(FromDate) as month,
         COUNT(*) as applications,
         SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) as approved
       FROM Leave_details
       WHERE YEAR(FromDate) = ?
       GROUP BY MONTH(FromDate)
       ORDER BY month`,
      [currentYear]
    );
    
    const stats = {
      departmentStats: deptStats,
      leaveUtilization: leaveStats,
      monthlyTrends: monthlyTrends
    };
    
    console.log('✅ System statistics fetched');
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error fetching system stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system statistics',
      details: error.message 
    });
  }
}

// ===============================
// 🛠️ HELPER FUNCTIONS
// ===============================

async function createDefaultLeaveAllocations(empId) {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get all leave types for current year
    const [leaveTypes] = await pool.query(
      'SELECT LeaveTypeID, MaxDays FROM LeaveType WHERE Year = ?',
      [currentYear]
    );
    
    // Create allocations for each leave type
    for (const leaveType of leaveTypes) {
      await pool.query(
        `INSERT INTO Emp_leave (EmpID, Year, LeaveTypeID, LeaveTotal, LeaveTaken, LeaveBalance) 
         VALUES (?, ?, ?, ?, 0, ?)`,
        [empId, currentYear, leaveType.LeaveTypeID, leaveType.MaxDays, leaveType.MaxDays]
      );
    }
    
    console.log(`✅ Default leave allocations created for employee ${empId}`);
    
  } catch (error) {
    console.error('❌ Error creating default leave allocations:', error);
    throw error;
  }
}

async function createLeaveAllocationsForAllEmployees(leaveTypeId, maxDays, year) {
  try {
    // Get all employees
    const [employees] = await pool.query(
      'SELECT EmpID FROM Employee WHERE Role != "Admin"'
    );
    
    // Create allocations for each employee
    for (const employee of employees) {
      await pool.query(
        `INSERT INTO Emp_leave (EmpID, Year, LeaveTypeID, LeaveTotal, LeaveTaken, LeaveBalance) 
         VALUES (?, ?, ?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE 
         LeaveTotal = VALUES(LeaveTotal),
         LeaveBalance = VALUES(LeaveBalance)`,
        [employee.EmpID, year, leaveTypeId, maxDays, maxDays]
      );
    }
    
    console.log(`✅ Leave allocations created for all employees for leave type ${leaveTypeId}`);
    
  } catch (error) {
    console.error('❌ Error creating leave allocations for all employees:', error);
    throw error;
  }
}

// ===============================
// 🗓️ HOLIDAY MANAGEMENT
// ===============================

async function getAllHolidays(req, res) {
  try {
    const year = req.query.year || new Date().getFullYear();
    
    console.log('🔍 Fetching holidays for year:', year);
    
    const [holidays] = await pool.query(
      `SELECT 
         HolidayID,
         Year,
         HolidayDate,
         HolidayName,
         DayOfWeek
       FROM HolidayCalendar
       WHERE Year = ?
       ORDER BY HolidayDate`,
      [year]
    );
    
    console.log(`✅ Found ${holidays.length} holidays for year ${year}`);
    res.json({
      year: parseInt(year),
      count: holidays.length,
      holidays
    });
    
  } catch (error) {
    console.error('❌ Error fetching holidays:', error);
    res.status(500).json({ 
      error: 'Failed to fetch holidays',
      details: error.message 
    });
  }
}

async function createHoliday(req, res) {
  try {
    const { year, holidayDate, holidayName, dayOfWeek } = req.body;
    
    console.log('🔍 Creating holiday:', { year, holidayDate, holidayName });
    
    if (!holidayDate || !holidayName) {
      return res.status(400).json({ 
        error: 'Missing required fields: holidayDate, holidayName' 
      });
    }
    
    const targetYear = year || new Date().getFullYear();
    const calculatedDayOfWeek = dayOfWeek || new Date(holidayDate).toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if holiday already exists
    const [existing] = await pool.query(
      'SELECT HolidayID FROM HolidayCalendar WHERE Year = ? AND HolidayDate = ?',
      [targetYear, holidayDate]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Holiday already exists for this date' 
      });
    }
    
    // Create holiday
    const [result] = await pool.query(
      'INSERT INTO HolidayCalendar (Year, HolidayDate, HolidayName, DayOfWeek) VALUES (?, ?, ?, ?)',
      [targetYear, holidayDate, holidayName, calculatedDayOfWeek]
    );
    
    const holidayId = result.insertId;
    
    console.log(`✅ Holiday created with ID: ${holidayId}`);
    res.status(201).json({ 
      message: 'Holiday created successfully',
      holidayId: holidayId
    });
    
  } catch (error) {
    console.error('❌ Error creating holiday:', error);
    res.status(500).json({ 
      error: 'Failed to create holiday',
      details: error.message 
    });
  }
}

async function updateHoliday(req, res) {
  try {
    const { holidayId } = req.params;
    const { holidayDate, holidayName, dayOfWeek } = req.body;
    
    console.log('🔍 Updating holiday:', holidayId, { holidayDate, holidayName });
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    
    if (holidayDate) {
      updates.push('HolidayDate = ?');
      values.push(holidayDate);
    }
    if (holidayName) {
      updates.push('HolidayName = ?');
      values.push(holidayName);
    }
    if (dayOfWeek) {
      updates.push('DayOfWeek = ?');
      values.push(dayOfWeek);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(holidayId);
    
    const [result] = await pool.query(
      `UPDATE HolidayCalendar SET ${updates.join(', ')} WHERE HolidayID = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    
    console.log(`✅ Holiday ${holidayId} updated successfully`);
    res.json({ message: 'Holiday updated successfully' });
    
  } catch (error) {
    console.error('❌ Error updating holiday:', error);
    res.status(500).json({ 
      error: 'Failed to update holiday',
      details: error.message 
    });
  }
}

async function deleteHoliday(req, res) {
  try {
    const { holidayId } = req.params;
    
    console.log('🔍 Deleting holiday:', holidayId);
    
    const [result] = await pool.query(
      'DELETE FROM HolidayCalendar WHERE HolidayID = ?',
      [holidayId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    
    console.log(`✅ Holiday ${holidayId} deleted successfully`);
    res.json({ message: 'Holiday deleted successfully' });
    
  } catch (error) {
    console.error('❌ Error deleting holiday:', error);
    res.status(500).json({ 
      error: 'Failed to delete holiday',
      details: error.message 
    });
  }
}

module.exports = {
  getAdminMetrics,
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getSystemStats,
  getAllHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
};