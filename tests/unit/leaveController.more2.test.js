const { createReq, createRes } = require('./helpers');

// Mock pool for transactional and non-transactional paths
const mockGetConnection = jest.fn();
jest.mock('../../backend/db/db', () => ({ pool: { getConnection: (...args) => mockGetConnection(...args), query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApplication: jest.fn(async () => true)
}));

const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController additional branches (debug + apply skip-email)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('debugEmpLeave returns 500 when DB errors', async () => {
    pool.query.mockRejectedValueOnce(new Error('debug fail'));

    const req = createReq({}, { params: { empId: 999 } });
    const res = createRes();

    await leaveController.debugEmpLeave(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error', 'Failed to fetch Emp_leave rows');
  });

  test('applyLeave succeeds and skips email when manager email missing', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    // 1. leaveTypeRows exists
    connection.query.mockResolvedValueOnce([[{ LeaveTypeID: 8, MaxDays: 15 }]]);
    // 2. balanceRows empty -> create new
    connection.query.mockResolvedValueOnce([[]]);
    // 3. insert Emp_leave returns insertId
    connection.query.mockResolvedValueOnce([{ insertId: 700 }]);
    // 4. empDetails with no ManagerEmail
    connection.query.mockResolvedValueOnce([[{ FirstName: 'NoMgr', LastName: 'User', Email: 'nomgr@example.com', ManagerEmail: null, LeaveName: 'Annual' }]]);

    // 5. Insert into Leave_details returns insertId
    connection.query.mockResolvedValueOnce([{ insertId: 800 }]);

    mockGetConnection.mockResolvedValueOnce(connection);

    const req = createReq({ leaveTypeId: 8, fromDate: '2025-12-01', toDate: '2025-12-01', fromSession: 1, toSession: 2, reason: 'x' }, { user: { id: 77 } });
    const res = createRes();

    await leaveController.applyLeave(req, res);

    expect(connection.commit).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.data).toHaveProperty('leaveAppId');
  });
});
