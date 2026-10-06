const request = require('supertest');
const { buildApp } = require('./helpers');

// system tests may start servers; allow a longer timeout
jest.setTimeout(15000);

describe('Public routes (system)', () => {
  test('GET /api/employees/test returns 200 and message', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/api/employees/test')
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Test route working');
    expect(res.body).toHaveProperty('timestamp');
  });
});
