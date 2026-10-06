const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock DB pool
const mockPool = { query: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));

const { buildApp } = require('./helpers');

describe('GET /api/employees/leave/types (system)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns leave types for authenticated user', async () => {
    const fakeTypes = [
      { LeaveTypeID: 1, LeaveName: 'Casual Leave', MaxDays: 12, Year: new Date().getFullYear() }
    ];

    mockPool.query.mockResolvedValueOnce([fakeTypes]);

    process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: 42, role: 'Employee' }, process.env.JWT_SECRET);

    const app = buildApp();

    const res = await request(app)
      .get('/api/employees/leave/types')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('LeaveName', 'Casual Leave');
  });
});
