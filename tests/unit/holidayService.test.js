const holidayService = require('../../backend/src/services/holidayService');

jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../../backend/db/db');

describe('HolidayService basic behaviors', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getStaticIndianHolidays returns an array with expected items', () => {
    const year = 2025;
    const result = holidayService.getStaticIndianHolidays(year);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(5);
    expect(result[0]).toHaveProperty('date');
    expect(result[0].date).toMatch(/^2025-/);
  });

  test('fetchIndianHolidays falls back to static data when using demo-key', async () => {
    // Default service uses demo-key by design when no API key set
    const list = await holidayService.fetchIndianHolidays(2025);
    expect(Array.isArray(list)).toBe(true);
    expect(list[0]).toHaveProperty('date');
  });

  test('saveHolidaysToDatabase calls pool.query for delete and inserts and returns count', async () => {
    const year = 2024;
    const holidays = [
      { date: '2024-01-01', name: 'New Year' },
      { date: '2024-02-01', name: 'Sample Day' }
    ];

    // Make pool.query resolve for DELETE and then for each insert
    pool.query
      .mockResolvedValueOnce([{}]) // DELETE
      .mockResolvedValueOnce([{}]) // INSERT 1
      .mockResolvedValueOnce([{}]); // INSERT 2

    const count = await holidayService.saveHolidaysToDatabase(holidays, year);
    expect(pool.query).toHaveBeenCalled();
    expect(count).toBe(holidays.length);
  });
});
