-- Add cancellation request table for tracking leave cancellation requests
CREATE TABLE IF NOT EXISTS leave_cancellation_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leave_request_id INT NOT NULL,
    employee_id INT NOT NULL,
    cancellation_reason TEXT,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    manager_response_date TIMESTAMP NULL,
    manager_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (leave_request_id) REFERENCES Leave_details(LeaveAppID) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Employee(EmpID) ON DELETE CASCADE
);

-- Update Leave_details table to include cancellation request status
ALTER TABLE Leave_details 
MODIFY COLUMN Status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled', 'Cancellation Requested') DEFAULT 'Pending';

-- Add indexes for better performance
CREATE INDEX idx_leave_cancellation_employee ON leave_cancellation_requests(employee_id);
CREATE INDEX idx_leave_cancellation_leave_request ON leave_cancellation_requests(leave_request_id);
CREATE INDEX idx_leave_cancellation_status ON leave_cancellation_requests(status);