const { createReq, createRes } = require('./helpers');

// Create a mock pool with query and getConnection used by the controller
const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn()
};

jest.mock('../../backend/db/db', () => ({ pool: mockPool }));
const { pool } = require('../../backend/db/db');

const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController additional branch tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getLeaveRequests calculates half/full day branches (fromSession=2,toSession=1)', async () => {
    // one request spanning two days with PM start and AM end -> should reduce 0.5 + 0.5
    const rows = [{
      id: 1,
      type: 'Annual',
      from_date: '2025-12-01',
      to_date: '2025-12-02',
      from_session: 2,
      to_session: 1,
      approver_first_name: null,
      approver_last_name: null,
      manager_first_name: null,
      manager_last_name: null
    }];

    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 42 } });
    const res = createRes();

    await leaveController.getLeaveRequests(req, res);

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toHaveProperty('days');
    // 2 calendar days -> 2 - 0.5 - 0.5 = 1
    expect(res.data[0].days).toBe(1);
  });

  test('getLeaveTypes returns empty array when DB returns no types (types.length === 0)', async () => {
    pool.query.mockResolvedValueOnce([[]]); // types === []

    const req = createReq();
    const res = createRes();

    await leaveController.getLeaveTypes(req, res);

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);
  });

  test('debugEmpLeave returns rows and covers dev-only path', async () => {
    const sample = [{ EmpID: 9, LeaveTotal: 10 }];
    pool.query.mockResolvedValueOnce([sample]);

    const req = createReq({}, { params: { empId: 9 } });
    const res = createRes();

    await leaveController.debugEmpLeave(req, res);

    expect(res.data).toEqual(sample);
  });

  test('getLeaveBalances handles DB error and returns 500', async () => {
    pool.query.mockRejectedValueOnce(new Error('query failed'));

    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await leaveController.getLeaveBalances(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
  });

  test('applyLeave returns 400 when leave type is invalid (no leaveTypeRows)', async () => {
    // Prepare a fake connection similar to other tests
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    // pool.getConnection returns our connection
    pool.getConnection.mockResolvedValueOnce(connection);

    // First query: leave type select -> empty
    connection.query.mockResolvedValueOnce([[]]);

    const req = createReq({
      leaveTypeId: 7,
      fromDate: '2025-12-01',
      fromSession: 1,
      toDate: '2025-12-02',
      toSession: 2,
      reason: 'Vacation'
    }, { user: { id: 9 } });

    const res = createRes();

    await leaveController.applyLeave(req, res);

    expect(res.statusCode).toBe(400);
    expect(connection.rollback).toHaveBeenCalled();
  });

  test('applyLeave returns 400 when insufficient balance', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    pool.getConnection.mockResolvedValueOnce(connection);

    const currentYear = new Date().getFullYear();

    // 1) leaveTypeRows found
    connection.query.mockResolvedValueOnce([[{ LeaveTypeID: 7, MaxDays: 10 }]]);
    // 2) balanceRows exist but small balance
    connection.query.mockResolvedValueOnce([[{ LeaveBalance: 1 }]]);

    const req = createReq({
      leaveTypeId: 7,
      fromDate: '2025-12-01',
      fromSession: 1,
      toDate: '2025-12-03',
      toSession: 2,
      reason: 'Long vacation'
    }, { user: { id: 11 } });

    const res = createRes();

    await leaveController.applyLeave(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data).toHaveProperty('message');
    expect(connection.rollback).toHaveBeenCalled();
  });
});
