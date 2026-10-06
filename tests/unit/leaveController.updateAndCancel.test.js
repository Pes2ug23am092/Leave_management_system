const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { getConnection: jest.fn(), query: jest.fn() } }));
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApproval: jest.fn().mockResolvedValue(undefined),
  notifyLeaveRejection: jest.fn().mockResolvedValue(undefined),
  notifyLeaveApplication: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));

const { pool } = require('../../backend/db/db');
const emailService = require('../../backend/src/services/emailService');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController updateLeaveStatus and cancelApprovedLeave branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('updateLeaveStatus approves and creates Emp_leave when missing, then updates balance and sends email', async () => {
    // Prepare request/response
  const req = createReq({ status: 'Approved' }, { params: { leaveId: 77 }, user: { id: 10 } });
    const res = createRes();

    // Mock a DB connection flow
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        // 1. SELECT leaveDetails -> returns one pending leave with no EmpLeaveID
        .mockResolvedValueOnce([[{
          LeaveAppID: 77,
          EmpLeaveID: null,
          LeaveBalance: null,
          LeaveTaken: null,
          LeaveName: 'Annual',
          FromDate: '2025-12-01',
          ToDate: '2025-12-01',
          FromSession: 1,
          ToSession: 2,
          FirstName: 'A', LastName: 'B', Email: 'a@b.com', ManagerFirstName: 'M', ManagerLastName: 'G', ManagerEmail: 'mgr@e.com', MaxDays: 10
        }]])
        // 2. INSERT Emp_leave -> returns insertId
        .mockResolvedValueOnce([{ insertId: 200 }])
        // 3. UPDATE Leave_details -> generic result
        .mockResolvedValueOnce([{}])
        // 4. UPDATE Emp_leave -> generic result
        .mockResolvedValueOnce([{}]),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };

    pool.getConnection.mockResolvedValue(connection);

    await leaveController.updateLeaveStatus(req, res);

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.query).toHaveBeenCalled();
    expect(connection.commit).toHaveBeenCalled();
    expect(emailService.notifyLeaveApproval).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('message');
    expect(payload).toHaveProperty('requestedDays');
  });

  test('cancelApprovedLeave restores balance when EmpLeaveID present', async () => {
  const req = createReq({ reason: 'Cancelled by manager' }, { params: { leaveId: 500 }, user: { id: 12 } });
    const res = createRes();

    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        // 1. SELECT leaveDetails -> returns one approved leave with EmpLeaveID
        .mockResolvedValueOnce([[{
          LeaveAppID: 500,
          EmpLeaveID: 55,
          LeaveBalance: 5,
          LeaveTaken: 2,
          FromDate: '2025-11-01',
          ToDate: '2025-11-01',
          FromSession: 1,
          ToSession: 2,
          FirstName: 'C', LastName: 'D', Email: 'c@d.com', LeaveName: 'Sick'
        }]])
        // 2. UPDATE Leave_details -> generic
        .mockResolvedValueOnce([{}])
        // 3. UPDATE Emp_leave (restore) -> generic
        .mockResolvedValueOnce([{}]),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };

    pool.getConnection.mockResolvedValue(connection);

    await leaveController.cancelApprovedLeave(req, res);

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.query).toHaveBeenCalled();
    expect(connection.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});
