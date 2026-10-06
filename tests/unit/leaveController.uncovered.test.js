const { createReq, createRes } = require('./helpers');

// Mock DB pool used by the controller
jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/leaveController');

describe('leaveController uncovered branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getLeaveBalances returns balances on success', async () => {
    const balances = [{ label: 'Sick', total: 10, current: 8, taken: 2 }];
    // pool.query returns [rows] according to controller usage
    pool.query.mockResolvedValueOnce([balances]);

    const req = createReq({}, { user: { id: 7 } });
    const res = createRes();

    await ctrl.getLeaveBalances(req, res);

    expect(pool.query).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual(balances);
  });

  test('getLeaveBalances returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB down'));

    const req = createReq({}, { user: { id: 8 } });
    const res = createRes();

    await ctrl.getLeaveBalances(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
  });

  test('debugEmpLeave returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('boom'));

    const req = createReq({}, { params: { empId: '99' } });
    const res = createRes();

    await ctrl.debugEmpLeave(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
  });

  test("getLeaveRequests formats approver as 'N/A' when none present", async () => {
    const rows = [{
      id: 1,
      type: 'Annual',
      from_date: '2025-12-01',
      to_date: '2025-12-01',
      from_session: 1,
      to_session: 2,
      status: 'Pending',
      reason: 'test',
      approver_first_name: null,
      approver_last_name: null,
      manager_first_name: null,
      manager_last_name: null
    }];

    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 9 } });
    const res = createRes();

    await ctrl.getLeaveRequests(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0].approver).toBe('N/A');
  // implementation returns 1 for same-day AM->PM (totalDays loop yields 1)
  expect(res.data[0].days).toBe(1);
  });
});
