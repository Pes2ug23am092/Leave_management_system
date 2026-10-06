const request = require('supertest');
const jwt = require('jsonwebtoken');

// No DB calls expected for validation failure path
const mockPool = { query: jest.fn(), getConnection: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));

const { buildApp } = require('./helpers');

function authHeader(payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret');
  return { Authorization: `Bearer ${token}` };
}

describe('POST /api/employees/leave/apply validation (integration)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('400 when invalid date range (fromDate > toDate)', async () => {
    const app = buildApp();

    const res = await request(app)
      .post('/api/employees/leave/apply')
      .set(authHeader({ id: 1, role: 'Employee' }))
      .send({
        leaveTypeId: 1,
        fromDate: '2025-12-10',
        toDate: '2025-12-05',
        fromSession: 1,
        toSession: 2,
        reason: 'test'
      })
      .expect(400);

    expect(res.body).toHaveProperty('message');
  });
});
