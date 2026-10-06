USE lms;

-- ======================================
-- LeaveType sample data
-- ======================================
INSERT INTO LeaveType (LeaveName, MaxDays, Year) VALUES
('Earned Leave', 12, 2024),
('Sick Leave', 12, 2024),
('Earned Leave', 12, 2025),
('Sick Leave', 12, 2025),
('Bereavement Leave', 5, 2025),
('Maternity Leave', 90, 2025),
('Paternity Leave', 7, 2025),
('Loss of Pay', 0, 2025);

-- ======================================
-- Employee sample data (with bcrypt hashed passwords)
-- Note: All passwords are 'password123' for testing
-- ======================================
INSERT INTO Employee (FirstName, LastName, Gender, DOB, Designation, ManagerID, Email, PasswordHash, Role) VALUES
-- Admin (Top Level)
('Amit', 'Sharma', 'M', '1980-02-15', 'CEO', NULL, 'amit.sharma@lms.com', '$2b$10$t2VNajlT3kGo4mfCZCbfju/GCmvINPYNt9hjoiOd3oHXcOekZBOVK', 'Admin'),

-- Managers (Report to CEO)
('Priya', 'Iyer', 'F', '1985-06-20', 'Engineering Manager', 1, 'priya.iyer@lms.com', '$2b$10$xcNyfcxmvrojC/WK6phPNuCqVRr0259c8M4m3gVRns6fi64eNulZi', 'Manager'),
('Rahul', 'Verma', 'M', '1990-09-12', 'HR Manager', 1, 'rahul.verma@lms.com', '$2b$10$VybB5xEp0zWNDEJ8GXDy/eip4XmYz7bQWvQVwo2etX0xUAGv1D5uG', 'Manager'),
('Sneha', 'Rao', 'F', '1992-11-25', 'Finance Manager', 1, 'sneha.rao@lms.com', '$2b$10$fbgsB8f6IhiwyKVKE0BXUe9/gOFy8LhPi0171tr99Hjzdlca9Dvve', 'Manager'),

-- Engineering Team (Report to Priya - EmpID 2)
('Karan', 'Patel', 'M', '1988-05-10', 'Senior Developer', 2, 'karan.patel@lms.com', '$2b$10$7CiA/hi7GpckE5kqV7Id1eRmu3SrwUls26eDFKDOIXY6I5HviNIBS', 'Employee'),
('Neha', 'Kapoor', 'F', '1991-07-17', 'Senior Developer', 2, 'neha.kapoor@lms.com', '$2b$10$5urG7QkosdR3P4RHxWWoguBMMmlXO7IEWAh/EOPunsvZM3I68FyB2', 'Employee'),
('Ankit', 'Gupta', 'M', '1993-03-09', 'Software Engineer', 2, 'ankit.gupta@lms.com', '$2b$10$gKqrPzMKJ/gK/6EkeQ7jOeYEzJjhoCRGu2MfR/qRrmpn.R1jot9nW', 'Employee'),
('Rohit', 'Mehta', 'M', '1995-08-30', 'Software Engineer', 2, 'rohit.mehta@lms.com', '$2b$10$0ss/wtJN3NOJN3iEteJlWufiopA/0okw/8R3YVu3jsaClPm4RmXne', 'Employee'),
('Pooja', 'Singh', 'F', '1996-12-05', 'Junior Developer', 2, 'pooja.singh@lms.com', '$2b$10$kBTVC7r8AfRE3nLlYA2w7O0ceMjCq5NXGXhZjO2UbVnP0obhL9Kpq', 'Employee'),
('Vikram', 'Reddy', 'M', '1994-10-18', 'QA Engineer', 2, 'vikram.reddy@lms.com', '$2b$10$I1o9dzxbSlwlJ17LIC3iaeDjhzvzOwxjYCttRLmcX6CHI3kfdvck.', 'Employee'),

