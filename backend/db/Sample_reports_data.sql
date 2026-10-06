-- Sample data for testing the enhanced reports functionality

-- Add some sample leave types if they don't exist
INSERT IGNORE INTO LeaveType (LeaveName, MaxDays, Year) VALUES
('Annual Leave', 20, 2025),
('Sick Leave', 10, 2025),
('Personal Leave', 5, 2025),
('Emergency Leave', 3, 2025);

-- Add some sample employees with different designations if they don't exist
INSERT IGNORE INTO Employee (EmpID, FirstName, LastName, Designation, ManagerID, Email, PasswordHash, Role) VALUES
(101, 'John', 'Manager', 'Engineering Manager', NULL, 'john.manager@company.com', '$2b$10$hash', 'Manager'),
(102, 'Ankit', 'Gupta', 'Software Developer', 101, 'ankit.gupta@company.com', '$2b$10$hash', 'Employee'),
(103, 'Neha', 'Kapoor', 'QA Engineer', 101, 'neha.kapoor@company.com', '$2b$10$hash', 'Employee'),
(104, 'Priya', 'Iyer', 'Business Analyst', 101, 'priya.iyer@company.com', '$2b$10$hash', 'Employee'),
(105, 'Rahul', 'Singh', 'DevOps Engineer', 101, 'rahul.singh@company.com', '$2b$10$hash', 'Employee');

-- Add some sample leave applications for the last few months
INSERT IGNORE INTO Leave_details (EmpID, LeaveTypeID, FromDate, ToDate, FromSession, ToSession, ApplyDate, Reason, Status, ApprovedBy, ApprovedDate) VALUES
-- Approved leaves
(102, 1, '2025-10-15', '2025-10-17', 1, 2, '2025-10-01 09:00:00', 'Family vacation', 'Approved', 101, '2025-10-02 10:00:00'),
(103, 2, '2025-10-20', '2025-10-22', 1, 2, '2025-10-18 14:00:00', 'Medical appointment', 'Approved', 101, '2025-10-19 09:00:00'),
(104, 1, '2025-11-01', '2025-11-03', 1, 2, '2025-10-25 11:00:00', 'Personal work', 'Approved', 101, '2025-10-26 15:00:00'),
(105, 3, '2025-09-15', '2025-09-16', 1, 2, '2025-09-10 16:00:00', 'House moving', 'Approved', 101, '2025-09-11 10:00:00'),
(102, 2, '2025-11-10', '2025-11-12', 1, 2, '2025-11-05 08:00:00', 'Flu symptoms', 'Approved', 101, '2025-11-05 12:00:00'),

-- Pending leaves
(103, 1, '2025-11-25', '2025-11-29', 1, 2, '2025-11-04 10:00:00', 'Year end vacation', 'Pending', NULL, NULL),
(104, 4, '2025-11-08', '2025-11-08', 1, 2, '2025-11-06 09:00:00', 'Family emergency', 'Pending', NULL, NULL),

-- Rejected leaves
(105, 1, '2025-10-25', '2025-10-30', 1, 2, '2025-10-20 14:00:00', 'Personal vacation', 'Rejected', 101, '2025-10-21 09:00:00');

-- Add some future approved leaves for testing
INSERT IGNORE INTO Leave_details (EmpID, LeaveTypeID, FromDate, ToDate, FromSession, ToSession, ApplyDate, Reason, Status, ApprovedBy, ApprovedDate) VALUES
(102, 1, '2025-12-20', '2025-12-24', 1, 2, '2025-11-01 10:00:00', 'Christmas vacation', 'Approved', 101, '2025-11-02 14:00:00'),
(103, 1, '2025-12-26', '2025-12-30', 1, 2, '2025-11-03 15:00:00', 'New Year break', 'Approved', 101, '2025-11-04 11:00:00');