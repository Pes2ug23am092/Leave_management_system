const emailService = require('../../backend/src/services/emailService');

describe('emailService notify wrappers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('notifyLeaveApplication calls sendEmail to manager with employee name', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true, messageId: 'm123' });

    const employee = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
    const manager = { firstName: 'Manager', lastName: 'One', email: 'mgr@example.com' };
    const leave = { leaveType: 'Annual', startDate: '2025-12-01', endDate: '2025-12-02', reason: 'Vacation' };

    const res = await emailService.notifyLeaveApplication(employee, manager, leave);

    expect(spy).toHaveBeenCalled();
    const [to, subject] = spy.mock.calls[0];
    expect(to).toBe(manager.email);
    expect(subject).toContain('John Doe');
    expect(res).toHaveProperty('success', true);
  });

  test('notifyLeaveApproval sends email to employee with leave type in subject', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true, messageId: 'm456' });

    const employee = { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' };
    const manager = { firstName: 'Mgr', lastName: 'Two', email: 'mgr2@example.com' };
    const leave = { leaveType: 'Sick', startDate: '2025-11-01', endDate: '2025-11-02' };

    const res = await emailService.notifyLeaveApproval(employee, manager, leave);

    expect(spy).toHaveBeenCalled();
    const [to, subject] = spy.mock.calls[0];
    expect(to).toBe(employee.email);
    expect(subject).toContain(leave.leaveType);
    expect(res).toHaveProperty('success', true);
  });
});
