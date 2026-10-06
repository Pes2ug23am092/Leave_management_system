const { createReq, createRes } = require('./helpers');
const { applyLeave } = require('../../backend/src/controllers/leaveController');

describe('leaveController.applyLeave validation', () => {
  test('400 when invalid date range', async () => {
    const req = createReq({
      leaveTypeId: 1,
      fromDate: '2025-11-10',
      toDate: '2025-11-09',
      fromSession: 1,
      toSession: 2,
      reason: 'x'
    }, { user: { id: 1 } });
    const res = require('./helpers').createRes();

    await applyLeave(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
