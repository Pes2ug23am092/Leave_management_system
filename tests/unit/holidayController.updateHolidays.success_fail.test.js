const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/src/services/holidayService', () => ({
  updateHolidaysForYear: jest.fn(),
}));

const holidayService = require('../../backend/src/services/holidayService');
const ctrl = require('../../backend/src/controllers/holidayController');

describe('holidayController.updateHolidays success/failure branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns success payload when adminKey valid and service succeeds', async () => {
    process.env.ADMIN_API_KEY = 'adminkey';
    holidayService.updateHolidaysForYear.mockResolvedValueOnce({ success: true, count: 5, year: 2025 });

    const req = createReq({ year: 2025, adminKey: 'adminkey' });
    const res = createRes();

    await ctrl.updateHolidays(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('message');
    expect(res.data).toHaveProperty('year', 2025);
    expect(res.data).toHaveProperty('count', 5);
  });

  test('returns 500 when adminKey valid but service signals failure', async () => {
    process.env.ADMIN_API_KEY = 'adminkey';
    holidayService.updateHolidaysForYear.mockResolvedValueOnce({ success: false, error: 'oops', year: 2024 });

    const req = createReq({ year: 2024, adminKey: 'adminkey' });
    const res = createRes();

    await ctrl.updateHolidays(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data).toHaveProperty('error');
    expect(res.data).toHaveProperty('year', 2024);
  });
});
