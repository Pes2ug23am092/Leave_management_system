const { createReq, createRes } = require('./helpers');

// Mock DB pool
jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/leaveController');

describe('leaveController.getLeaveBalances success', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns balances array when DB returns rows', async () => {
    const balances = [ { label: 'Annual', total: 20, current: 15, taken: 5 } ];
    pool.query.mockResolvedValueOnce([balances]);

    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await ctrl.getLeaveBalances(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toHaveProperty('label', 'Annual');
  });
});
