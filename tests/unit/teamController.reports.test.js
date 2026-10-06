const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/teamController');

describe('teamController reports and history', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getTeamTimeOff for employee role groups leaves correctly', async () => {
    // employee branch: pool.query returns some approved leaves
    const rows = [
      { FromDate: '2025-12-01', ToDate: '2025-12-02', FromSession: 1, ToSession: 1, FirstName: 'Jane', LastName: 'Doe', leaveType: 'Annual' }
    ];
    pool.query.mockResolvedValueOnce([rows]);

    const req = createReq({}, { user: { id: 10, role: 'Employee' } });
    const res = createRes();

    await ctrl.getTeamTimeOff(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('getManagerReports returns aggregated report object for manager', async () => {
    // the controller issues several queries; provide empty arrays or small arrays accordingly
    pool.query
      .mockResolvedValueOnce([[]]) // leaveStats
      .mockResolvedValueOnce([[]]) // monthlyTrends
      .mockResolvedValueOnce([[]]) // teamSummary
      .mockResolvedValueOnce([[{ totalTeamMembers: 3, avgLeaveLength: 2, recentApprovals: 1, pendingCount: 0, lastApplicationDate: '2025-10-01' }]]) // analytics
      .mockResolvedValueOnce([[]]); // dayPatterns

    const req = createReq({}, { user: { id: 5, role: 'Manager' } });
    const res = createRes();

    await ctrl.getManagerReports(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(res.data).toHaveProperty('analytics');
    expect(res.data.analytics).toHaveProperty('totalTeamMembers');
  });

  test('getTeamLeaveHistory returns formatted history for manager', async () => {
    const leaveHistory = [
      {
        id: 1,
        employeeName: 'Sam Sample',
        department: 'Dev',
        leaveType: 'Annual',
        FromDate: '2025-10-01',
        ToDate: '2025-10-02',
        FromSession: 1,
        ToSession: 1,
        Reason: 'Trip',
        ApprovedDate: '2025-09-15',
        duration: 2,
        Status: 'Approved',
        leaveStatus: 'Completed'
      }
    ];

    pool.query.mockResolvedValueOnce([leaveHistory]);

    const req = createReq({}, { user: { id: 7, role: 'Manager' } });
    const res = createRes();

    await ctrl.getTeamLeaveHistory(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toHaveProperty('employeeName', 'Sam Sample');
  });
});
