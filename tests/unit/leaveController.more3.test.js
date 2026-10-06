const { createReq, createRes } = require('./helpers');

// Mock pool for DB interactions
const mockPool = { query: jest.fn(), getConnection: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));
// Mock email service so tests don't attempt to use real SMTP or ethereal
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApplication: jest.fn().mockResolvedValue(undefined),
  notifyLeaveApproval: jest.fn().mockResolvedValue(undefined),
  notifyLeaveRejection: jest.fn().mockResolvedValue(undefined)
}));
const { pool } = require('../../backend/db/db');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController extra batch 3', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calculateDays: same-day AM->AM returns implementation value (0.5)', () => {
    const res = leaveController.calculateDays('2025-06-01', '2025-06-01', 1, 1);
    // Implementation treats AM->AM same-day as 0.5 after adjustments
    expect(res).toBe(0.5);
  });

  test('getLeaveTypes returns empty array when DB returns no types', async () => {
    // Simulate zero rows returned
    pool.query.mockResolvedValueOnce([[]]);

    const req = createReq();
    const res = createRes();

    await leaveController.getLeaveTypes(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);
  });

  test('getLeaveRequests catches DB error and returns 500', async () => {
    pool.query.mockRejectedValueOnce(new Error('boom'));

    const req = createReq({}, { user: { id: 7 } });
    const res = createRes();

    await leaveController.getLeaveRequests(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
  });

  test('updateLeaveStatus rejects without EmpLeaveID and status Rejected (no balance update path)', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    // leaveDetails: EmpLeaveID null and pending
    const leaveRow = [{
      LeaveAppID: 321,
      EmpLeaveID: null,
      LeaveBalance: null,
      LeaveTaken: null,
      FromDate: '2025-08-01',
      ToDate: '2025-08-01',
      FromSession: 1,
      ToSession: 2,
      FirstName: 'R',
      LastName: 'S',
      Email: 'r@s',
      LeaveName: 'Annual',
      ManagerFirstName: 'M',
      ManagerLastName: 'G',
      ManagerEmail: 'mgr@e',
      MaxDays: 10
    }];

  pool.getConnection.mockResolvedValueOnce(connection);
  connection.query.mockResolvedValueOnce([leaveRow]); // select leaveDetails
  connection.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update Leave_details
  // Ensure email service is stubbed (jest.mock above) so notifyLeaveRejection resolves quickly
    // No Emp_leave update should be attempted since EmpLeaveID is null and status is Rejected

    const req = createReq({}, { params: { leaveId: 321 }, user: { id: 12 } });
    req.body = { status: 'Rejected', remarks: 'Not valid' };
    const res = createRes();

    await leaveController.updateLeaveStatus(req, res);

    expect(connection.commit).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('message');
  });
});

