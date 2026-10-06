const { createReq, createRes } = require('./helpers');

// Mock pool for non-transactional functions
const mockPool = { query: jest.fn(), getConnection: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));
const { pool } = require('../../backend/db/db');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController additional coverage tests (more branches)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getLeaveRequests uses approver branch when approver present', async () => {
    const rows = [{
      id: 2,
      type: 'Sick',
      from_date: '2025-12-01',
      to_date: '2025-12-01',
      from_session: 1,
      to_session: 2,
      approver_first_name: 'Alice',
      approver_last_name: 'Approver',
      manager_first_name: 'Mgr',
      manager_last_name: 'One'
    }];

    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 3 } });
    const res = createRes();

    await leaveController.getLeaveRequests(req, res);

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toHaveProperty('approver', 'Alice Approver');
  });

  test('getLeaveTypes logs when some types missing fields (validTypes length differs)', async () => {
    // types contains one valid and one invalid entry -> triggers the validTypes length !== types.length branch
    const types = [ { LeaveTypeID: 1, LeaveName: 'Annual', MaxDays: 20, Year: 2025 }, { LeaveTypeID: 2 } ];
    pool.query.mockResolvedValueOnce([types]);

    const req = createReq();
    const res = createRes();

    await leaveController.getLeaveTypes(req, res);

    // Should return only the valid type
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(1);
    expect(res.data[0]).toHaveProperty('LeaveTypeID', 1);
  });

  test('getTeamLeaveRequests handles DB error (catch branch)', async () => {
    pool.query.mockRejectedValueOnce(new Error('db boom'));

    const req = createReq({}, { user: { id: 5 } });
    const res = createRes();

    await leaveController.getTeamLeaveRequests(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
  });

  test('updateLeaveStatus returns 400 when approving with insufficient balance (rollback path)', async () => {
    // Prepare connection that will return a leaveDetails row with insufficient balance
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    // leaveDetails query returns a pending leave with small balance
    const leaveRow = [{
      LeaveAppID: 100,
      EmpLeaveID: 400,
      LeaveBalance: 0.5,
      LeaveTaken: 0,
      LeaveTypeID: 7,
      FromDate: '2025-12-01',
      ToDate: '2025-12-03',
      FromSession: 1,
      ToSession: 2,
      FirstName: 'Low',
      LastName: 'Balance',
      Email: 'low@example.com',
      LeaveName: 'Annual',
      ManagerFirstName: 'Mgr',
      ManagerLastName: 'One',
      ManagerEmail: 'mgr@example.com',
      MaxDays: 20
    }];

    pool.getConnection.mockResolvedValueOnce(connection);
    connection.query.mockResolvedValueOnce([leaveRow]);

    const req = createReq({}, { params: { leaveId: 100 }, user: { id: 9 } });
    // body: approve
    req.body = { status: 'Approved' };
    const res = createRes();

    await leaveController.updateLeaveStatus(req, res);

    expect(res.statusCode).toBe(400);
    expect(connection.rollback).toHaveBeenCalled();
  });

  test('cancelApprovedLeave restores balance when EmpLeaveID present', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    const leaveRow = [{
      LeaveAppID: 200,
      EmpLeaveID: 500,
      LeaveBalance: 2,
      LeaveTaken: 3,
      FromDate: '2025-12-01',
      ToDate: '2025-12-02',
      FromSession: 1,
      ToSession: 1,
      FirstName: 'Restore',
      LastName: 'Test',
      Email: 'restore@example.com',
      LeaveName: 'Sick'
    }];

    pool.getConnection.mockResolvedValueOnce(connection);
    connection.query.mockResolvedValueOnce([leaveRow]); // select leaveDetails
    connection.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update Leave_details
    connection.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update Emp_leave

    const req = createReq({}, { params: { leaveId: 200 }, user: { id: 10 } });
    req.body = { reason: 'Cancelled' };
    const res = createRes();

    await leaveController.cancelApprovedLeave(req, res);

    expect(res.statusCode).toBe(200);
    expect(connection.commit).toHaveBeenCalled();
    expect(res.data).toHaveProperty('restoredDays');
  });
});
