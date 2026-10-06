const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockPool = { query: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));

const { buildApp } = require('./helpers');

function authHeader(payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret');
  return { Authorization: `Bearer ${token}` };
}

describe('GET /api/employees/leave/requests (integration)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 returns formatted leave requests including days', async () => {
    mockPool.query.mockResolvedValueOnce([[
      { 
        LeaveAppID: 101,
        Type: 'Annual',
        FromDate: '2025-12-01',
        ToDate: '2025-12-03',
        FromSession: 1,
        ToSession: 2,
        Status: 'Approved'
      }
    ]]);

    const app = buildApp();
    const res = await request(app)
      .get('/api/employees/leave/requests')
      .set(authHeader({ id: 1, role: 'Employee' }))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('days');
    expect(res.body[0].days).toBeGreaterThanOrEqual(1);
  });
});
