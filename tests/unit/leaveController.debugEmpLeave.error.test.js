const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController.debugEmpLeave error', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 500 when debug query fails', async () => {
    pool.query.mockRejectedValue(new Error('debug fail'));

    const req = createReq({}, { params: { empId: 9 } });
    const res = createRes();

    await leaveController.debugEmpLeave(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch Emp_leave rows' });
  });
});
