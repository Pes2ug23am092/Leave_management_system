const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/teamController');

describe('teamController basic behaviors', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getTeamTimeOff returns grouped data for manager', async () => {
    // Provide one approved leave spanning 2 days
    const rows = [[{
      FromDate: '2025-12-01',
      ToDate: '2025-12-02',
      FromSession: 1,
      ToSession: 1,
      FirstName: 'John',
      LastName: 'Doe',
      leaveType: 'Annual'
    }]];

    pool.query.mockResolvedValueOnce(rows);

    const req = createReq({}, { user: { id: 1, role: 'Manager' } });
    const res = createRes();

    await ctrl.getTeamTimeOff(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.data;
    expect(Array.isArray(payload)).toBe(true);
    // Should have entries for two dates
    expect(payload[0]).toHaveProperty('date');
    expect(payload[0]).toHaveProperty('members');
  });

  test('getLeaveActivities formats activities', async () => {
    const activities = [[{
      id: 1,
      type: 'Annual',
      fromDate: '2025-12-01',
      toDate: '2025-12-01',
      status: 'Approved',
      fromSession: 1,
      toSession: 1,
      approverFirstName: null,
      approverLastName: null,
      appliedDate: new Date().toISOString()
    }]];

    pool.query.mockResolvedValueOnce(activities);

    const req = createReq({}, { user: { id: 2 } });
    const res = createRes();

    await ctrl.getLeaveActivities(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.data;
    expect(Array.isArray(payload)).toBe(true);
    expect(payload[0]).toHaveProperty('days');
  });

  test('getManagerReports returns 403 for non-manager', async () => {
    const req = createReq({}, { user: { id: 5, role: 'Employee' } });
    const res = createRes();

    await ctrl.getManagerReports(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('getTeamLeaveHistory returns 403 for non-manager', async () => {
    const req = createReq({}, { user: { id: 5, role: 'Employee' } });
    const res = createRes();

    await ctrl.getTeamLeaveHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
