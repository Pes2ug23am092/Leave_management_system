const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const { getProfile } = require('../../backend/src/controllers/employeeController');

describe('employeeController.getProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when not found', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const req = createReq({}, { user: { id: 999 } });
    const res = createRes();

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns profile when found', async () => {
    const row = [{ id: 1, first_name: 'A', last_name: 'B' }];
    pool.query.mockResolvedValueOnce([row]);
    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await getProfile(req, res);

    expect(res.json).toHaveBeenCalledWith(row[0]);
  });
});
