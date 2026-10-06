const { createReq, createRes } = require('./helpers');

const mockGetConnection = jest.fn();
const mockConn = () => ({ query: jest.fn(), beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() });

jest.mock('../../backend/db/db', () => ({ pool: { getConnection: (...args) => mockGetConnection(...args), query: jest.fn() } }));
jest.mock('../../backend/src/services/emailService', () => ({ notifyLeaveApplication: jest.fn().mockResolvedValue(undefined), notifyLeaveApproval: jest.fn().mockResolvedValue(undefined), notifyLeaveRejection: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));

const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController branch-focused tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('applyLeave returns 400 when insufficient balance (rollback)', async () => {
    const conn = mockConn();

    // leaveTypeRows -> found
    conn.query.mockResolvedValueOnce([[{ LeaveTypeID: 1, MaxDays: 10 }]]);
    // balanceRows -> existing but zero balance
    conn.query.mockResolvedValueOnce([[{ LeaveBalance: 0, EmpLeaveID: 5 }]]);

    mockGetConnection.mockResolvedValue(conn);

    const req = createReq({ leaveTypeId: 1, fromDate: '2025-12-01', toDate: '2025-12-01', fromSession: 1, toSession: 2, reason: 'X' }, { user: { id: 99 } });
    const res = createRes();

    await leaveController.applyLeave(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data).toHaveProperty('message');
    expect(res.data.message).toMatch(/Insufficient leave balance/i);
    expect(conn.rollback).toHaveBeenCalled();
  });

  test('updateLeaveStatus returns 400 when approving with insufficient balance (rollback)', async () => {
    const conn = mockConn();

    // leaveDetails select -> pending leave with EmpLeaveID present but zero balance
    conn.query.mockResolvedValueOnce([[{
      LeaveAppID: 77, EmpLeaveID: 10, LeaveBalance: 0, LeaveTaken: 0, FromDate: '2025-12-01', ToDate: '2025-12-02', FromSession: 1, ToSession: 1,
      FirstName: 'A', LastName: 'B', Email: 'a@b.com', LeaveName: 'Annual', MaxDays: 20
    }]]);
    // update Leave_details (the update happens before the balance check)
    conn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    mockGetConnection.mockResolvedValue(conn);

    const req = createReq({ status: 'Approved' }, { params: { leaveId: 77 }, user: { id: 10 } });
    const res = createRes();

    await leaveController.updateLeaveStatus(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data).toHaveProperty('message');
    expect(res.data.message).toMatch(/Insufficient leave balance/i);
    expect(conn.rollback).toHaveBeenCalled();
  });

  test('cancelApprovedLeave skips balance restore when EmpLeaveID is falsy', async () => {
    const conn = mockConn();

    // leaveDetails select -> approved leave but EmpLeaveID is null
    conn.query.mockResolvedValueOnce([[{
      LeaveAppID: 30, EmpLeaveID: null, LeaveBalance: null, LeaveTaken: null, FromDate: '2025-12-01', ToDate: '2025-12-02', FromSession: 1, ToSession: 1,
      FirstName: 'Cancel', LastName: 'Me', Email: 'emp@example.com', LeaveName: 'Annual'
    }]]);
    // update Leave_details (cancel)
    conn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    mockGetConnection.mockResolvedValue(conn);

    const req = createReq({ reason: 'No longer needed' }, { params: { leaveId: 30 }, user: { id: 5 } });
    const res = createRes();

    await leaveController.cancelApprovedLeave(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('message');
    expect(res.data.message).toMatch(/cancelled successfully/i);
    // Emp_leave update should NOT have been called (only select + update Leave_details)
    expect(conn.query).toHaveBeenCalledTimes(2);
    expect(conn.commit).toHaveBeenCalled();
  });
});
