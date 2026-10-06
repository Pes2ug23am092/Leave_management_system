const { createReq, createRes } = require('./helpers');

const mockGetConnection = jest.fn();
jest.mock('../../backend/db/db', () => ({
  pool: { getConnection: (...args) => mockGetConnection(...args) }
}));

jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveCancellationApproval: jest.fn(async () => true)
}));

const emailService = require('../../backend/src/services/emailService');
const ctrl = require('../../backend/src/controllers/leaveCancellationController');

describe('leaveCancellationController.handleCancellationRequest - approve', () => {
  beforeEach(() => {
    const conn = {
      beginTransaction: jest.fn(async () => {}),
      execute: jest.fn()
        // SELECT request
        .mockResolvedValueOnce([[{
          id: 5,
          leave_request_id: 100,
          EmpID: 22,
          FromDate: '2024-11-01',
          ToDate: '2024-11-03',
          LeaveTypeID: 2,
          LeaveName: 'Sick Leave',
          FirstName: 'Alice',
          LastName: 'Doe',
          Email: 'alice@example.com',
          ManagerFirstName: 'Bob',
          ManagerLastName: 'Smith'
        }]])
        // UPDATE leave_cancellation_requests
        .mockResolvedValueOnce([{}])
        // UPDATE Leave_details
        .mockResolvedValueOnce([{}])
        // UPDATE Emp_leave
        .mockResolvedValueOnce([{}]),
      commit: jest.fn(async () => {}),
      rollback: jest.fn(async () => {}),
      release: jest.fn(() => {})
    };
    mockGetConnection.mockResolvedValue(conn);
  });

  test('approves cancellation and sends email', async () => {
    const req = createReq({ action: 'approve', managerComments: 'ok' }, {
      params: { requestId: '5' },
      user: { id: 10, role: 'Manager' }
    });
    const res = createRes();

    await ctrl.handleCancellationRequest(req, res);

    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Cancellation approved successfully' });
    expect(emailService.notifyLeaveCancellationApproval).toHaveBeenCalled();
  });
});
