const { createReq, createRes } = require('./helpers');

// Mock DB pool getConnection pattern
const mockGetConnection = jest.fn();
jest.mock('../../backend/db/db', () => ({
  pool: { getConnection: (...args) => mockGetConnection(...args), query: jest.fn() }
}));
const { pool } = require('../../backend/db/db');

// Mock email service
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApplication: jest.fn(async () => true)
}));

const ctrl = require('../../backend/src/controllers/leaveController');

describe('applyLeave with existing balance success path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('succeeds when balanceRows exists and sends email', async () => {
    const conn = {
      beginTransaction: jest.fn(async () => {}),
      query: jest.fn()
        // 1. leaveTypeRows
        .mockResolvedValueOnce([[{ LeaveTypeID: 1, MaxDays: 10 }]])
        // 2. balanceRows exists
        .mockResolvedValueOnce([[{ LeaveBalance: 10, EmpLeaveID: 555 }]])
        // 3. empDetails
        .mockResolvedValueOnce([[{ FirstName: 'Alpha', LastName: 'Beta', ManagerFirstName: 'Mgr', ManagerLastName: 'One', ManagerEmail: 'mgr@example.com', Email: 'alpha@example.com', LeaveName: 'Annual' }]])
        // 4. insert into Leave_details
        .mockResolvedValueOnce([{ insertId: 101 }]),
      commit: jest.fn(async () => {}),
      rollback: jest.fn(async () => {}),
      release: jest.fn(() => {})
    };

    mockGetConnection.mockResolvedValueOnce(conn);

    const req = createReq({ leaveTypeId: 1, fromDate: '2025-12-01', toDate: '2025-12-02', fromSession: 1, toSession: 1, reason: 'test' }, { user: { id: 77 } });
    const res = createRes();

    await ctrl.applyLeave(req, res);

    expect(conn.commit).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.data).toHaveProperty('leaveAppId', 101);
  });
});
