const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock DB pool with getConnection flow
const mockPool = {
  getConnection: jest.fn(),
  query: jest.fn()
};

jest.mock('../../backend/db/db', () => ({ pool: mockPool }));

// Mock email service so applyLeave doesn't fail on sending
jest.mock('../../backend/src/services/emailService', () => ({
  notifyLeaveApplication: jest.fn().mockResolvedValue(true)
}));
const emailService = require('../../backend/src/services/emailService');

const { buildApp } = require('./helpers');

describe('POST /api/employees/leave/apply (system)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('applies for leave successfully (creates balance + leave row)', async () => {
    // Prepare connection mock object
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn()
    };

    // pool.getConnection returns our connection
    mockPool.getConnection.mockResolvedValue(connection);

    const currentYear = new Date().getFullYear();

    // 1st query inside applyLeave: select leave type
    connection.query.mockResolvedValueOnce([[{ LeaveTypeID: 7, MaxDays: 12 }]]);

    // 2nd query: select balance rows -> none
    connection.query.mockResolvedValueOnce([[]]);

    // 3rd query: insert Emp_leave -> return insertId
    connection.query.mockResolvedValueOnce([{ insertId: 101 }]);

    // 4th query: select emp details with manager -> return a row
    connection.query.mockResolvedValueOnce([[{ FirstName: 'John', LastName: 'Doe', Email: 'john@example.com', ManagerEmail: 'mgr@example.com', LeaveName: 'Casual' }]]);

    // 5th query: insert into Leave_details -> return insertId
    connection.query.mockResolvedValueOnce([{ insertId: 555 }]);

    process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: 777, role: 'Employee' }, process.env.JWT_SECRET);

    const app = buildApp();

    const res = await request(app)
      .post('/api/employees/leave/apply')
      .set('Authorization', `Bearer ${token}`)
      .send({
        leaveTypeId: 7,
        fromDate: '2025-12-01',
        fromSession: 1,
        toDate: '2025-12-02',
        toSession: 2,
        reason: 'Vacation'
      })
      .expect(201);

    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('leaveAppId');
    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.commit).toHaveBeenCalled();
    expect(emailService.notifyLeaveApplication).toHaveBeenCalled();
  });
});
