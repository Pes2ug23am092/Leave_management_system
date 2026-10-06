const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/teamController');

describe('teamController getLeaveActivities status-label branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('Approved future leave becomes Upcoming and isUpcoming true', async () => {
    const activities = [[{
      id: 101,
      type: 'Annual',
      fromDate: '2025-12-01',
      toDate: '2025-12-02',
      status: 'Approved',
      fromSession: 1,
      toSession: 1,
      approverFirstName: 'A',
      approverLastName: 'B',
      appliedDate: new Date().toISOString()
    }]];

    pool.query.mockResolvedValueOnce(activities);

    const req = createReq({}, { user: { id: 60 } });
    const res = createRes();

    await ctrl.getLeaveActivities(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.data;
    expect(payload[0]).toHaveProperty('statusLabel', 'Upcoming');
    expect(payload[0].isUpcoming).toBe(true);
  });

  test('Approved ongoing leave becomes Ongoing and isOngoing true', async () => {
    // Use dates around current run-time (2025-11-09) so this is ongoing in tests
    const activities = [[{
      id: 102,
      type: 'Sick',
      fromDate: '2025-11-08',
      toDate: '2025-11-10',
      status: 'Approved',
      fromSession: 1,
      toSession: 1,
      approverFirstName: null,
      approverLastName: null,
      appliedDate: new Date().toISOString()
    }]];

    pool.query.mockResolvedValueOnce(activities);

    const req = createReq({}, { user: { id: 61 } });
    const res = createRes();

    await ctrl.getLeaveActivities(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.data;
    expect(payload[0]).toHaveProperty('statusLabel', 'Ongoing');
    expect(payload[0].isOngoing).toBe(true);
    // approver should be 'Pending' when approver names are null
    expect(payload[0]).toHaveProperty('approver', 'Pending');
  });
});
