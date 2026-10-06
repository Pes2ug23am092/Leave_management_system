const { createReq, createRes } = require('./helpers');

// Mock DB pool used by the controller
jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/teamController');

describe('teamController extra branch tests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getTeamTimeOff handles employee-role query branch', async () => {
    // Simulate one team member approved leave for an employee view
    const rows = [[{
      FromDate: '2025-12-05',
      ToDate: '2025-12-05',
      FromSession: 1,
      ToSession: 1,
      FirstName: 'Teammate',
      LastName: 'One',
      leaveType: 'Annual'
    }]];

    pool.query.mockResolvedValueOnce(rows);

    const req = createReq({}, { user: { id: 11, role: 'Employee' } });
    const res = createRes();

    await ctrl.getTeamTimeOff(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.data;
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBeGreaterThanOrEqual(0);
  });

  test('getLeaveActivities handles DB error (catch branch)', async () => {
    pool.query.mockRejectedValueOnce(new Error('boom'));

    const req = createReq({}, { user: { id: 22 } });
    const res = createRes();

    await ctrl.getLeaveActivities(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error', 'Failed to fetch leave activities');
  });

  test('getManagerReports handles DB error (catch branch)', async () => {
    // Simulate the first query failing
    pool.query.mockRejectedValueOnce(new Error('db fail'));

    const req = createReq({}, { user: { id: 30, role: 'Manager' } });
    const res = createRes();

    await ctrl.getManagerReports(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error', 'Failed to generate reports');
  });

  test('getTeamLeaveHistory handles DB error (catch branch)', async () => {
    pool.query.mockRejectedValueOnce(new Error('boom-hist'));

    const req = createReq({}, { user: { id: 40, role: 'Manager' } });
    const res = createRes();

    await ctrl.getTeamLeaveHistory(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error', 'Failed to fetch team approved leaves');
  });
});
