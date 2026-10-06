const request = require('supertest');

// Mock DB first, before importing app helpers/routes
const mockPool = { query: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));

// Mock bcrypt virtually (must return true only when password matches stored hash scenario)
jest.mock('bcrypt', () => ({ compare: jest.fn(async (p, h) => p === 'pass123' && h === '$2b$10$testhash') }), { virtual: true });

// Mock audit logger to avoid side effects
jest.mock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn() }));

const { buildApp } = require('./helpers');

describe('POST /api/auth/login (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('200 and token on valid credentials', async () => {
    // Return employee with a known password hash the mocked bcrypt will treat as matching
    mockPool.query.mockResolvedValueOnce([[{ EmpID: 1, PasswordHash: '$2b$10$testhash', Role: 'Employee' }]]);
    const app = buildApp();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'pass123' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('role', 'Employee');
  });

  test('401 on invalid password', async () => {
    mockPool.query.mockResolvedValueOnce([[{ EmpID: 2, PasswordHash: '$2b$10$testhash', Role: 'Employee' }]]);
    const app = buildApp();

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'wrong' })
      .expect(401);
  });

  test('401 when user not found', async () => {
    mockPool.query.mockResolvedValueOnce([[]]);
    const app = buildApp();

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'pass123' })
      .expect(401);
  });
});
