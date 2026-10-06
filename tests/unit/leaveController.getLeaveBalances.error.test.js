const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const { getLeaveBalances } = require('../../backend/src/controllers/leaveController');

describe('leaveController.getLeaveBalances - error path', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 500 when DB query throws', async () => {
    pool.query.mockRejectedValue(new Error('db fail'));

    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await getLeaveBalances(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch leave balances' });
  });
});
