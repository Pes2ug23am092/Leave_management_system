const { createReq, createRes } = require('./helpers');

const mockQuery = jest.fn()
jest.mock('../../backend/db/db', () => ({
  pool: {
    query: (...args) => mockQuery(...args)
  }
}));

jest.mock('../../backend/src/services/holidayService', () => ({
  fetchIndianHolidays: jest.fn(async () => ([
    { date: '2099-01-01', name: 'New Year' },
    { date: '2099-01-02', name: 'Another Day' },
    { date: '1999-01-03', name: 'Old Day' },
  ])),
  saveHolidaysToDatabase: jest.fn(async () => true)
}));

const holidayService = require('../../backend/src/services/holidayService');
const ctrl = require('../../backend/src/controllers/holidayController');

describe('holidayController.getUpcomingHolidays - fallback path', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test('falls back to service when DB empty and returns upcoming filtered', async () => {
    mockQuery.mockResolvedValueOnce([[]]);

    const req = createReq();
    const res = createRes();

    await ctrl.getUpcomingHolidays(req, res);

    expect(holidayService.fetchIndianHolidays).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(500);
    const payload = res.json.mock.calls[0][0];
    expect(Array.isArray(payload)).toBe(true);
    // Only future dates should be included (2099 ones), limited to 10
    expect(payload.every(h => h.date.startsWith('2099'))).toBe(true);
    expect(payload.length).toBe(2);
  });
});
