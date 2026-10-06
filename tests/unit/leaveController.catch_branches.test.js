const { createReq, createRes } = require('./helpers');

const mockPool = { query: jest.fn(), getConnection: jest.fn() };
jest.mock('../../backend/db/db', () => ({ pool: mockPool }));

const leaveController = require('../../backend/src/controllers/leaveController');

describe('leaveController catch branches (simple)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getLeaveBalances returns 500 when DB query throws', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('db boom'));

    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await leaveController.getLeaveBalances(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.data).toEqual({ error: 'Failed to fetch leave balances' });
  });

  test('debugEmpLeave returns 500 when DB query throws', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('debug fail'));

    const req = createReq({}, { params: { empId: 9 } });
    const res = createRes();

    await leaveController.debugEmpLeave(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.data).toEqual({ error: 'Failed to fetch Emp_leave rows' });
  });

  test('getLeaveRequests returns 500 when DB query throws', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('rq fail'));

    const req = createReq({}, { user: { id: 5 } });
    const res = createRes();

    await leaveController.getLeaveRequests(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.data).toEqual({ error: 'Failed to fetch leave requests' });
  });
});
