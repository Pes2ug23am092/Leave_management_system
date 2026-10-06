const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');
const { getLeaveTypes } = require('../../backend/src/controllers/leaveController');

describe('leaveController.getLeaveTypes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns array of leave types', async () => {
    pool.query.mockResolvedValueOnce([[{ LeaveTypeID: 1, LeaveName: 'Annual', MaxDays: 20, Year: 2025 }]]);
    const req = createReq();
    const res = createRes();

    await getLeaveTypes(req, res);

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toHaveProperty('LeaveTypeID', 1);
  });
});
