const { createReq, createRes } = require('./helpers');

// Mock DB pool and getConnection for transactional flows
const mockGetConnection = jest.fn();
jest.mock('../../backend/db/db', () => ({ pool: { getConnection: (...args) => mockGetConnection(...args), query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

// Mock email service
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApplication: jest.fn(async () => true)
}));
const emailService = require('../../backend/src/services/emailService');

const ctrl = require('../../backend/src/controllers/leaveController');

describe('leaveController more branches batch', () => {
  beforeEach(() => jest.clearAllMocks());

  test('applyLeave proceeds when balanceRows exists and sends email', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    // 1. leaveTypeRows exists
    connection.query.mockResolvedValueOnce([[{ LeaveTypeID: 3, MaxDays: 10 }]]);
    // 2. balanceRows exists with sufficient balance
    connection.query.mockResolvedValueOnce([[{ LeaveBalance: 5, EmpLeaveID: 123 }]]);
    // 3. empDetails exists with ManagerEmail
    connection.query.mockResolvedValueOnce([[{ FirstName: 'X', LastName: 'Y', Email: 'x@y.com', ManagerEmail: 'mgr@e.com', ManagerFirstName: 'M', ManagerLastName: 'G', LeaveName: 'Annual' }]]);
    // 4. Insert into Leave_details
    connection.query.mockResolvedValueOnce([{ insertId: 222 }]);

    mockGetConnection.mockResolvedValueOnce(connection);

    const req = createReq({ leaveTypeId: 3, fromDate: '2025-12-01', toDate: '2025-12-01', fromSession: 1, toSession: 2, reason: 'ok' }, { user: { id: 11 } });
    const res = createRes();

    await ctrl.applyLeave(req, res);

    expect(connection.commit).toHaveBeenCalled();
    expect(emailService.notifyLeaveApplication).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.data).toHaveProperty('leaveAppId');
  });

  test('applyLeave handles email service failure gracefully', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    connection.query.mockResolvedValueOnce([[{ LeaveTypeID: 4, MaxDays: 10 }]]);
    connection.query.mockResolvedValueOnce([[{ LeaveBalance: 10, EmpLeaveID: 222 }]]);
    connection.query.mockResolvedValueOnce([[{ FirstName: 'A', LastName: 'B', Email: 'a@b.com', ManagerEmail: 'mgr@b.com', ManagerFirstName: 'M', ManagerLastName: 'N', LeaveName: 'Sick' }]]);
    connection.query.mockResolvedValueOnce([{ insertId: 333 }]);

    mockGetConnection.mockResolvedValueOnce(connection);

    // make email throw
    emailService.notifyLeaveApplication.mockRejectedValueOnce(new Error('SMTP fail'));

    const req = createReq({ leaveTypeId: 4, fromDate: '2025-12-05', toDate: '2025-12-05', fromSession: 1, toSession: 2, reason: 'err' }, { user: { id: 12 } });
    const res = createRes();

    await ctrl.applyLeave(req, res);

    // commit should still be called and response should be success despite email failure
    expect(connection.commit).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.data).toHaveProperty('leaveAppId');
  });

  test('cancelApprovedLeave skips balance restore when EmpLeaveID is falsy', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    const leaveRow = [{
      LeaveAppID: 400,
      EmpLeaveID: null,
      LeaveBalance: null,
      LeaveTaken: null,
      FromDate: '2025-12-01',
      ToDate: '2025-12-01',
      FromSession: 1,
      ToSession: 2,
      FirstName: 'No',
      LastName: 'Emp',
      Email: 'no@emp.com',
      LeaveName: 'Annual'
    }];

  mockGetConnection.mockResolvedValueOnce(connection);
    connection.query.mockResolvedValueOnce([leaveRow]); // select approved leave
    connection.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update Leave_details

    const req = createReq({ reason: 'cancel' }, { params: { leaveId: '400' }, user: { id: 20 } });
    const res = createRes();

    await ctrl.cancelApprovedLeave(req, res);

    expect(connection.commit).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('restoredDays');
  });
});
