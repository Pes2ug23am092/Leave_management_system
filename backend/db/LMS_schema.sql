-- ======================================
-- DROP AND RECREATE DATABASE
-- ======================================
DROP DATABASE IF EXISTS lms;
CREATE DATABASE lms;
USE lms;

-- ======================================
-- TABLE: LeaveType
-- ======================================
CREATE TABLE LeaveType (
    LeaveTypeID INT PRIMARY KEY AUTO_INCREMENT,
    LeaveName VARCHAR(50) NOT NULL,        
    MaxDays INT NOT NULL,                  
    Year INT NOT NULL                      
);

-- ======================================
-- TABLE: Employee
-- ======================================
CREATE TABLE Employee (
    EmpID INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Gender CHAR(1),
    DOB DATE,
    Designation VARCHAR(100),
    ManagerID INT,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role ENUM('Employee','Manager','Admin') DEFAULT 'Employee',
    FOREIGN KEY (ManagerID) REFERENCES Employee(EmpID)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ======================================
-- TABLE: Emp_leave
-- ======================================
CREATE TABLE Emp_leave (
    EmpLeaveID INT PRIMARY KEY AUTO_INCREMENT,
    EmpID INT NOT NULL,
    Year INT NOT NULL,
    LeaveTypeID INT NOT NULL,
    LeaveTotal INT NOT NULL,
    LeaveTaken INT DEFAULT 0,
    LeaveBalance INT NOT NULL,
    FOREIGN KEY (EmpID) REFERENCES Employee(EmpID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (LeaveTypeID) REFERENCES LeaveType(LeaveTypeID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (EmpID, Year, LeaveTypeID)
);

-- ======================================
-- TABLE: Leave_details (✅ updated with CancellationStatus)
-- ======================================
CREATE TABLE Leave_details (
    LeaveAppID INT PRIMARY KEY AUTO_INCREMENT,
    EmpID INT NOT NULL,
    LeaveTypeID INT NOT NULL,
    FromDate DATE NOT NULL,
    FromSession TINYINT DEFAULT 1,         
    ToDate DATE NOT NULL,
    ToSession TINYINT DEFAULT 2,
    ApplyDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Reason VARCHAR(255),
    Status ENUM('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
    ApprovedBy INT,
    ApprovedDate DATETIME,
    CancelledDate DATETIME,                
    RejectionReason VARCHAR(255),
    CancellationStatus ENUM('Requested','Approved','Rejected') DEFAULT NULL,  -- ✅ NEW FIELD
    FOREIGN KEY (EmpID) REFERENCES Employee(EmpID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (LeaveTypeID) REFERENCES LeaveType(LeaveTypeID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ApprovedBy) REFERENCES Employee(EmpID)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ======================================
-- TABLE: HolidayCalendar
-- ======================================
CREATE TABLE HolidayCalendar (
    HolidayID INT PRIMARY KEY AUTO_INCREMENT,
    Year SMALLINT NOT NULL,
    HolidayDate DATE NOT NULL,
    HolidayName VARCHAR(100) NOT NULL,
    DayOfWeek VARCHAR(10),
    UNIQUE (Year, HolidayDate)
);

-- ======================================
-- TABLE: auditlog
-- ======================================
CREATE TABLE auditlog (
    LogID INT PRIMARY KEY AUTO_INCREMENT,
    EmpID INT DEFAULT NULL,
    Action VARCHAR(50) DEFAULT NULL,
    Action_status TINYINT NOT NULL,
    ActionTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (EmpID) REFERENCES Employee(EmpID)
        ON DELETE SET NULL ON UPDATE CASCADE
);
