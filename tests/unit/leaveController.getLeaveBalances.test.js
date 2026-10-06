const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');
const { getLeaveBalances } = require('../../backend/src/controllers/leaveController');

describe('leaveController.getLeaveBalances', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns balances for user', async () => {
    pool.query.mockResolvedValueOnce([[{ label: 'Annual', total: 20, current: 10, taken: 10 }]]);
    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await getLeaveBalances(req, res);

    expect(res.data[0]).toMatchObject({ label: 'Annual', total: 20 });
  });
});
