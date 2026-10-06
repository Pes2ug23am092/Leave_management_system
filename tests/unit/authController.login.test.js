const { createReq, createRes } = require('./helpers');

// We'll mock DB, bcrypt, jwt and audit logger inside each isolated test to
// avoid cross-test interference from global mocks.

describe('authController.login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns token on valid credentials', async () => {
    const req = createReq({ email: 'user@example.com', password: 'correct' });
    const res = createRes();

    // Isolate modules and provide fresh mocks for this execution so other test files
    // running in parallel can't interfere with our mocked DB/bcrypt/jwt behavior.
    await jest.isolateModulesAsync(async () => {
      jest.resetModules();

      // Mock bcrypt and jwt as virtual modules
      jest.doMock('bcrypt', () => ({ compare: jest.fn().mockResolvedValue(true) }), { virtual: true });
      jest.doMock('jsonwebtoken', () => ({ sign: jest.fn().mockReturnValue('fake-token') }), { virtual: true });
      jest.doMock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }), { virtual: true });

      // Mock the DB module by its resolved path so the controller's relative require resolves to this mock
      const dbPath = require.resolve('../../backend/db/db');
      jest.doMock(dbPath, () => ({ pool: { query: jest.fn().mockResolvedValue([[{ EmpID: 1, PasswordHash: 'hash', Role: 'Employee' }]]) } }), { virtual: true });

      const { login } = require('../../backend/src/controllers/authController');
      await login(req, res);
    });

    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('token');
    expect(payload).toHaveProperty('role', 'Employee');
  });

  test('401 on invalid credentials', async () => {
    const req = createReq({ email: 'user@example.com', password: 'wrong' });
    const res = createRes();

    await jest.isolateModulesAsync(async () => {
      jest.resetModules();

      jest.doMock('bcrypt', () => ({ compare: jest.fn().mockResolvedValue(false) }), { virtual: true });
      jest.doMock('jsonwebtoken', () => ({ sign: jest.fn().mockReturnValue('fake-token') }), { virtual: true });
      jest.doMock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }), { virtual: true });

      const dbPath = require.resolve('../../backend/db/db');
      jest.doMock(dbPath, () => ({ pool: { query: jest.fn().mockResolvedValue([[{ EmpID: 1, PasswordHash: 'hash', Role: 'Employee' }]]) } }), { virtual: true });

      const { login } = require('../../backend/src/controllers/authController');
      await login(req, res);
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });
});
