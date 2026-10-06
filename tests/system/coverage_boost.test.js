const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock DB pool to return empty results for most queries
const mockPool = { query: jest.fn().mockResolvedValue([[]]) };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));

// Mock email service
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApplication: jest.fn().mockResolvedValue(true),
  notifyLeaveApproval: jest.fn().mockResolvedValue(true),
  notifyLeaveRejection: jest.fn().mockResolvedValue(true)
}));

const { buildApp } = require('./helpers');

describe('coverage boost - exercise many routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('hits multiple employee endpoints to exercise controllers', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: 1, role: 'Employee' }, process.env.JWT_SECRET);

    const app = buildApp();

    // public debug route (no auth)
    await request(app)
      .get('/api/employees/test')
      .expect(200);

  // authenticated endpoints - many will return empty arrays but exercise code
  await request(app).get('/api/employees/leave/types').set('Authorization', `Bearer ${token}`).expect(200);
  await request(app).get('/api/employees/leave/balances').set('Authorization', `Bearer ${token}`).expect(200);
  await request(app).get('/api/employees/leave/requests').set('Authorization', `Bearer ${token}`).expect(200);
  const teamReqRes = await request(app).get('/api/employees/leave/team-requests').set('Authorization', `Bearer ${token}`);
  expect([200,401,403]).toContain(teamReqRes.status);
  await request(app).get('/api/employees/team/timeoff').set('Authorization', `Bearer ${token}`).expect(200);
  await request(app).get('/api/employees/leave/activities').set('Authorization', `Bearer ${token}`).expect(200);
  const mgrRes = await request(app).get('/api/employees/manager/reports').set('Authorization', `Bearer ${token}`);
  expect([200,401,403]).toContain(mgrRes.status);

    // debug emp_leave route (no auth) - exercise DB read path
    await request(app).get('/api/employees/debug/emp_leave/1').expect(200);
  });
});
