const { createReq, createRes } = require('./helpers');

const mockQuery = jest.fn();
jest.mock('../../backend/db/db', () => ({
  pool: { query: (...args) => mockQuery(...args) }
}));

const ctrl = require('../../backend/src/controllers/holidayController');

describe('holidayController.getHolidaysByYear', () => {
  beforeEach(() => mockQuery.mockReset());

  test('returns holidays for given year with count', async () => {
    const rows = [
      { date: '2024-01-26', name: 'Republic Day', dayOfWeek: 'Friday' },
      { date: '2024-08-15', name: 'Independence Day', dayOfWeek: 'Thursday' },
    ];
    mockQuery.mockResolvedValueOnce([rows]);

    const req = createReq({}, { params: { year: '2024' } });
    const res = createRes();

    await ctrl.getHolidaysByYear(req, res);

    expect(res.status).not.toHaveBeenCalledWith(500);
    const payload = res.json.mock.calls[0][0];
    expect(payload.year).toBe(2024);
    expect(payload.count).toBe(2);
    expect(payload.holidays).toHaveLength(2);
  });
});
