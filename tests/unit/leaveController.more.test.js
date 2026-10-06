const { createReq, createRes } = require('./helpers');

// Mock the DB pool used by the controller
const mockGetConnection = jest.fn();
jest.mock('../../backend/db/db', () => ({
  pool: { getConnection: (...args) => mockGetConnection(...args), query: jest.fn() }
}));
const { pool } = require('../../backend/db/db');

// Mock email service so notifications don't actually run
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApplication: jest.fn(async () => true),
  notifyLeaveApproval: jest.fn(async () => true),
  notifyLeaveRejection: jest.fn(async () => true)
}));
const emailService = require('../../backend/src/services/emailService');

const ctrl = require('../../backend/src/controllers/leaveController');

describe('leaveController additional unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('applyLeave returns 400 when requestedDays <= 0 (invalid range)', async () => {
    const req = createReq({ leaveTypeId: 1, fromDate: '2025-12-10', toDate: '2025-12-09', fromSession: 1, toSession: 1, reason: 'x' }, { user: { id: 1 } });
    const res = createRes();

    await ctrl.applyLeave(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data).toHaveProperty('message', 'Invalid date range or sessions selected.');
  });

  test('applyLeave rolls back and returns 400 for invalid leave type', async () => {
    // prepare a fake connection whose first query returns no leave type rows
    const conn = {
      beginTransaction: jest.fn(async () => {}),
      query: jest.fn()
        .mockResolvedValueOnce([[]]) // leaveTypeRows -> empty
      ,
      commit: jest.fn(async () => {}),
      rollback: jest.fn(async () => {}),
      release: jest.fn(() => {})
    };
    mockGetConnection.mockResolvedValue(conn);

    const req = createReq({ leaveTypeId: 999, fromDate: '2025-12-01', toDate: '2025-12-02', fromSession: 1, toSession: 1, reason: 'x' }, { user: { id: 2 } });
    const res = createRes();

    await ctrl.applyLeave(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.data).toHaveProperty('message', 'Invalid leave type selected.');
  });

  test('applyLeave returns 400 when Insufficient leave balance', async () => {
    const conn = {
      beginTransaction: jest.fn(async () => {}),
      query: jest.fn()
        // 1. leaveTypeRows
        .mockResolvedValueOnce([[{ LeaveTypeID: 2, MaxDays: 5 }]])
        // 2. balanceRows (exists with low balance)
        .mockResolvedValueOnce([[{ LeaveBalance: 0 }]]),
      commit: jest.fn(async () => {}),
      rollback: jest.fn(async () => {}),
      release: jest.fn(() => {})
    };
    mockGetConnection.mockResolvedValue(conn);

    // Request 1 full day -> but balance 0
    const req = createReq({ leaveTypeId: 2, fromDate: '2025-12-01', toDate: '2025-12-01', fromSession: 1, toSession: 2, reason: 'x' }, { user: { id: 3 } });
    const res = createRes();

    await ctrl.applyLeave(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.data).toHaveProperty('message');
    expect(res.data.message).toMatch(/Insufficient leave balance/);
    expect(res.data).toHaveProperty('requestedDays');
    expect(res.data).toHaveProperty('availableBalance');
  });

  test('updateLeaveStatus returns 400 when approving and insufficient balance', async () => {
    const leaveRow = [{
      LeaveAppID: 10,
      EmpID: 50,
      LeaveTypeID: 3,
      FromDate: '2025-12-01',
      ToDate: '2025-12-02',
      FromSession: 1,
      ToSession: 1,
      LeaveBalance: 0.5,
      EmpLeaveID: 999,
      LeaveTaken: 0,
      LeaveName: 'Casual Leave',
      FirstName: 'Test',
      LastName: 'User'
    }];

    const conn = {
      beginTransaction: jest.fn(async () => {}),
      query: jest.fn()
        // 1. select leaveDetails -> return in the expected shape ([rows])
        .mockResolvedValueOnce([leaveRow])
      ,
      commit: jest.fn(async () => {}),
      rollback: jest.fn(async () => {}),
      release: jest.fn(() => {})
    };
    mockGetConnection.mockResolvedValue(conn);

    const req = createReq({}, { params: { leaveId: '10' }, user: { id: 99 } });
    req.body = { status: 'Approved' };
    const res = createRes();

    await ctrl.updateLeaveStatus(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.data).toHaveProperty('message');
    expect(res.data.message).toMatch(/Insufficient leave balance/);
  });

  test('cancelApprovedLeave returns 404 when no approved leave found', async () => {
    const conn = {
      beginTransaction: jest.fn(async () => {}),
      query: jest.fn().mockResolvedValueOnce([[]]),
      commit: jest.fn(async () => {}),
      rollback: jest.fn(async () => {}),
      release: jest.fn(() => {})
    };
    mockGetConnection.mockResolvedValue(conn);

    const req = createReq({}, { params: { leaveId: '9999' }, user: { id: 10 } });
    const res = createRes();

    await ctrl.cancelApprovedLeave(req, res);

    expect(conn.rollback).toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(res.data).toHaveProperty('message', 'Approved leave request not found.');
  });

  test('updateLeaveStatus approves successfully and sends approval email', async () => {
    const leaveRow = [{
      LeaveAppID: 20,
      EmpID: 60,
      LeaveTypeID: 4,
      FromDate: '2025-12-01',
      ToDate: '2025-12-01',
      FromSession: 1,
      ToSession: 1,
      LeaveBalance: 5,
      EmpLeaveID: 200,
      LeaveTaken: 0,
      LeaveName: 'Annual',
      FirstName: 'Approve',
      LastName: 'Me',
      ManagerFirstName: 'Mgr',
      ManagerLastName: 'One',
      ManagerEmail: 'mgr@example.com',
      Email: 'emp@example.com'
    }];

    const conn = {
      beginTransaction: jest.fn(async () => {}),
      query: jest.fn()
        // 1. select leaveDetails
        .mockResolvedValueOnce([leaveRow])
        // 2. UPDATE Leave_details
        .mockResolvedValueOnce([{}])
        // 3. UPDATE Emp_leave
        .mockResolvedValueOnce([{}])
      ,
      commit: jest.fn(async () => {}),
      rollback: jest.fn(async () => {}),
      release: jest.fn(() => {})
    };
    mockGetConnection.mockResolvedValue(conn);

    const req = createReq({}, { params: { leaveId: '20' }, user: { id: 1 } });
    req.body = { status: 'Approved' };
    const res = createRes();

    await ctrl.updateLeaveStatus(req, res);

    expect(conn.commit).toHaveBeenCalled();
    expect(emailService.notifyLeaveApproval).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('message');
    expect(res.data.message).toMatch(/successfully/);
  });

  test('updateLeaveStatus rejects and sends rejection email', async () => {
    const leaveRow = [{
      LeaveAppID: 21,
      EmpID: 61,
      LeaveTypeID: 5,
      FromDate: '2025-12-05',
      ToDate: '2025-12-06',
      FromSession: 1,
      ToSession: 1,
      LeaveBalance: 10,
      EmpLeaveID: 300,
      LeaveTaken: 0,
      LeaveName: 'Sick',
      FirstName: 'Reject',
      LastName: 'Me',
      ManagerFirstName: 'Mgr',
      ManagerLastName: 'Two',
      ManagerEmail: 'mgr2@example.com',
      Email: 'emp2@example.com'
    }];

    const conn = {
      beginTransaction: jest.fn(async () => {}),
      query: jest.fn()
        // 1. select leaveDetails
        .mockResolvedValueOnce([leaveRow])
        // 2. UPDATE Leave_details
        .mockResolvedValueOnce([{}])
      ,
      commit: jest.fn(async () => {}),
      rollback: jest.fn(async () => {}),
      release: jest.fn(() => {})
    };
    mockGetConnection.mockResolvedValue(conn);

    const req = createReq({}, { params: { leaveId: '21' }, user: { id: 2 } });
    req.body = { status: 'Rejected', remarks: 'Not valid' };
    const res = createRes();

    await ctrl.updateLeaveStatus(req, res);

    expect(conn.commit).toHaveBeenCalled();
    expect(emailService.notifyLeaveRejection).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('message');
  });

  test('cancelApprovedLeave restores balance successfully', async () => {
    const leaveRow = [{
      LeaveAppID: 30,
      EmpID: 70,
      LeaveTypeID: 6,
      FromDate: '2025-12-10',
      ToDate: '2025-12-11',
      FromSession: 1,
      ToSession: 1,
      LeaveBalance: 2,
      EmpLeaveID: 400,
      LeaveTaken: 2,
      LeaveName: 'Comp',
      FirstName: 'Cancel',
      LastName: 'Me'
    }];

    const conn = {
      beginTransaction: jest.fn(async () => {}),
      query: jest.fn()
        // 1. select approved leave
        .mockResolvedValueOnce([leaveRow])
        // 2. UPDATE Leave_details
        .mockResolvedValueOnce([{}])
        // 3. UPDATE Emp_leave
        .mockResolvedValueOnce([{}])
      ,
      commit: jest.fn(async () => {}),
      rollback: jest.fn(async () => {}),
      release: jest.fn(() => {})
    };
    mockGetConnection.mockResolvedValue(conn);

    const req = createReq({ reason: 'Changed plans' }, { params: { leaveId: '30' }, user: { id: 5 } });
    const res = createRes();

    await ctrl.cancelApprovedLeave(req, res);

    expect(conn.commit).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('restoredDays');
  });
});
