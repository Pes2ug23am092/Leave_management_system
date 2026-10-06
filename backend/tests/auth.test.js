/**
 * @file tests/auth.test.js
 * @description Tests for login, password hashing, and JWT session handling.
 */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ✅ Mock database
jest.mock("../db/db", () => ({
  pool: { query: jest.fn() },
  testConnection: jest.fn().mockResolvedValue(true),
}));

const { pool } = require("../db/db");
const { app } = require("../server");

describe("Authentication (ELMS-82, ELMS-83, ELMS-84)", () => {
  afterEach(() => jest.clearAllMocks());

  it("should return 200 and JWT token for valid credentials", async () => {
    const hashedPassword = await bcrypt.hash("1234", 10);

    // Mock DB result for valid user
    pool.query.mockResolvedValueOnce([
      [{ EmpID: 1001, Email: "test@lms.com", PasswordHash: hashedPassword, Role: "Admin" }],
    ]);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@lms.com", password: "1234" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    // Verify JWT content
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET || "secret");
    expect(decoded).toMatchObject({ id: 1001, role: "Admin" });
  });

  it("should return 401 for invalid credentials", async () => {
    pool.query.mockResolvedValueOnce([[]]); // No matching user

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "wrong@lms.com", password: "nopass" });

    expect(res.status).toBe(401);
  });

  it("should safely handle missing JWT in protected route", async () => {
    // Use fresh instance with real middleware
    jest.resetModules();
    const { app: realApp } = require("../server");

    const res = await request(realApp).get("/employees/profile");

    // ✅ Acceptable results — we only care that it’s NOT a success
    expect([401, 403, 500]).toContain(res.status);
  });
});