-- HR Team (Report to Rahul - EmpID 3)
('Divya', 'Menon', 'F', '1989-01-25', 'HR Executive', 3, 'divya.menon@lms.com', '$2b$10$K54Qgs87K9gIrx60CgFlVuGt4xnCATBMPnthQpZXTgzuQ0jf5rD4y', 'Employee'),
('Ayesha', 'Khan', 'F', '1997-04-12', 'HR Recruiter', 3, 'ayesha.khan@lms.com', '$2b$10$BOG.X.yNy7CMLyHnJBo9yuak2fYeTh9tg2MTZ.oK0XRIO6Ta8NWaG', 'Employee'),
('Ramesh', 'Yadav', 'M', '1987-03-11', 'Office Admin', 3, 'ramesh.yadav@lms.com', '$2b$10$Fkr..gUqktlPvGxvP3zMOOA7ooC1NwL0E43bpwuPOBuRuDTEd4o5K', 'Employee'),

-- Finance Team (Report to Sneha - EmpID 4)
('Siddharth', 'Nair', 'M', '1992-09-09', 'Senior Accountant', 4, 'siddharth.nair@lms.com', '$2b$10$cwD1OKtbB1BNfQrTLKHjVef7dVToO1gwlPkJ4IJgDifbjwS6iiiKe', 'Employee'),
('Meena', 'Joshi', 'F', '1995-07-22', 'Junior Accountant', 4, 'meena.joshi@lms.com', '$2b$10$YgvOFNBu7SEh4dZLocVkAeDiJG2vVucjsp2WOMLzYDicji8FVJmNO', 'Employee'),
('Sunita', 'Das', 'F', '1991-06-02', 'Finance Assistant', 4, 'sunita.das@lms.com', '$2b$10$KmT97en.nBQE/zSaIooFmOTmOYO8jUfIoqJwT8HuRvxjDCixE3f5S', 'Employee');

-- ======================================
-- Emp_leave sample data
-- Initialize leave balances for 2025
-- ======================================
INSERT INTO Emp_leave (EmpID, Year, LeaveTypeID, LeaveTotal, LeaveTaken, LeaveBalance) VALUES
-- Admin (Amit - EmpID 1)
(1, 2025, 3, 12, 2, 10),  -- Earned Leave
(1, 2025, 4, 12, 1, 11),  -- Sick Leave

-- Engineering Manager (Priya - EmpID 2)
(2, 2025, 3, 12, 3, 9),   -- Earned Leave
(2, 2025, 4, 12, 0, 12),  -- Sick Leave

-- HR Manager (Rahul - EmpID 3)
(3, 2025, 3, 12, 5, 7),   -- Earned Leave
(3, 2025, 4, 12, 2, 10),  -- Sick Leave

-- Finance Manager (Sneha - EmpID 4)
(4, 2025, 3, 12, 4, 8),   -- Earned Leave
(4, 2025, 4, 12, 2, 10),  -- Sick Leave

-- Engineering Team (Report to Priya)
(5, 2025, 3, 12, 4, 8),   -- Karan - Earned Leave
(5, 2025, 4, 12, 1, 11),  -- Karan - Sick Leave
(6, 2025, 3, 12, 2, 10),  -- Neha - Earned Leave
(6, 2025, 4, 12, 0, 12),  -- Neha - Sick Leave
(7, 2025, 3, 12, 3, 9),   -- Ankit - Earned Leave
(7, 2025, 4, 12, 2, 10),  -- Ankit - Sick Leave
(8, 2025, 3, 12, 1, 11),  -- Rohit - Earned Leave
(8, 2025, 4, 12, 1, 11),  -- Rohit - Sick Leave
(9, 2025, 3, 12, 0, 12),  -- Pooja - Earned Leave
(9, 2025, 4, 12, 1, 11),  -- Pooja - Sick Leave
(10, 2025, 3, 12, 2, 10), -- Vikram - Earned Leave
(10, 2025, 4, 12, 0, 12), -- Vikram - Sick Leave

-- HR Team (Report to Rahul)
(11, 2025, 3, 12, 6, 6),  -- Divya - Earned Leave
(11, 2025, 4, 12, 2, 10), -- Divya - Sick Leave
(12, 2025, 3, 12, 1, 11), -- Ayesha - Earned Leave
(12, 2025, 4, 12, 0, 12), -- Ayesha - Sick Leave
(13, 2025, 3, 12, 3, 9),  -- Ramesh - Earned Leave
(13, 2025, 4, 12, 1, 11), -- Ramesh - Sick Leave

