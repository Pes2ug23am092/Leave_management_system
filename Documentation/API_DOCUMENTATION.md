# LeaveItToUs — Backend API Documentation

This document describes the backend HTTP API for the LeaveItToUs application.

Base URL: http://{host}:{port}/api

Authentication: JWT Bearer token in the Authorization header for protected endpoints.
Header: Authorization: Bearer {token}

Common response shape:
- On success: HTTP 200 (or 201 for creations) and JSON body.
- On error: appropriate 4xx/5xx status and JSON { error: 'message' } or { message: '...' }.

Contents
- /api/auth
- /api/employees
- /api/holidays
- /api/admin
- /api/leave-cancellation

---

## /api/auth

### POST /api/auth/login
Description: Authenticate a user and return a JWT token.
Auth: Public

Request body (application/json):
{
  "email": "user@example.com",
  "password": "secret"
}

Success (200):
{
  "token": "<jwt>",
  "id": 123,
  "role": "Employee|Manager|Admin"
}

Errors:
- 401 — Invalid credentials
- 500 — Server error

Note: Passwords are hashed and verified using bcrypt in the backend implementation (see auth controller).

---

## /api/employees
Base: /api/employees — Most endpoints require Authorization header.

Protected routes require a valid JWT. The token payload includes { id, role } available as req.user.

### GET /api/employees/profile
Description: Get authenticated employee profile.
Auth: Bearer token
Success: 200, employee object (fields depend on DB schema)

### GET /api/employees/leave/types
Description: List leave types for current year.
Auth: Bearer token
Success: 200, Array of leave types: [{ LeaveTypeID, LeaveName, MaxDays, Year }, ...]

### GET /api/employees/leave/balances
Description: Get leave balances for the authenticated employee.
Auth: Bearer token
Success: 200, Array of balances: [{ label, total, current, taken }, ...]

### GET /api/employees/leave/requests
Description: Get leave requests (history) for authenticated employee.
Auth: Bearer token
Success: 200, Array of request objects with fields: id, type, from_date, to_date, from_session, to_session, status, reason, approver, days

### GET /api/employees/leave/team-requests
Description: Get team leave requests for the manager (requests of direct reports).
Auth: Bearer token
Success: 200, Array of requests (requires manager role to be meaningful)

### GET /api/employees/debug/me
Description: Dev debug route — returns req.user. Protected.
Auth: Bearer token

### GET /api/employees/test
Description: Public test route returning a timestamp. No auth required.

### POST /api/employees/leave/apply
Description: Apply for leave.
Auth: Bearer token

Request body (application/json):
{
  "leaveTypeId": <number>,
  "fromDate": "YYYY-MM-DD",
  "fromSession": 1|2, // 1=AM, 2=PM
  "toDate": "YYYY-MM-DD",
  "toSession": 1|2,
  "reason": "Optional reason text"
}

Success (201):
{
  "message": "Leave application submitted successfully, pending manager approval.",
  "leaveAppId": 456
}

Errors:
- 400 — Invalid date range or insufficient balance
- 500 — Server error

### GET /api/employees/team/timeoff
Description: Get aggregated team time off data for manager dashboard.
Auth: Bearer token

### GET /api/employees/team/leave-history
Description: Get team leave history.
Auth: Bearer token

### GET /api/employees/leave/activities
Description: Get recent leave activities for dashboard.
Auth: Bearer token

### GET /api/employees/manager/reports
Description: Manager reports endpoint.
Auth: Bearer token

### PUT /api/employees/leave/:leaveId/status
Description: Update leave status (Approve/Reject) by manager.
Auth: Bearer token (manager)

Request body:
{
  "status": "Approved" | "Rejected",
  "remarks": "Optional text"
}

Success (200): updated status and summary JSON.

### DELETE /api/employees/leave/:leaveId/cancel
Description: Cancel an approved leave (manager action).
Auth: Bearer token (manager)
Request body (optional): { reason: '...' }

Success (200): confirmation and restored balance info.

---

## /api/holidays

### GET /api/holidays/upcoming
Description: Get upcoming holidays (public).
Auth: None
Success: 200, array of holiday objects

