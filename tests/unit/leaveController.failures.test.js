const { createReq, createRes } = require('./helpers');

// Mock pool for DB interactions
const mockPool = { query: jest.fn(), getConnection: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));
const { pool } = require('../../backend/db/db');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController transactional failure branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('applyLeave returns 500 when pool.getConnection rejects', async () => {
    pool.getConnection.mockRejectedValueOnce(new Error('conn fail'));

    const req = createReq({ leaveTypeId: 1, fromDate: '2025-01-01', fromSession: 1, toDate: '2025-01-01', toSession: 1, reason: 'r' }, { user: { id: 2 } });
    const res = createRes();

    await leaveController.applyLeave(req, res);

    expect(res.statusCode).toBe(500);
  });

  test('applyLeave handles commit throwing and performs rollback', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    // leaveTypeRows
    connection.query.mockResolvedValueOnce([[{ LeaveTypeID: 1, MaxDays: 10 }]]);
    // balanceRows -> none (create new) -> insert Emp_leave result
    connection.query.mockResolvedValueOnce([[]]);
    connection.query.mockResolvedValueOnce([{ insertId: 55 }]);
    // empDetails
    connection.query.mockResolvedValueOnce([[{ FirstName: 'A', LastName: 'B', Email: 'e@e', ManagerEmail: 'm@e', ManagerFirstName: 'M', ManagerLastName: 'G', LeaveName: 'Annual' }]]);
    // insert into Leave_details
    connection.query.mockResolvedValueOnce([{ insertId: 999 }]);

    // Make commit throw
    connection.commit.mockRejectedValueOnce(new Error('commit fail'));

    pool.getConnection.mockResolvedValueOnce(connection);

    const req = createReq({ leaveTypeId: 1, fromDate: '2025-02-01', fromSession: 1, toDate: '2025-02-01', toSession: 1, reason: 'r' }, { user: { id: 3 } });
    const res = createRes();

    await leaveController.applyLeave(req, res);

    // commit threw and catch should rollback
    expect(connection.rollback).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
  });

  test('updateLeaveStatus catches DB error mid-flow and rolls back', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    const leaveRow = [{
      LeaveAppID: 123,
      EmpLeaveID: 10,
      LeaveBalance: 5,
      LeaveTaken: 0,
      FromDate: '2025-10-01',
      ToDate: '2025-10-02',
      FromSession: 1,
      ToSession: 1,
      FirstName: 'A',
      LastName: 'B',
      Email: 'a@b',
      LeaveName: 'Annual',
      ManagerFirstName: 'M',
      ManagerLastName: 'G',
      ManagerEmail: 'm@e',
      MaxDays: 10
    }];

    pool.getConnection.mockResolvedValueOnce(connection);
    // first query returns leaveDetails
    connection.query.mockResolvedValueOnce([leaveRow]);
    // next query (update) will throw
    connection.query.mockRejectedValueOnce(new Error('update fail'));

    const req = createReq({}, { params: { leaveId: 123 }, user: { id: 5 } });
    req.body = { status: 'Approved' };
    const res = createRes();

    await leaveController.updateLeaveStatus(req, res);

    expect(connection.rollback).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
  });

  test('cancelApprovedLeave catches DB error mid-flow and rolls back', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    const leaveRow = [{
      LeaveAppID: 222,
      EmpLeaveID: 333,
      LeaveBalance: 2,
      LeaveTaken: 1,
      FromDate: '2025-11-01',
      ToDate: '2025-11-01',
      FromSession: 1,
      ToSession: 2,
      FirstName: 'X',
      LastName: 'Y',
      Email: 'x@y',
      LeaveName: 'Sick'
    }];

    pool.getConnection.mockResolvedValueOnce(connection);
    connection.query.mockResolvedValueOnce([leaveRow]);
    // update Leave_details ok
    connection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    // update Emp_leave will throw
    connection.query.mockRejectedValueOnce(new Error('emp update fail'));

    const req = createReq({}, { params: { leaveId: 222 }, user: { id: 20 } });
    req.body = { reason: 'nope' };
    const res = createRes();

    await leaveController.cancelApprovedLeave(req, res);

    expect(connection.rollback).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
  });
});