-- Finance Team (Report to Sneha)
(14, 2025, 3, 12, 5, 7),  -- Siddharth - Earned Leave
(14, 2025, 4, 12, 1, 11), -- Siddharth - Sick Leave
(15, 2025, 3, 12, 2, 10), -- Meena - Earned Leave
(15, 2025, 4, 12, 1, 11), -- Meena - Sick Leave
(16, 2025, 3, 12, 3, 9),  -- Sunita - Earned Leave
(16, 2025, 4, 12, 2, 10); -- Sunita - Sick Leave

-- ======================================
-- Leave_details sample data
-- Includes pending, approved, and rejected requests for demonstration
-- ======================================
INSERT INTO Leave_details 
(EmpID, LeaveTypeID, FromDate, FromSession, ToDate, ToSession, Reason, Status, ApprovedBy, ApprovedDate, RejectionReason, CancelledDate, CancellationStatus) 
VALUES
-- Previously Approved Leaves
(5, 3, '2025-01-10', 1, '2025-01-12', 2, 'Family vacation', 'Approved', 2, '2025-01-08 14:30:00', NULL, NULL, NULL),
(7, 4, '2025-02-15', 1, '2025-02-16', 2, 'Fever and cold', 'Approved', 2, '2025-02-14 09:15:00', NULL, NULL, NULL),
(11, 3, '2025-03-20', 1, '2025-03-22', 2, 'Personal work', 'Approved', 3, '2025-03-18 16:45:00', NULL, NULL, NULL),
(14, 3, '2025-04-05', 1, '2025-04-07', 2, 'Wedding to attend', 'Approved', 4, '2025-04-03 11:20:00', NULL, NULL, NULL),

-- Rejected Leave (for demonstration)
(11, 3, '2025-06-10', 1, '2025-06-15', 2, 'Extended vacation request', 'Rejected', 3, '2025-06-08 10:00:00', 'Project deadline approaching, cannot approve extended leave', NULL, NULL),

-- PENDING Leaves for Priya (Engineering Manager) to approve
(6, 3, '2025-11-15', 1, '2025-11-17', 2, 'Wedding ceremony in hometown', 'Pending', NULL, NULL, NULL, NULL, NULL),
(7, 3, '2025-11-20', 1, '2025-11-21', 2, 'Personal emergency', 'Pending', NULL, NULL, NULL, NULL, NULL),
(8, 4, '2025-11-10', 1, '2025-11-10', 2, 'Medical checkup appointment', 'Pending', NULL, NULL, NULL, NULL, NULL),
(9, 3, '2025-12-23', 1, '2025-12-27', 2, 'Christmas vacation with family', 'Pending', NULL, NULL, NULL, NULL, NULL),
(10, 3, '2025-11-12', 1, '2025-11-13', 2, 'Attending conference in another city', 'Pending', NULL, NULL, NULL, NULL, NULL),

-- PENDING Leaves for Rahul (HR Manager) to approve
(12, 3, '2025-11-18', 1, '2025-11-19', 2, 'Sister wedding', 'Pending', NULL, NULL, NULL, NULL, NULL),
(13, 4, '2025-11-08', 1, '2025-11-08', 2, 'Dental appointment', 'Pending', NULL, NULL, NULL, NULL, NULL),

-- PENDING Leaves for Sneha (Finance Manager) to approve
(15, 3, '2025-11-25', 1, '2025-11-26', 2, 'Family function', 'Pending', NULL, NULL, NULL, NULL, NULL),
(16, 4, '2025-11-14', 1, '2025-11-14', 2, 'Health checkup', 'Pending', NULL, NULL, NULL, NULL, NULL);


-- ======================================
-- auditlog sample data
-- ======================================
INSERT INTO auditlog (EmpID, Action, Action_status, ActionTime) VALUES
(2, 'Login', 1, '2025-01-10 08:55:00'),
(2, 'Logout', 1, '2025-01-10 17:45:00'),
(3, 'Login', 1, '2025-01-10 09:10:00'),
(3, 'Logout', 1, '2025-01-10 18:05:00'),
(5, 'Login', 1, '2025-01-11 08:50:00'),
(5, 'Logout', 1, '2025-01-11 17:30:00'),
(6, 'Login', 1, '2025-01-11 09:00:00'),
(6, 'Logout', 1, '2025-01-11 18:10:00');
