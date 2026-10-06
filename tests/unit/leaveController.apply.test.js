// Mocks for DB and services before requiring the controller
jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
jest.mock('../../backend/src/services/emailService', () => ({ notifyLeaveApplication: jest.fn() }));
jest.mock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn() }));

const { createReq, createRes } = require('./helpers');
const { pool } = require('../../backend/db/db');
const emailService = require('../../backend/src/services/emailService');
const { applyLeave } = require('../../backend/src/controllers/leaveController');

describe('applyLeave', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('success path: creates Emp_leave and Leave_details and sends email', async () => {
    const fakeConnection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      query: jest.fn()
        // 1. leaveTypeRows
        .mockResolvedValueOnce([[{ LeaveTypeID: 1, MaxDays: 10 }]])
        // 2. balanceRows empty
        .mockResolvedValueOnce([[]])
        // 3. insertResult for Emp_leave
        .mockResolvedValueOnce([{ insertId: 111 }])
        // 4. empDetails for email and manager
        .mockResolvedValueOnce([[{ FirstName: 'Test', LastName: 'User', ManagerEmail: 'mgr@example.com', ManagerFirstName: 'M', ManagerLastName: 'E', Email: 'emp@example.com', LeaveName: 'Annual' }]])
        // 5. insertResult for Leave_details
        .mockResolvedValueOnce([{ insertId: 222 }]),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn()
    };

    pool.getConnection.mockResolvedValue(fakeConnection);

    // empDetails query is executed on connection.query? In applyLeave, empDetails is queried after balance checks
    // But we returned enough mocked responses for sequence above; ensure email and logAction resolve
    emailService.notifyLeaveApplication.mockResolvedValue();

    const req = createReq({
      leaveTypeId: 1,
      fromDate: '2025-12-01',
      fromSession: 1,
      toDate: '2025-12-02',
      toSession: 1,
      reason: 'Family'
    }, { user: { id: 42 } });

    const res = createRes();

    await applyLeave(req, res);

    expect(fakeConnection.beginTransaction).toHaveBeenCalled();
    expect(fakeConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.data).toBeDefined();
    expect(emailService.notifyLeaveApplication).toHaveBeenCalled();
  });

  test('invalid leave type: rollbacks and returns 400', async () => {
    const fakeConnection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      query: jest.fn()
        // 1. leaveTypeRows empty
        .mockResolvedValueOnce([[]]),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn()
    };

    pool.getConnection.mockResolvedValue(fakeConnection);

    const req = createReq({
      leaveTypeId: 999,
      fromDate: '2025-12-01',
      fromSession: 1,
      toDate: '2025-12-01',
      toSession: 1,
      reason: 'Invalid'
    }, { user: { id: 42 } });

    const res = createRes();

    await applyLeave(req, res);

    expect(fakeConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.data).toMatchObject({ message: 'Invalid leave type selected.' });
  });
});
