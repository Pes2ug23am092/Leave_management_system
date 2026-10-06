const { createReq, createRes } = require('./helpers');

// No need to mock DB, testing auth guard only
const ctrl = require('../../backend/src/controllers/holidayController');

describe('holidayController.updateHolidays - auth guard', () => {
  test('401 when admin key is missing or incorrect', async () => {
    process.env.ADMIN_API_KEY = 'adminkey';

    const req1 = createReq({ year: 2024 });
    const res1 = createRes();
    await ctrl.updateHolidays(req1, res1);
    expect(res1.status).toHaveBeenCalledWith(401);

    const req2 = createReq({ year: 2024, adminKey: 'wrong' });
    const res2 = createRes();
    await ctrl.updateHolidays(req2, res2);
    expect(res2.status).toHaveBeenCalledWith(401);
  });
});
