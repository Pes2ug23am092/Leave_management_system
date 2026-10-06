const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');
const { getLeaveRequests } = require('../../backend/src/controllers/leaveController');

describe('leaveController.getLeaveRequests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('formats leave requests with days', async () => {
    const rows = [{
      id: 5,
      type: 'Annual',
      from_date: '2025-11-06',
      to_date: '2025-11-07',
      from_session: 1,
      to_session: 2,
      status: 'Pending',
      reason: 'Trip'
    }];
    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await getLeaveRequests(req, res);

    expect(res.data[0]).toHaveProperty('days');
    expect(res.data[0]).toHaveProperty('from');
    expect(res.data[0]).toHaveProperty('to');
  });
});
