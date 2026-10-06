const { createReq, createRes } = require('./helpers');

// Mock DB pool
jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/leaveController');

describe('leaveController.getTeamLeaveRequests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('formats requests correctly for manager (success path)', async () => {
    const rows = [
      {
        id: 10,
        employeeId: 5,
        employeeFirstName: 'Sam',
        employeeLastName: 'Sample',
        type: 'Annual',
        from_date: '2025-10-01',
        to_date: '2025-10-02',
        from_session: 1,
        to_session: 1,
        status: 'Approved',
        reason: 'vac',
        applyDate: '2025-09-15'
      }
    ];

    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 7 } });
    const res = createRes();

    await ctrl.getTeamLeaveRequests(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toHaveProperty('days');
    expect(res.data[0]).toHaveProperty('approver', 'You (Manager)');
  });

  test('returns 500 when DB query errors', async () => {
    pool.query.mockRejectedValueOnce(new Error('db boom'));
    const req = createReq({}, { user: { id: 8 } });
    const res = createRes();

    await ctrl.getTeamLeaveRequests(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error', 'Failed to fetch team leave requests');
  });
});
