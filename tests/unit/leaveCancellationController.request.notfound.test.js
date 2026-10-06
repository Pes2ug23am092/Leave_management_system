const { createReq, createRes } = require('./helpers');

jest.mock('../../backend/db/db', () => ({
  pool: {
    getConnection: jest.fn(async () => ({
      beginTransaction: jest.fn(),
      execute: jest.fn()
        .mockResolvedValueOnce([[]]) // leave not found
        ,
      rollback: jest.fn(),
      commit: jest.fn(),
      release: jest.fn(),
    })),
  }
}));

const ctrl = require('../../backend/src/controllers/leaveCancellationController');

describe('leaveCancellationController.requestCancellation - not found', () => {
  test('404 when leave not found or unauthorized', async () => {
    const req = createReq({ leaveAppId: 1, cancellationReason: 'Need' }, { user: { id: 2 } });
    const res = createRes();

    await ctrl.requestCancellation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