### GET /api/holidays/:year
Description: Get holidays for a specific year (public).
Auth: None
Success: 200, array of holidays

### POST /api/holidays/update
Description: Admin/internal endpoint to update holidays from external source.
Auth: (currently not protected in routes file) — treat as protected in production.
Success: 200, update result

Sample holiday object (example):
```json
{
  "id": 12,
  "name": "Republic Day",
  "date": "2025-01-26",
  "type": "Public"
}
```

---

## /api/admin
Base: /api/admin — All routes require Admin role (middleware enforces adminOnly)

### GET /api/admin/metrics
Description: Admin dashboard metrics.
Auth: Bearer token (Admin)

### GET /api/admin/stats
Description: System statistics.
Auth: Bearer token (Admin)

### GET /api/admin/employees
Description: List all employees.
Auth: Admin

### POST /api/admin/employees
Description: Create a new employee.
Auth: Admin
Request body: employee fields (depends on DB schema)

Request body (application/json) example:
```json
{
  "firstName": "Alice",
  "lastName": "Rao",
  "email": "alice.ra o@example.com",
  "role": "Employee", // Employee|Manager|Admin
  "managerId": 23,
  "designation": "Software Engineer",
  "startDate": "2024-07-01"
}
```

Success (201) example:
```json
{
  "message": "Employee created",
  "empId": 789
}
```

### PUT /api/admin/employees/:empId
Description: Update an employee.
Auth: Admin

### DELETE /api/admin/employees/:empId
Description: Delete an employee.
Auth: Admin

### GET /api/admin/leave-types
Description: List leave types (Admin).
Auth: Admin

### POST /api/admin/leave-types
Description: Create a leave type.
Auth: Admin
Request body (application/json) example:
```json
{
  "name": "Casual Leave",
  "maxDays": 12,
  "carryForward": true,
  "year": 2025
}
```

Success (201) example:
```json
{
  "message": "Leave type created",
  "leaveTypeId": 34
}
```
### PUT /api/admin/leave-types/:leaveTypeId
Description: Update a leave type.
Auth: Admin

### DELETE /api/admin/leave-types/:leaveTypeId
Description: Delete a leave type.
Auth: Admin

### GET /api/admin/holidays
Description: Get holidays (Admin view).
Auth: Admin

### POST /api/admin/holidays
Description: Create holiday.
Auth: Admin

### PUT /api/admin/holidays/:holidayId
Description: Update holiday.
Auth: Admin

### DELETE /api/admin/holidays/:holidayId
Description: Delete holiday.
Auth: Admin

---

## /api/leave-cancellation
Base: /api/leave-cancellation — Handles employee and manager flows for cancelling leaves

### POST /api/leave-cancellation/request
Description: Employee requests to cancel a leave.
Auth: Bearer token

Request body:
{
  "leaveAppId": <number>,
  "cancellationReason": "..."
}

Success: 200 — either direct cancellation (if pending) or created cancellation request

### GET /api/leave-cancellation/my-requests
Description: Employee gets their cancellation request history.
Auth: Bearer token

### GET /api/leave-cancellation/pending
Description: Manager/Admin gets pending cancellation requests for approval.
Auth: Bearer token (Manager/Admin)

### PUT /api/leave-cancellation/handle/:requestId
Description: Manager approves or rejects a cancellation request.
Auth: Bearer token (Manager/Admin)

Request body:
{
  "action": "approve" | "reject",
  "managerComments": "optional"
}

Success: 200 — approval/rejection result

---

## Authentication and Roles
- Login returns a JWT. Include it as: Authorization: Bearer <token>
- Token payload includes id and role. The middleware enforces protected routes.
- Admin-only routes are protected by `adminOnly` middleware in `adminRoutes.js`.

## Error handling and logging
- The server logs actions and warnings to the console. Common status codes are used: 200, 201, 400, 401, 403, 404, 500.

## Notes and recommendations
- Some debug routes (e.g., `/api/employees/debug/emp_leave/:empId`) are present and should be removed or protected in production.
- The holiday update endpoint is currently public in `holidayRoutes.js` — consider adding admin auth.
- Request/response shapes are derived from controller queries. For precise field names, refer to the controller query SELECT lists.

---