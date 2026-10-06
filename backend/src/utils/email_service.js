const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your SMTP server
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Format date for email
const formatDate = (date, session) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const sessionText = session === 1 ? 'Full Day / AM' : 'PM Half Day';
    return `${formattedDate} (${sessionText})`;
};

// Send leave application notification to manager
async function sendLeaveApplicationEmail(leaveDetails, employee, manager) {
    const emailTemplate = `
        <h2>New Leave Application</h2>
        <p>Dear ${manager.FirstName} ${manager.LastName},</p>
        <p>A new leave application has been submitted for your approval:</p>
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <p><strong>Employee:</strong> ${employee.FirstName} ${employee.LastName}</p>
            <p><strong>Leave Type:</strong> ${leaveDetails.leaveName}</p>
            <p><strong>From:</strong> ${formatDate(leaveDetails.FromDate, leaveDetails.FromSession)}</p>
            <p><strong>To:</strong> ${formatDate(leaveDetails.ToDate, leaveDetails.ToSession)}</p>
            <p><strong>Days:</strong> ${leaveDetails.days}</p>
            <p><strong>Reason:</strong> ${leaveDetails.Reason}</p>
            <p><strong>Current Balance:</strong> ${leaveDetails.currentBalance} days</p>
        </div>
        <p>Please review and take action on this request through the Leave Management System.</p>
        <p>Best regards,<br>LMS System</p>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: manager.Email,
            subject: `Leave Application from ${employee.FirstName} ${employee.LastName}`,
            html: emailTemplate
        });
        console.debug(`✉️ Leave application notification sent to ${manager.Email}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email notification:', error);
        return false;
    }
}

// Send leave status update to employee
async function sendLeaveStatusEmail(leaveDetails, employee, status, remarks) {
    const statusColor = {
        Approved: '#28a745',
        Rejected: '#dc3545',
        Cancelled: '#6c757d'
    };

    const emailTemplate = `
        <h2>Leave Application ${status}</h2>
        <p>Dear ${employee.FirstName} ${employee.LastName},</p>
        <p>Your leave application has been <span style="color: ${statusColor[status]}"><strong>${status}</strong></span>.</p>
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <p><strong>Leave Type:</strong> ${leaveDetails.leaveName}</p>
            <p><strong>From:</strong> ${formatDate(leaveDetails.FromDate, leaveDetails.FromSession)}</p>
            <p><strong>To:</strong> ${formatDate(leaveDetails.ToDate, leaveDetails.ToSession)}</p>
            <p><strong>Days:</strong> ${leaveDetails.days}</p>
            ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
            ${status === 'Approved' ? `<p><strong>Updated Balance:</strong> ${leaveDetails.updatedBalance} days</p>` : ''}
        </div>
        <p>You can view your leave history and balances in the Leave Management System.</p>
        <p>Best regards,<br>LMS System</p>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: employee.Email,
            subject: `Leave Application ${status}`,
            html: emailTemplate
        });
        console.debug(`✉️ Leave status notification sent to ${employee.Email}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email notification:', error);
        return false;
    }
}

module.exports = {
    sendLeaveApplicationEmail,
    sendLeaveStatusEmail
};