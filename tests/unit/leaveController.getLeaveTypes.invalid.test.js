const { createReq, createRes } = require('./helpers');

// Mock DB pool used by the controller
jest.mock('../../backend/db/db', () => ({
  pool: { query: jest.fn(), getConnection: jest.fn() }
}));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/leaveController');

describe('leaveController getLeaveTypes invalid element handling', () => {
  beforeEach(() => jest.clearAllMocks());

  test('filters out invalid leave type objects and returns valid ones', async () => {
    // types contains one invalid (missing LeaveName as string) and one valid
    const types = [ { LeaveTypeID: null, LeaveName: 123 }, { LeaveTypeID: 1, LeaveName: 'Annual', MaxDays: 20, Year: 2025 } ];
    pool.query.mockResolvedValueOnce([types]);

    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});

    const req = createReq();
    const res = createRes();

    await ctrl.getLeaveTypes(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    // only the valid type should be returned
    expect(res.data.length).toBe(1);
    expect(res.data[0]).toHaveProperty('LeaveTypeID', 1);
    expect(spyErr).toHaveBeenCalled();

    spyErr.mockRestore();
  });
});
