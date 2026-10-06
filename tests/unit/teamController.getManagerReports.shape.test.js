const { createReq, createRes } = require('./helpers');

const mockQuery = jest.fn();
jest.mock('../../backend/db/db', () => ({
  pool: { query: (...args) => mockQuery(...args) }
}));

const ctrl = require('../../backend/src/controllers/teamController');

describe('teamController.getManagerReports - shape', () => {
  beforeEach(() => mockQuery.mockReset());

  test('returns expected report sections for manager', async () => {
    // 1: leaveStats
    mockQuery.mockResolvedValueOnce([[{
      Department: 'Engineering',
      leaveType: 'Sick Leave',
      totalApplications: 3,
      approvedCount: 2,
      rejectedCount: 1,
      pendingCount: 0,
      averageDays: 1.5
    }]]);
    // 2: monthlyTrends
    mockQuery.mockResolvedValueOnce([[{
      month: '2024-11',
      leaveType: 'Sick Leave',
      applications: 2,
      approved: 1
    }]]);
    // 3: teamSummary
    mockQuery.mockResolvedValueOnce([[{
      employeeName: 'Alice Doe',
      Department: 'Engineering',
      totalLeaves: 3,
      daysTaken: 4,
      pendingRequests: 0
    }]]);
    // 4: analytics
    mockQuery.mockResolvedValueOnce([[{
      totalTeamMembers: 2,
      avgLeaveLength: 1.5,
      recentApprovals: 1,
      pendingCount: 0,
      lastApplicationDate: '2024-11-01'
    }]]);
    // 5: dayPatterns
    mockQuery.mockResolvedValueOnce([[{
      dayOfWeek: 'Monday',
      applicationCount: 2
    }]]);

    const req = createReq({}, { user: { id: 10, role: 'Manager' } });
    const res = createRes();

    await ctrl.getManagerReports(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('leaveStatistics');
    expect(payload).toHaveProperty('monthlyTrends');
    expect(payload).toHaveProperty('teamSummary');
    expect(payload).toHaveProperty('analytics');
    expect(payload).toHaveProperty('dayPatterns');
    expect(payload).toHaveProperty('period', 'Last 12 months');
    expect(payload).toHaveProperty('generatedAt');
    expect(Array.isArray(payload.leaveStatistics)).toBe(true);
    expect(Array.isArray(payload.monthlyTrends)).toBe(true);
    expect(Array.isArray(payload.teamSummary)).toBe(true);
    expect(Array.isArray(payload.dayPatterns)).toBe(true);
  });
});
