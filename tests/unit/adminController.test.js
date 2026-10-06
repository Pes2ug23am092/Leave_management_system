const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

const admin = require('../../backend/src/controllers/adminController');

describe('adminController basic behaviors', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAdminMetrics returns metrics shape', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 10 }]]) // employeeCount
      .mockResolvedValueOnce([[{ total: 100 }]]) // leaveDaysTaken
      .mockResolvedValueOnce([[{ total: 5 }]]) // pendingRequests
      .mockResolvedValueOnce([[{ total: 2 }]]); // approvedToday

    const req = createReq({}, { user: { id: 1 } });
    const res = createRes();

    await admin.getAdminMetrics(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(res.data).toHaveProperty('totalEmployees');
    expect(res.data.totalEmployees).toBe(10);
  });

  test('getAllEmployees returns list', async () => {
    pool.query.mockResolvedValueOnce([[{ EmpID: 1, FirstName: 'X' }]]);
    const req = createReq();
    const res = createRes();

    await admin.getAllEmployees(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(res.data[0]).toHaveProperty('FirstName');
  });

  test('createHoliday returns 400 when missing fields', async () => {
    const req = createReq({}, { body: { year: 2025 } });
    const res = createRes();

    await admin.createHoliday(req, res);

    expect(res.statusCode).toBe(400);
  });

  test('deleteHoliday returns 404 when not found', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const req = createReq({}, { params: { holidayId: '99' } });
    const res = createRes();

    await admin.deleteHoliday(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('createHoliday succeeds and returns id', async () => {
    // existing check -> no existing
    pool.query
      .mockResolvedValueOnce([[]])
      // insert result
      .mockResolvedValueOnce([{ insertId: 321 }]);

  const req = createReq({ year: 2025, holidayDate: '2025-12-25', holidayName: 'Xmas' });
    const res = createRes();

    await admin.createHoliday(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.data).toHaveProperty('holidayId', 321);
  });

  test('deleteHoliday returns 200 when deleted', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const req = createReq({}, { params: { holidayId: '5' } });
    const res = createRes();

    await admin.deleteHoliday(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(res.data).toHaveProperty('message');
  });
});
