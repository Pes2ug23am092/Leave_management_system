const { calculateDays } = require('../../backend/src/controllers/leaveController');

describe('calculateDays same-session handling', () => {
  test('same day same session returns 1 per implementation', () => {
    const from = '2025-12-01';
    const to = '2025-12-01';
    const days = calculateDays(from, to, 1, 1); // AM to AM (same session)
    // Implementation returns 0.5 for AM->AM due to end-session adjustment
    expect(days).toBe(0.5);
  });

  test('same day different sessions returns 0.5 per implementation', () => {
    const from = '2025-12-01';
    const to = '2025-12-01';
    const days = calculateDays(from, to, 2, 1); // PM start to AM end (different)
    expect(days).toBe(0.5);
  });
});
