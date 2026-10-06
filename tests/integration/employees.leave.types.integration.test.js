const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockPool = { query: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));

const { buildApp } = require('./helpers');

function authHeader(payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret');
  return { Authorization: `Bearer ${token}` };
}

describe('GET /api/employees/leave/types (integration)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 returns leave types for authenticated user', async () => {
    mockPool.query.mockResolvedValueOnce([[{ LeaveTypeID: 1, LeaveName: 'Annual', MaxDays: 20, Year: 2025 }]]);
    const app = buildApp();
    const res = await request(app)
      .get('/api/employees/leave/types')
      .set(authHeader({ id: 1, role: 'Employee' }))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('LeaveName', 'Annual');
  });
});
