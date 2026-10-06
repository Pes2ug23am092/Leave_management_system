// Mock the DB module so requiring the controller doesn't create a real pool
jest.mock('../../backend/db/db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
const { calculateDays } = require('../../backend/src/controllers/leaveController');

describe('calculateDays helper', () => {
  test('returns 0 for toDate before fromDate', () => {
    const days = calculateDays('2025-12-05', '2025-12-01', 1, 2);
    expect(days).toBe(0);
  });

  test('handles PM start (fromSession=2) and AM end (toSession=1) across two days', () => {
    // 2025-12-01 to 2025-12-02 -> 2 days -0.5 -0.5 = 1
    const days = calculateDays('2025-12-01', '2025-12-02', 2, 1);
    expect(days).toBe(1);
  });

  test('same day different sessions returns 1 (per implementation)', () => {
    const days = calculateDays('2025-12-01', '2025-12-01', 1, 2);
    expect(days).toBe(1);
  });

  test('same day same sessions returns 0.5 (per implementation adjusting end AM)', () => {
    const days = calculateDays('2025-12-01', '2025-12-01', 1, 1);
    expect(days).toBe(0.5);
  });

  test('invalid date returns a number (does not throw)', () => {
    const days = calculateDays('invalid-date', 'also-invalid', 1, 1);
    expect(typeof days).toBe('number');
  });
});
