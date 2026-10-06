const { calculateDays } = require('../../backend/src/controllers/leaveController');

describe('calculateDays error handling', () => {
  test('returns 0 when toString throws (caught)', () => {
    // Create objects whose toString will throw to simulate a parsing error
    const badDate = {
      toString() {
        throw new Error('bad date');
      }
    };

    const days = calculateDays(badDate, badDate, 1, 2);
    expect(typeof days).toBe('number');
    expect(days).toBe(0);
  });

  test('returns 0 when valueOf throws (caught)', () => {
    const bad = {
      valueOf() { throw new Error('boom'); }
    };

    const days = calculateDays(bad, bad, 1, 1);
    expect(typeof days).toBe('number');
    expect(days).toBe(0);
  });
});
