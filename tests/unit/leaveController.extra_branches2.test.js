const { createReq, createRes } = require('./helpers');

// Mock pool for DB interactions
const mockPool = { query: jest.fn(), getConnection: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));
const { pool } = require('../../backend/db/db');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController extra branches (batch 2)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calculateDays: same-day PM->AM returns 0.5 (half-day branch)', () => {
    const res = leaveController.calculateDays('2025-01-01', '2025-01-01', 2, 1);
    expect(res).toBe(0.5);
  });

  test('debugEmpLeave returns rows on success', async () => {
    const rows = [{ EmpID: 7, LeaveTotal: 10 }];
    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { params: { empId: 7 } });
    const res = createRes();

    await leaveController.debugEmpLeave(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(rows);
  });

  test('getLeaveTypes returns 500 when DB returns non-array', async () => {
    // Simulate types being null (not an array)
    pool.query.mockResolvedValueOnce([null]);

    const req = createReq();
    const res = createRes();

    await leaveController.getLeaveTypes(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
  });

  test('getLeaveBalances handles DB error (catch branch)', async () => {
    pool.query.mockRejectedValueOnce(new Error('db fail'));

    const req = createReq({}, { user: { id: 11 } });
    const res = createRes();

    await leaveController.getLeaveBalances(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
  });

  test('getTeamLeaveRequests success formatting', async () => {
    const rows = [{
      id: 9,
      employeeId: 21,
      employeeFirstName: 'John',
      employeeLastName: 'Doe',
      type: 'Sick',
      from_date: '2025-03-01',
      to_date: '2025-03-02',
      from_session: 1,
      to_session: 1,
      status: 'Pending',
      reason: 'Test',
      applyDate: '2025-02-20'
    }];

    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 99 } });
    const res = createRes();

    await leaveController.getTeamLeaveRequests(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toHaveProperty('employee', 'John Doe');
    expect(res.data[0]).toHaveProperty('approver', 'You (Manager)');
  });
});
