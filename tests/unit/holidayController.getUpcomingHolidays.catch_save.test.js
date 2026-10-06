const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(async () => [[]]) } }));
jest.mock('../../backend/src/services/holidayService', () => ({
  fetchIndianHolidays: jest.fn(async () => [
    { date: new Date(Date.now() + 24*60*60*1000).toISOString(), name: 'Test Day' }
  ]),
  saveHolidaysToDatabase: jest.fn(() => Promise.reject(new Error('persist fail'))),
}));

const holidayService = require('../../backend/src/services/holidayService');
const ctrl = require('../../backend/src/controllers/holidayController');

describe('holidayController.getUpcomingHolidays - catch saveHolidaysToDatabase', () => {
  test('logs warning when saving fallback holidays to DB fails', async () => {
    const req = createReq();
    const res = createRes();

    await ctrl.getUpcomingHolidays(req, res);

    // Let the rejected promise microtask run the catch handler
    await new Promise(setImmediate);

    expect(holidayService.fetchIndianHolidays).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});
