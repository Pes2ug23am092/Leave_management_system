const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(async () => [[{ date: '2025-01-01', name: 'New Year', dayOfWeek: 'Wednesday' }]]) } }));
const ctrl = require('../../backend/src/controllers/holidayController');

describe('holidayController.getHolidaysByYear default year branch', () => {
  test('uses current year when params.year missing', async () => {
    const req = createReq();
    const res = createRes();

    await ctrl.getHolidaysByYear(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('year');
    expect(res.data).toHaveProperty('count', 1);
    expect(Array.isArray(res.data.holidays)).toBe(true);
  });
});
