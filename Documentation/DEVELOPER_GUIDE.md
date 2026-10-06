# Developer Guide — LeaveItToUs (Automated Leave Management System)

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Maintainers:** LeaveItToUs Dev Team (@Deepthi-PES1UG23AM092, @Pes1ug23am915, @pes1ug23am117, @ChiragGD)

## Table of Contents
1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Local Environment Setup](#3-local-environment-setup)
4. [Project Structure](#4-project-structure-relevant-backend-parts)
5. [Auth Flow](#5-auth-flow)
6. [Adding New Endpoints](#6-adding-new-endpoints)
7. [Database Access Guidelines](#7-database-access-guidelines)
8. [Email Notifications](#8-email-notifications)
9. [Testing Strategy](#9-testing-strategy)
10. [Coding Conventions](#10-coding-conventions)
11. [Performance & Security Considerations](#11-performance--security-considerations)
12. [Troubleshooting](#12-troubleshooting)
13. [Deployment Notes](#13-deployment-notes)
14. [Future Enhancements](#14-future-enhancements)
15. [Quick Reference](#15-quick-reference)

---

## 1. Overview

The Automated Leave Management System (ALMS) manages employee leave applications, approvals, cancellations, and holiday data. It consists of:

Backend: Node.js (Express 5) + MySQL (via mysql2) + JWT auth + email notifications (Nodemailer).

Frontend: React (Create React App) consuming /api/* endpoints.

Supporting scripts: DB initialization, holiday import, email diagnostics.

### High-Level Architecture
```
React SPA (frontend) --> REST API (Express) --> MySQL DB
                                   |-> Email Service (SMTP/Ethereal)
                                   |-> Holiday Service (external API)
```


Key backend layers:

Routes: (backend/src/routes/*) define endpoint paths.

Controllers: (backend/src/controllers/*) handle business logic and DB access.

Middleware: (backend/src/middleware/*) for authentication and admin checks.

Services: (backend/src/services/*) handle email and external integrations.

DB utilities: (backend/db/*) for schema creation and connection management.

## 2. Tech Stack

Backend dependencies: Express 5, mysql2, bcrypt, jsonwebtoken, helmet, cors, nodemailer, node-cron.
Frontend dependencies: React 19, react-router-dom, Chart.js, axios, testing-library.
Testing: Jest + Supertest (tests/*).

## 3. Local Environment Setup
### Prerequisites
* Node.js 18+ (LTS recommended)
* npm 9+
* MySQL Server 8.x (or MariaDB)
* Git

### Clone & Install
```bash
git clone https://github.com/pestechnology/PESU_RR_AIML_B_P12_Automated_Leave_Management_System_LeaveItToUs.git
cd PESU_RR_AIML_B_P12_Automated_Leave_Management_System_LeaveItToUs
```
Install backend & frontend dependencies:
```bash
cd backend
npm install
cd ../frontend
npm install
```

### Environment Variables (backend/.env)
```env
PORT=5000
JWT_SECRET=change_me
JWT_EXPIRES_IN=1d
DB_HOST=localhost
DB_USER=root
DB_PASS=your_db_password
DB_NAME=lms
DB_PORT=3306
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
EMAIL_MODE=ethereal
DEV_EMAIL_REDIRECT=your.address@gmail.com
ADMIN_API_KEY=super_secret_admin_key
```


See backend/EMAIL_SETUP.md for detailed configuration.

### Initialize Database
Use SQL scripts in `backend/db/sql/*`:
* `LMS_schema.sql`
* `Sample_data_lms.sql` (optional seed)
* `holidays_data.sql` (optional seed)

Or run:
```bash
cd backend
node db/execute_sql.js
```

### Default Login Credentials (sample data)
| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@example.com   | admin123   |
| Manager | manager@example.com | manager123 |
| Employee| employee@example.com| employee123|
### Running the Servers
Backend:
```bash
cd backend
npm run dev
```
Runs on http://localhost:5000

Frontend:
```bash
cd frontend
npm start
```
Runs on http://localhost:3000 (adjust CORS origins in `server.js` if needed).

## 4. Project Structure (Relevant Backend Parts)
```
backend/
  server.js
  .env
  src/
    routes/
    controllers/
    middleware/
    services/
    utils/
  db/
    db.js
    execute_sql.js
    sql/
  scripts/
frontend/
  src/
```

## 5. Auth Flow

POST /api/auth/login → Validate credentials (bcrypt).

Returns JWT { id, role } signed with JWT_SECRET.

Protected routes use authMiddleware to verify token.

adminOnly middleware restricts admin routes.

**Example JWT Payload**
```json
{
  "id": 3,
  "role": "Manager",
  "iat": 1731115200,
  "exp": 1731158400
}
```

## 6. Adding New Endpoints

Pattern: Route → Controller → (Optional) Service → DB queries

Steps:

Create a controller in src/controllers/.

Map it in src/routes/.

Use pool.query() for DB access.

Protect routes with authMiddleware.

Document endpoint in API_DOCUMENTATION.md.

**Example:**
```js
// src/controllers/exampleController.js
async function getPing(req, res) {
  res.json({ status: 'ok', timestamp: Date.now() });
}
module.exports = { getPing };

// src/routes/exampleRoutes.js
const express = require('express');
const router = express.Router();
const { getPing } = require('../controllers/exampleController');
const authMiddleware = require('../middleware/authMiddleware');
router.get('/ping', authMiddleware, getPing);
module.exports = router;

// server.js (mount)
const exampleRoutes = require('./src/routes/exampleRoutes');
app.use('/api/example', exampleRoutes);
```

## 7. Database Access Guidelines

Always use parameter placeholders (?).

Use transactions for multi-step operations.

Release connections in finally.

Use logAction for audit trails.

✅ Use YYYY-MM-DD format for all date columns.

## 8. Email Notifications

Triggered on:

Leave application submission → Notify manager.

Leave approval/rejection → Notify employee.

Cancellation request/approval → Notify relevant parties.

Ethereal preview:

When EMAIL_MODE=ethereal, check the console for a preview URL such as
Preview URL: https://ethereal.email/message/<id>.

## 9. Testing Strategy

Unit Tests: pure logic (tests/unit/*).

Integration Tests: full API flow (tests/integration/*).

Run:
```bash
npm run test:unit
npm run test:integration
```


Integration test sample:
```js
const request = require('supertest');
const app = require('../../backend/server');

describe('Auth login', () => {
  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@y.com', password: 'bad' });
    expect(res.status).toBe(401);
  });
});
```


Ensure server.js exports the Express app (not just starts it) for Supertest imports.

## 10. Coding Conventions

Use CommonJS (require/module.exports).

Keep controller functions async with try/catch.

Return JSON: { message }, { error }, or structured data.

Don’t expose SQL errors directly.

(Optional) Use ESLint + Prettier for consistency.

## 11. Performance & Security Considerations

Helmet for HTTP header protection.

Strict CORS whitelisting in server.js.

Rotate JWT_SECRET periodically.

Validate inputs via express-validator.

Add express-rate-limit for auth endpoints (future).

Never commit .env to version control.

## 12. Troubleshooting
| Issue | Symptom | Fix |
|-------|---------|-----|
| DB connection fails | "Database connection failed" | Check `.env` DB credentials; verify MySQL running |
| CORS blocked | Browser console CORS error | Add frontend origin to CORS config in `server.js` |
| Invalid token | 401 Unauthorized | Check `Authorization: Bearer <token>` format / expiry |
| Emails not sending | No preview or SMTP error | Run `node backend/scripts/diagnose-email.js you@x.com` |
| Holidays empty | `/api/holidays/upcoming` returns [] | Run holiday init: `node backend/scripts/init-holidays.js` |
| Leave balance incorrect | Negative or zero | Inspect `Emp_leave` rows; review `calculateDays` logic |
| Frontend API 404s | Requests fail | Ensure reverse proxy preserves `/api` prefix |
## 13. Deployment Notes

Use PM2 or Docker for backend.

Set NODE_ENV=production and disable Ethereal.

Serve frontend build via Nginx or static host.

Enforce HTTPS.

Example (PM2):
```bash
pm2 start backend/server.js --name leaveit_backend
pm2 logs leaveit_backend
pm2 restart leaveit_backend
```

## 14. Future Enhancements

Add Swagger/OpenAPI 3.0 spec.

Add role-based UI restrictions in frontend.

Add pagination to large lists.

Implement rate limiting.

Add CI pipeline with coverage reports.

Migrate role checks to a permission table (RBAC model).

## 15. Quick Reference
| Component | File(s) |
|-----------|---------|
| Entry Point | `backend/server.js` |
| Auth Controller | `backend/src/controllers/authController.js` |
| Leave Logic | `backend/src/controllers/leaveController.js` |
| Email Service | `backend/src/services/emailService.js` |
| Routes | `backend/src/routes/*` |
| DB Pool | `backend/db/db.js` |
| API Docs | `backend/API_DOCUMENTATION.md` |
| Email Setup | `backend/EMAIL_SETUP.md` |

---
Maintained by the LeaveItToUs Team. Update this guide when adding major features or infrastructure changes.