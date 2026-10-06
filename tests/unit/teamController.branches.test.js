const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const ctrl = require('../../backend/src/controllers/teamController');

describe('teamController branch-targeted tests', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getManagerReports returns aggregated reports object for manager with non-empty data', async () => {
    const leaveStats = [{ Department: 'Eng', leaveType: 'Annual', totalApplications: 2 }];
    const monthlyTrends = [{ month: '2025-09', leaveType: 'Annual', applications: 3 }];
    const teamSummary = [{ employeeName: 'Alice Smith', totalLeaves: 2, daysTaken: 5 }];
    const analytics = [{ totalTeamMembers: 5, avgLeaveLength: 2.5 }];
    const dayPatterns = [{ dayOfWeek: 'Monday', applicationCount: 4 }];

    pool.query
      .mockResolvedValueOnce([leaveStats])
      .mockResolvedValueOnce([monthlyTrends])
      .mockResolvedValueOnce([teamSummary])
      .mockResolvedValueOnce([analytics])
      .mockResolvedValueOnce([dayPatterns]);

    const req = createReq({}, { user: { id: 5, role: 'Manager' } });
    const res = createRes();

    await ctrl.getManagerReports(req, res);

    expect(res.data).toHaveProperty('leaveStatistics');
    expect(res.data.leaveStatistics).toEqual(leaveStats);
    expect(res.data).toHaveProperty('monthlyTrends');
    expect(res.data.monthlyTrends).toEqual(monthlyTrends);
    expect(res.data).toHaveProperty('analytics');
    expect(res.data.analytics).toEqual(analytics[0]);
  });

  test('getTeamLeaveHistory formats approved leaves correctly for manager', async () => {
    const leaveHistory = [
      {
        id: 1,
        employeeName: 'Sam Sample',
        department: 'Eng',
        leaveType: 'Annual',
        FromDate: '2025-10-01',
        ToDate: '2025-10-02',
        FromSession: 1,
        ToSession: 1,
        Reason: 'Trip',
        ApprovedDate: '2025-09-15',
        duration: 2,
        Status: 'Approved',
        leaveStatus: 'Upcoming'
      }
    ];

    pool.query.mockResolvedValueOnce([leaveHistory]);

    const req = createReq({}, { user: { id: 7, role: 'Manager' } });
    const res = createRes();

    await ctrl.getTeamLeaveHistory(req, res);

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toHaveProperty('days');
    expect(res.data[0]).toHaveProperty('leaveStatus');
  });
});
