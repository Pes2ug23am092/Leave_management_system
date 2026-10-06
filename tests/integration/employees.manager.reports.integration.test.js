const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockPool = { query: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));

const { buildApp } = require('./helpers');

function authHeader(payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret');
  return { Authorization: `Bearer ${token}` };
}

describe('GET /api/employees/manager/reports (integration)', () => {
  beforeEach(() => mockPool.query.mockReset());

  test('200 returns reports for manager', async () => {
    // leaveStats
    mockPool.query.mockResolvedValueOnce([[{ Department: 'Engineering', leaveType: 'Annual', totalApplications: 2, approvedCount: 1, rejectedCount: 1, pendingCount: 0, averageDays: 1.0 }]]);
    // monthlyTrends
    mockPool.query.mockResolvedValueOnce([[{ month: '2025-10', leaveType: 'Annual', applications: 2, approved: 1 }]]);
    // teamSummary
    mockPool.query.mockResolvedValueOnce([[{ employeeName: 'Alice Doe', Department: 'Engineering', totalLeaves: 2, daysTaken: 2, pendingRequests: 0 }]]);
    // analytics
    mockPool.query.mockResolvedValueOnce([[{ totalTeamMembers: 2, avgLeaveLength: 1.5, recentApprovals: 1, pendingCount: 0, lastApplicationDate: '2025-10-01' }]]);
    // dayPatterns
    mockPool.query.mockResolvedValueOnce([[{ dayOfWeek: 'Monday', applicationCount: 1 }]]);

    const app = buildApp();
    const res = await request(app)
      .get('/api/employees/manager/reports')
      .set(authHeader({ id: 9, role: 'Manager' }))
      .expect(200);

    expect(res.body).toHaveProperty('leaveStatistics');
    expect(Array.isArray(res.body.leaveStatistics)).toBe(true);
  });
});
