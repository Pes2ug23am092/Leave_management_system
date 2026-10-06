// Focused branch tests for leaveController
const { createReq, createRes } = require('./helpers');

const mockPoolQuery = jest.fn();
jest.mock('../../backend/db/db', () => ({ pool: { query: (...args) => mockPoolQuery(...args), getConnection: jest.fn() } }));
jest.mock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../backend/src/services/emailService', () => ({ notifyLeaveApplication: jest.fn().mockResolvedValue(undefined) }));

const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController small branch coverage additions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calculateDays handles PM start and AM end across two days (subtracts 0.5 twice)', () => {
    const days = leaveController.calculateDays('2025-12-01', '2025-12-02', 2, 1);
    // 2 calendar days -> 2, then -0.5 (PM start) and -0.5 (AM end) => 1
    expect(days).toBe(1);
  });

  test('getTeamLeaveRequests formats and returns requests for a manager', async () => {
    // mock pool.query to return one request row
    const sample = [{
      id: 5,
      employeeId: 20,
      employeeFirstName: 'Sam',
      employeeLastName: 'Sample',
      type: 'Annual',
      from_date: '2025-10-01',
      to_date: '2025-10-02',
      from_session: 1,
      to_session: 2,
      status: 'Pending',
      reason: 'X',
      applyDate: '2025-09-15'
    }];

    mockPoolQuery.mockResolvedValueOnce([sample]);

    const req = createReq({}, { user: { id: 40 } });
    const res = createRes();

    await leaveController.getTeamLeaveRequests(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(1);
    expect(res.data[0]).toHaveProperty('days');
    expect(res.data[0]).toHaveProperty('approver', 'You (Manager)');
  });

  test('getLeaveTypes handles non-array DB result with 500', async () => {
    // Simulate pool.query returning non-array types (e.g., null)
    mockPoolQuery.mockResolvedValueOnce([null]);

    const req = createReq();
    const res = createRes();

    await leaveController.getLeaveTypes(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
    expect(res.data.error).toMatch(/Data format error/i);
  });

  test('debugEmpLeave returns 500 on DB error', async () => {
    mockPoolQuery.mockRejectedValueOnce(new Error('debug fail'));

    const req = createReq({}, { params: { empId: 99 } });
    const res = createRes();

    await leaveController.debugEmpLeave(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
  });
});
