require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

module.exports = function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    console.warn('🔒 AuthMiddleware: No Authorization header for', req.method, req.originalUrl);
    return res.status(401).json({ message: 'No token provided' });
  }

  const parts = auth.split(' ');
  const scheme = parts[0];
  const token = parts[1];

  if (!/^Bearer$/i.test(scheme) || !token) {
    console.warn('🔒 AuthMiddleware: Malformed Authorization header for', req.method, req.originalUrl, 'header=', auth);
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch (err) {
    console.warn('🔒 AuthMiddleware: JWT verification failed:', err?.message || err, 'for', req.method, req.originalUrl);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
