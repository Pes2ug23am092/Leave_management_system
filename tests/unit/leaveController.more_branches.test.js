const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApproval: jest.fn().mockResolvedValue(undefined),
  notifyLeaveRejection: jest.fn().mockResolvedValue(undefined),
  notifyLeaveApplication: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../backend/src/utils/audit_logger', () => ({ logAction: jest.fn().mockResolvedValue(undefined) }));
const { pool } = require('../../backend/db/db');
const emailService = require('../../backend/src/services/emailService');
const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController more branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('updateLeaveStatus returns 404 when leaveDetails empty', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValueOnce([[]]), // leaveDetails empty
      rollback: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn(),
      release: jest.fn().mockResolvedValue(undefined)
    };
    pool.getConnection.mockResolvedValue(connection);

    const req = createReq({}, { params: { leaveId: 999 }, user: { id: 5 } });
    const res = createRes();

    await leaveController.updateLeaveStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Leave request not found or already processed.' });
    expect(connection.rollback).toHaveBeenCalled();
  });

  test('updateLeaveStatus returns 400 when insufficient balance for approve', async () => {
    const leaveRow = [{
      LeaveAppID: 88,
      EmpLeaveID: 10,
      LeaveBalance: 0, // insufficient
      LeaveTaken: 0,
      FromDate: '2025-12-01', ToDate: '2025-12-02', FromSession: 1, ToSession: 2,
      FirstName: 'A', LastName: 'B', Email: 'a@b.com', LeaveName: 'Annual'
    }];

    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        .mockResolvedValueOnce([leaveRow]) // leaveDetails
        .mockResolvedValueOnce([{}]), // (would be insert/create) not reached
      rollback: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn(),
      release: jest.fn().mockResolvedValue(undefined)
    };
    pool.getConnection.mockResolvedValue(connection);

    const req = createReq({ status: 'Approved' }, { params: { leaveId: 88 }, user: { id: 10 } });
    const res = createRes();

    await leaveController.updateLeaveStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Cannot approve') }));
  });

  test('updateLeaveStatus rejection path sends rejection email', async () => {
    const leaveRow = [{
      LeaveAppID: 77,
      EmpLeaveID: 200,
      LeaveBalance: 10,
      LeaveTaken: 1,
      FromDate: '2025-12-01', ToDate: '2025-12-01', FromSession: 1, ToSession: 2,
      FirstName: 'A', LastName: 'B', Email: 'a@b.com', ManagerFirstName: 'M', ManagerLastName: 'G', ManagerEmail: 'mgr@e.com', LeaveName: 'Sick'
    }];

    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        .mockResolvedValueOnce([leaveRow]) // leaveDetails
        .mockResolvedValueOnce([{}]) // update
        .mockResolvedValueOnce([{}]),
      rollback: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined)
    };
    pool.getConnection.mockResolvedValue(connection);

    const req = createReq({ status: 'Rejected', remarks: 'Not eligible' }, { params: { leaveId: 77 }, user: { id: 10 } });
    const res = createRes();

    await leaveController.updateLeaveStatus(req, res);

    expect(emailService.notifyLeaveRejection).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  test('getLeaveTypes logs when some types missing fields (validTypes length differs)', async () => {
    const badTypes = [{ LeaveTypeID: 1 }, { LeaveTypeID: 2, LeaveName: 'Annual' }];
    pool.query.mockResolvedValueOnce([badTypes]);
    const req = createReq();
    const res = createRes();

    await leaveController.getLeaveTypes(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([{ LeaveTypeID: 2, LeaveName: 'Annual' }]));
  });

  test('applyLeave returns 400 when empDetails empty (employee or manager missing)', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        .mockResolvedValueOnce([[{ LeaveTypeID: 9, MaxDays: 10 }]]) // leaveTypeRows
        .mockResolvedValueOnce([[]]) // balanceRows
        // Response for INSERT INTO Emp_leave (insertId)
        .mockResolvedValueOnce([{ insertId: 555 }])
        .mockResolvedValueOnce([[]]) // empDetails empty
      ,
      commit: jest.fn(),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined)
    };
    pool.getConnection.mockResolvedValue(connection);

    const body = { leaveTypeId: 9, fromDate: '2025-12-01', fromSession: 1, toDate: '2025-12-02', toSession: 2, reason: 'x' };
    const req = createReq(body, { user: { id: 33 } });
    const res = createRes();

    await leaveController.applyLeave(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Employee or manager details not found.' });
  });
});
