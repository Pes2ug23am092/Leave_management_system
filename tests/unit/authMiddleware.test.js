const jwt = require('jsonwebtoken');
const middleware = require('../../backend/src/middleware/authMiddleware');
const { createRes } = require('./helpers');

describe('authMiddleware branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 when Authorization header missing', () => {
    const req = { headers: {}, method: 'GET', originalUrl: '/x' };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.data).toEqual({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for malformed header', () => {
    const req = { headers: { authorization: 'Bearer' }, method: 'GET', originalUrl: '/x' };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.data).toEqual({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when jwt.verify throws', () => {
    // provide an invalid/malformed token so jwt.verify throws
    const req = { headers: { authorization: 'Bearer abc' }, method: 'GET', originalUrl: '/x' };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.data).toEqual({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next and attaches user when token is valid', () => {
    const payload = { id: 1, role: 'Employee' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret');

    const req = { headers: { authorization: `Bearer ${token}` }, method: 'GET', originalUrl: '/x' };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(req.user).toEqual(expect.objectContaining(payload));
  });
});

function runMiddleware(mw, req) {
  return new Promise((resolve) => mw(req, { status: (c) => ({ json: (d) => resolve({ code: c, data: d }) }) }, () => resolve({ code: 200 })));
}

describe('authMiddleware (additional async style checks)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('401 when missing Authorization (async runner)', async () => {
    const res = await runMiddleware(middleware, { headers: {} });
    expect(res.code).toBe(401);
  });

  test('200 when valid Bearer token (async runner)', async () => {
    const payload = { id: 1, role: 'Employee' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret');
    const res = await runMiddleware(middleware, { headers: { authorization: `Bearer ${token}` } });
    expect(res.code).toBe(200);
  });
});
