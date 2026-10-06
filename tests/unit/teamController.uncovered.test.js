const { createReq, createRes } = require('./helpers');

// Mock DB pool
jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/teamController');

describe('teamController uncovered branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getTeamTimeOff handles Employee role and groups multi-day leaves without duplicates', async () => {
    const rows = [
      // multi-day leave for same employee
      { FromDate: '2025-12-01', ToDate: '2025-12-02', FromSession: 1, ToSession: 1, FirstName: 'Alice', LastName: 'Blue', leaveType: 'Annual' },
      // another entry that would map to the same employee/date (should be deduped)
      { FromDate: '2025-12-02', ToDate: '2025-12-02', FromSession: 1, ToSession: 1, FirstName: 'Alice', LastName: 'Blue', leaveType: 'Annual' }
    ];

    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 5, role: 'Employee' } });
    const res = createRes();

    await ctrl.getTeamTimeOff(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    // Two dates expected: 2025-12-01 and 2025-12-02
    const dates = res.data.map(d => d.date).sort();
    expect(dates).toEqual(['2025-12-01', '2025-12-02']);
    // Each date should have members array and memberDetails deduped
    expect(res.data[0].members.length).toBeGreaterThan(0);
    expect(res.data[1].members.length).toBeGreaterThan(0);
  });
});
