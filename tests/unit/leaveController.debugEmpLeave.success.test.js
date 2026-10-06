const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/leaveController');

describe('leaveController.debugEmpLeave success', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns rows when DB returns data', async () => {
    const rows = [ { EmpID: 9, LeaveTotal: 10 } ];
    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { params: { empId: '9' } });
    const res = createRes();

    await ctrl.debugEmpLeave(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toHaveProperty('EmpID', 9);
  });
});
