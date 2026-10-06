const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController.getLeaveBalances error', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 500 when DB query fails', async () => {
    pool.query.mockRejectedValue(new Error('db boom'));

    const req = createReq({}, {}, { id: 1 });
    const res = createRes();

    await leaveController.getLeaveBalances(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch leave balances' });
  });
});
