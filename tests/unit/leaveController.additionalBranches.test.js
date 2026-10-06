const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { getConnection: jest.fn(), query: jest.fn() } }));
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApproval: jest.fn().mockResolvedValue(undefined),
  notifyLeaveRejection: jest.fn().mockResolvedValue(undefined),
  notifyLeaveApplication: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));

const { pool } = require('../../backend/db/db');
const emailService = require('../../backend/src/services/emailService');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController additional branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('updateLeaveStatus returns 400 when insufficient balance to approve', async () => {
    const req = createReq({ status: 'Approved' }, { params: { leaveId: 123 }, user: { id: 9 } });
    const res = createRes();

    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        // 1. SELECT leaveDetails -> returns one pending leave with EmpLeaveID and small balance
        .mockResolvedValueOnce([[{
          LeaveAppID: 123,
          EmpLeaveID: 77,
          LeaveBalance: 0.5,
          LeaveTaken: 1,
          FromDate: '2025-12-01',
          ToDate: '2025-12-02',
          FromSession: 1,
          ToSession: 1,
          FirstName: 'X', LastName: 'Y', Email: 'x@y.com', ManagerFirstName: 'M', ManagerLastName: 'G', ManagerEmail: 'mgr@e.com', MaxDays: 10
        }]])
        // subsequent queries won't be reached but mock generic response
        .mockResolvedValue([{}]),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };

    pool.getConnection.mockResolvedValue(connection);

    await leaveController.updateLeaveStatus(req, res);

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  test('updateLeaveStatus handles email failure without failing operation (notify throws)', async () => {
    const req = createReq({ status: 'Approved' }, { params: { leaveId: 124 }, user: { id: 11 } });
    const res = createRes();

    // connection flow: has EmpLeaveID and sufficient balance
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        // 1. SELECT leaveDetails -> returns one pending leave with EmpLeaveID
        .mockResolvedValueOnce([[{
          LeaveAppID: 124,
          EmpLeaveID: 88,
          LeaveBalance: 5,
          LeaveTaken: 0,
          FromDate: '2025-12-01',
          ToDate: '2025-12-01',
          FromSession: 1,
          ToSession: 2,
          FirstName: 'E', LastName: 'F', Email: 'e@f.com', ManagerFirstName: 'M', ManagerLastName: 'G', ManagerEmail: 'mgr@e.com', LeaveName: 'Annual', MaxDays: 10
        }]])
        // 2. UPDATE Leave_details
        .mockResolvedValueOnce([{}])
        // 3. UPDATE Emp_leave
        .mockResolvedValueOnce([{}]),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };

    pool.getConnection.mockResolvedValue(connection);

    // Make email service throw when notifyLeaveApproval is called
    emailService.notifyLeaveApproval.mockRejectedValueOnce(new Error('SMTP fail'));

    await leaveController.updateLeaveStatus(req, res);

    // Operation should commit despite email failure and return success
    expect(connection.commit).toHaveBeenCalled();
    expect(emailService.notifyLeaveApproval).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  test('getTeamLeaveRequests returns 500 when DB errors', async () => {
    const req = createReq({}, { user: { id: 5 } });
    const res = createRes();

    pool.query.mockRejectedValueOnce(new Error('db fail'));

    await leaveController.getTeamLeaveRequests(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });
});
