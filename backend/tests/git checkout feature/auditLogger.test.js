/**
 * @file tests/auditLogger.test.js
 * @description Tests for audit logging functionality (ELMS-27,28,85,91)
 */

const { logAction } = require("../src/utils/audit_logger");
const { pool } = require("../db/db");

jest.mock("../db/db", () => ({
  pool: { query: jest.fn() },
}));

describe("Audit Logger (ELMS-27,28,85,91)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should insert a successful login action", async () => {
    await logAction(1001, "login_success", 1);

    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO auditlog (EmpID, Action, Action_status) VALUES (?, ?, ?)",
      [1001, "login_success", 1]
    );
  });

  it("should insert a failed login action", async () => {
    await logAction(1001, "login_failure", 0);

    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO auditlog (EmpID, Action, Action_status) VALUES (?, ?, ?)",
      [1001, "login_failure", 0]
    );
  });

  it("should handle missing EmpID gracefully", async () => {
    await logAction(null, "logout");

    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO auditlog (EmpID, Action, Action_status) VALUES (?, ?, ?)",
      [null, "logout", 1]
    );
  });

  it("should log DB errors gracefully", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB Insert Failed"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await logAction(999, "login_failure");

    // More flexible matching to avoid Jest mismatch with multi-arg console.error
    const calls = consoleSpy.mock.calls.flat();
    expect(calls.join(" ")).toMatch(/Audit log failed/i);
    expect(calls.join(" ")).toMatch(/DB Insert Failed/i);

    consoleSpy.mockRestore();
  });
});
