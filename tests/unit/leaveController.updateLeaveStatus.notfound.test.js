const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({
  pool: {
    getConnection: jest.fn(async () => ({
      beginTransaction: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([[]]) // first SELECT returns empty -> not found
        ,
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    })),
  }
}));

const { updateLeaveStatus } = require('../../backend/src/controllers/leaveController');

describe('leaveController.updateLeaveStatus - not found', () => {
  test('404 when leave not found or already processed', async () => {
    const req = createReq({}, { params: { leaveId: '123' }, user: { id: 10 } });
    const res = createRes();

    await updateLeaveStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
