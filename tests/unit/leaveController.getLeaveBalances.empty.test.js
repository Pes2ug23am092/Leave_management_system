const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/leaveController');

describe('leaveController.getLeaveBalances empty', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns empty array when DB returns no balances', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const req = createReq({}, { user: { id: 2 } });
    const res = createRes();

    await ctrl.getLeaveBalances(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);
  });
});
