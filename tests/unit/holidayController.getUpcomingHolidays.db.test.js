const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({
  pool: {
    query: jest.fn(async () => [[
      { date: '2099-12-25', name: 'Christmas', dayOfWeek: 'Saturday' },
      { date: '2099-12-31', name: 'New Year Eve', dayOfWeek: 'Friday' }
    ]]),
  }
}));

const holidayService = require('../../backend/src/services/holidayService');
jest.spyOn(holidayService, 'fetchIndianHolidays').mockResolvedValue([]);

const ctrl = require('../../backend/src/controllers/holidayController');

describe('holidayController.getUpcomingHolidays - DB path', () => {
  test('returns holidays from DB without calling fallback', async () => {
    const req = createReq();
    const res = createRes();

    await ctrl.getUpcomingHolidays(req, res);

    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBe(2);
    expect(holidayService.fetchIndianHolidays).not.toHaveBeenCalled();
  });
});
