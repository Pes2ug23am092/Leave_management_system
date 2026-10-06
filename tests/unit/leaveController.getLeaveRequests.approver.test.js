const { createReq, createRes } = require('./helpers');

// Mock DB pool used by the controller
jest.mock('../../backend/db/db', () => ({
  pool: { query: jest.fn(), getConnection: jest.fn() }
}));
const { pool } = require('../../backend/db/db');

// Controller under test
const ctrl = require('../../backend/src/controllers/leaveController');

describe('leaveController getLeaveRequests approver/manager fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses approver name when approver fields are present', async () => {
    const rows = [
      {
        id: 1,
        type: 'Annual',
        from_date: '2025-12-01',
        to_date: '2025-12-02',
        from_session: 1,
        to_session: 1,
        status: 'Pending',
        reason: 'Testing',
        approver_first_name: 'App',
        approver_last_name: 'Rover',
        manager_first_name: 'Mgr',
        manager_last_name: 'One'
      }
    ];

    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 10 } });
    const res = createRes();

    await ctrl.getLeaveRequests(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0].approver).toBe('App Rover');
  });

  test('falls back to manager name when approver is missing', async () => {
    const rows = [
      {
        id: 2,
        type: 'Casual',
        from_date: '2025-12-05',
        to_date: '2025-12-05',
        from_session: 1,
        to_session: 2,
        status: 'Pending',
        reason: 'Mgr fallback',
        approver_first_name: null,
        approver_last_name: null,
        manager_first_name: 'Manager',
        manager_last_name: 'Fallback'
      }
    ];

    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 11 } });
    const res = createRes();

    await ctrl.getLeaveRequests(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data[0].approver).toBe('Manager Fallback');
  });

  test('returns N/A when neither approver nor manager names are available', async () => {
    const rows = [
      {
        id: 3,
        type: 'Sick',
        from_date: '2025-12-10',
        to_date: '2025-12-10',
        from_session: 2,
        to_session: 1,
        status: 'Pending',
        reason: 'No approver or manager',
        approver_first_name: null,
        approver_last_name: null,
        manager_first_name: null,
        manager_last_name: null
      }
    ];

    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 12 } });
    const res = createRes();

    await ctrl.getLeaveRequests(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data[0].approver).toBe('N/A');
  });

  test('handles DB errors and returns 500', async () => {
    pool.query.mockRejectedValueOnce(new Error('db fail'));

    const req = createReq({}, { user: { id: 13 } });
    const res = createRes();

    await ctrl.getLeaveRequests(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error', 'Failed to fetch leave requests');
  });
});
