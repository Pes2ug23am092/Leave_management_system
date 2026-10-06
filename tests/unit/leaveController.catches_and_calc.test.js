const { createReq, createRes } = require('./helpers');

// Mock DB and email/audit modules
jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApplication: jest.fn().mockResolvedValue(undefined),
  notifyLeaveApproval: jest.fn().mockResolvedValue(undefined),
  notifyLeaveRejection: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));

const { pool } = require('../../backend/db/db');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController - calculateDays and catch branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calculateDays handles PM start and AM end correctly (both half-day adjustments)', () => {
    const days = leaveController.calculateDays('2025-12-01', '2025-12-02', 2, 1);
    // Start in PM (-0.5) and end in AM (-0.5) over two days: 2 days - 1.0 = 1
    expect(days).toBe(1);
  });

  test('calculateDays returns 0.5 for same day different sessions', () => {
    const days = leaveController.calculateDays('2025-12-01', '2025-12-01', 2, 1);
    expect(days).toBe(0.5);
  });

  test('getLeaveBalances returns 500 when DB throws', async () => {
    pool.query.mockRejectedValueOnce(new Error('boom'));
    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await leaveController.getLeaveBalances(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch leave balances' });
  });

  test('debugEmpLeave returns 500 when DB throws', async () => {
    pool.query.mockRejectedValueOnce(new Error('debug fail'));
    const req = createReq({}, { params: { empId: 9 } });
    const res = createRes();

    await leaveController.debugEmpLeave(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch Emp_leave rows' });
  });

  test('getLeaveRequests returns 500 when DB throws', async () => {
    pool.query.mockRejectedValueOnce(new Error('db fail'));
    const req = createReq({}, { user: { id: 5 } });
    const res = createRes();

    await leaveController.getLeaveRequests(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch leave requests' });
  });

  test('getTeamLeaveRequests returns 500 when DB throws', async () => {
    pool.query.mockRejectedValueOnce(new Error('team fail'));
    const req = createReq({}, { user: { id: 7 } });
    const res = createRes();

    await leaveController.getTeamLeaveRequests(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to fetch team leave requests' }));
  });

  test('getLeaveTypes handles non-array response from DB', async () => {
    pool.query.mockResolvedValueOnce([null]); // types is not an array
    const req = createReq();
    const res = createRes();

    await leaveController.getLeaveTypes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Data format error' });
  });

  test('applyLeave rollback and error path when connection.query throws after beginTransaction', async () => {
    // Mock a connection that begins transaction then throws
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockRejectedValueOnce(new Error('tx-fail')),
      commit: jest.fn(),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined)
    };
    pool.getConnection.mockResolvedValue(connection);

    const body = { leaveTypeId: 9, fromDate: '2025-12-01', fromSession: 1, toDate: '2025-12-02', toSession: 2, reason: 'x' };
    const req = createReq(body, { user: { id: 33 } });
    const res = createRes();

    await leaveController.applyLeave(req, res);

    // Should have attempted rollback and returned 500
    expect(connection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error during leave submission' });
  });
});
