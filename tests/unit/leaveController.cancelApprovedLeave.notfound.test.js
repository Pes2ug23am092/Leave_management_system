const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({
  pool: {
    getConnection: jest.fn(async () => ({
      beginTransaction: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([[]]) // SELECT returns empty
        ,
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    })),
  }
}));

const { cancelApprovedLeave } = require('../../backend/src/controllers/leaveController');

describe('leaveController.cancelApprovedLeave - not found', () => {
  test('404 when approved leave not found', async () => {
    const req = createReq({}, { params: { leaveId: '55' }, user: { id: 9 } });
    const res = createRes();

    await cancelApprovedLeave(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
