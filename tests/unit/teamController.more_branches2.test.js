const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/teamController');

describe('teamController extra branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getManagerReports uses analytics fallback to {} when empty array returned', async () => {
    pool.query
      .mockResolvedValueOnce([[]]) // leaveStats
      .mockResolvedValueOnce([[]]) // monthlyTrends
      .mockResolvedValueOnce([[]]) // teamSummary
      .mockResolvedValueOnce([[]]) // analytics empty -> fallback {}
      .mockResolvedValueOnce([[]]); // dayPatterns

    const req = createReq({}, { user: { id: 99, role: 'Manager' } });
    const res = createRes();

    await ctrl.getManagerReports(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('analytics');
    expect(res.data.analytics).toEqual({});
  });

  test('getLeaveActivities covers non-Approved path (Pending keeps label)', async () => {
    const activities = [[{
      id: 201,
      type: 'Annual',
      fromDate: '2025-12-01',
      toDate: '2025-12-01',
      status: 'Pending',
      fromSession: 2,
      toSession: 1,
      approverFirstName: null,
      approverLastName: null,
      appliedDate: new Date().toISOString()
    }]];
    pool.query.mockResolvedValueOnce(activities);

    const req = createReq({}, { user: { id: 77 } });
    const res = createRes();

    await ctrl.getLeaveActivities(req, res);

    expect(res.statusCode).toBe(200);
    const item = res.data[0];
    expect(item.statusLabel).toBe('Pending');
    // PM start and AM end same day clamps to at least 0.5
    expect(item.days).toBe(0.5);
  });
});
