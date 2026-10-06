const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const { getLeaveRequests } = require('../../backend/src/controllers/leaveController');

describe('leaveController.getLeaveRequests - approver/manager/N/A branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses approver name when approver_first_name present', async () => {
    const rows = [
      {
        id: 1,
        from_date: '2025-10-01',
        to_date: '2025-10-02',
        from_session: 1,
        to_session: 1,
        approver_first_name: 'Alice',
        approver_last_name: 'Approver',
        manager_first_name: 'Mgr',
        manager_last_name: 'Name',
      }
    ];

    pool.query.mockResolvedValue([rows]);

    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await getLeaveRequests(req, res);

    expect(res.json).toHaveBeenCalled();
    const out = res.json.mock.calls[0][0];
    expect(out[0].approver).toBe('Alice Approver');
  });

  test('falls back to manager name when approver absent', async () => {
    const rows = [
      {
        id: 2,
        from_date: '2025-11-01',
        to_date: '2025-11-01',
        from_session: 1,
        to_session: 2,
        approver_first_name: null,
        approver_last_name: null,
        manager_first_name: 'Manager',
        manager_last_name: 'Person',
      }
    ];

    pool.query.mockResolvedValue([rows]);

    const req = createReq({}, { user: { id: 2 } });
    const res = createRes();

    await getLeaveRequests(req, res);

    const out = res.json.mock.calls[0][0];
    expect(out[0].approver).toBe('Manager Person');
  });

  test('returns N/A when both approver and manager missing', async () => {
    const rows = [
      {
        id: 3,
        from_date: '2025-12-01',
        to_date: '2025-12-01',
        from_session: 1,
        to_session: 1,
        approver_first_name: null,
        approver_last_name: null,
        manager_first_name: null,
        manager_last_name: null,
      }
    ];

    pool.query.mockResolvedValue([rows]);

    const req = createReq({}, { user: { id: 3 } });
    const res = createRes();

    await getLeaveRequests(req, res);

    const out = res.json.mock.calls[0][0];
    expect(out[0].approver).toBe('N/A');
  });
});
