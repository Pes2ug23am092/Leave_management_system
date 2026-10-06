const { createReq, createRes } = require('./helpers');

// Mock DB - include getConnection for transactional tests
jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const { applyLeave } = require('../../backend/src/controllers/leaveController');

describe('leaveController.applyLeave - simple invalid inputs', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when requestedDays <= 0 (invalid date range)', async () => {
    const req = createReq({ leaveTypeId: 1, fromDate: '2025-12-05', fromSession: 1, toDate: '2025-12-01', toSession: 2, reason: 'x' }, { user: { id: 10 } });
    const res = createRes();

    await applyLeave(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid date range or sessions selected.' });
  });

  test('returns 400 when leave type not found (transactional branch)', async () => {
    // Prepare a mocked connection that returns empty leaveTypeRows
    const mockConn = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        .mockResolvedValueOnce([[]]) // leaveTypeRows empty
        .mockResolvedValueOnce([[]]) // balanceRows (not reached)
      ,
      rollback: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined)
    };

    pool.getConnection.mockResolvedValue(mockConn);

    const req = createReq({ leaveTypeId: 99, fromDate: '2025-12-01', fromSession: 1, toDate: '2025-12-02', toSession: 1, reason: 'x' }, { user: { id: 33 } });
    const res = createRes();

    await applyLeave(req, res);

    expect(mockConn.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid leave type selected.' });
  });
});
