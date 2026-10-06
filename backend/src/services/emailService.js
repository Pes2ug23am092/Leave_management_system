// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Email configuration - supports both SMTP_* and MAIL_* env names
const host = process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com';
const portRaw = process.env.SMTP_PORT || process.env.MAIL_PORT || 587;
const port = typeof portRaw === 'string' ? parseInt(portRaw, 10) : portRaw;
const user = process.env.SMTP_USER || process.env.MAIL_USER || 'your-email@gmail.com';
const pass = process.env.SMTP_PASS || process.env.MAIL_PASS || 'your-app-password';

const emailConfig = {
  host,
  port,
  secure: Number(port) === 465, // true for 465, false otherwise
  auth: { user, pass }
};

// Lazy-create transporter to support dev fallbacks (e.g., Ethereal)
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Optional: force ethereal via env
  const forceEthereal = String(process.env.EMAIL_MODE || '').toLowerCase() === 'ethereal';
  const looksPlaceholder =
    !user || !pass ||
    host.includes('example.com') ||
    String(user).includes('example.com') ||
    String(user) === 'your-email@gmail.com' ||
    String(pass) === 'your-app-password';

  if (forceEthereal || looksPlaceholder) {
    console.warn('⚠️ Using Ethereal test account for emails (set real SMTP creds or EMAIL_MODE=ethereal)');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
  } else {
    transporter = nodemailer.createTransport(emailConfig);
  }

  return transporter;
}

// Email templates
const emailTemplates = {
  leaveApplication: (employeeName, leaveType, startDate, endDate, reason, managerName) => ({
    subject: `Leave Application - ${employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">New Leave Application</h2>
        <p>Dear ${managerName},</p>
        <p><strong>${employeeName}</strong> has submitted a new leave application:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Leave Type:</strong> ${leaveType}</p>
          <p><strong>Duration:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <p>Please review and approve/reject this request in the Leave Management System.</p>
        
        <div style="margin-top: 30px;">
          <p>Best regards,<br>Leave Management System</p>
        </div>
      </div>
    `
  }),

  leaveApproval: (employeeName, leaveType, startDate, endDate, managerName) => ({
    subject: `Leave Approved - ${leaveType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Leave Application Approved</h2>
        <p>Dear ${employeeName},</p>
        <p>Your leave application has been <strong>approved</strong> by ${managerName}.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p><strong>Leave Type:</strong> ${leaveType}</p>
          <p><strong>Duration:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Status:</strong> Approved</p>
        </div>
        
        <p>Enjoy your time off!</p>
        
        <div style="margin-top: 30px;">
          <p>Best regards,<br>Leave Management System</p>
        </div>
      </div>
    `
  }),

  leaveRejection: (employeeName, leaveType, startDate, endDate, managerName, rejectionReason) => ({
    subject: `Leave Rejected - ${leaveType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Leave Application Rejected</h2>
        <p>Dear ${employeeName},</p>
        <p>Unfortunately, your leave application has been <strong>rejected</strong> by ${managerName}.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>Leave Type:</strong> ${leaveType}</p>
          <p><strong>Duration:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Status:</strong> Rejected</p>
          ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
        </div>
        
        <p>Please contact your manager if you have any questions.</p>
        
        <div style="margin-top: 30px;">
          <p>Best regards,<br>Leave Management System</p>
        </div>
      </div>
    `
  }),

  leaveCancellationRequest: (employeeName, leaveType, startDate, endDate, reason, managerName) => ({
    subject: `Leave Cancellation Request - ${employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Leave Cancellation Request</h2>
        <p>Dear ${managerName},</p>
        <p><strong>${employeeName}</strong> has requested to cancel an approved leave:</p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
          <p><strong>Leave Type:</strong> ${leaveType}</p>
          <p><strong>Duration:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Cancellation Reason:</strong> ${reason}</p>
        </div>
        
        <p>Please review and approve this cancellation request in the Leave Management System.</p>
        
        <div style="margin-top: 30px;">
          <p>Best regards,<br>Leave Management System</p>
        </div>
      </div>
    `
  }),

  leaveCancellationApproval: (employeeName, leaveType, startDate, endDate, managerName) => ({
    subject: `Leave Cancellation Approved - ${leaveType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Leave Cancellation Approved</h2>
        <p>Dear ${employeeName},</p>
        <p>Your leave cancellation request has been <strong>approved</strong> by ${managerName}.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p><strong>Leave Type:</strong> ${leaveType}</p>
          <p><strong>Duration:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Status:</strong> Cancelled</p>
        </div>
        
        <p>Your leave has been successfully cancelled and your leave balance has been restored.</p>
        
        <div style="margin-top: 30px;">
          <p>Best regards,<br>Leave Management System</p>
        </div>
      </div>
    `
  })
};

// Email service functions
const emailService = {
  // Send email function
  async sendEmail(to, subject, html) {
    try {
      let toAddress = to;
      const devRedirect = process.env.DEV_EMAIL_REDIRECT;
      let subjectLine = subject;
      if (devRedirect) {
        console.warn(`🔁 DEV_EMAIL_REDIRECT is set, redirecting email to ${devRedirect} (original to: ${to})`);
        subjectLine = `[REDIRECTED from ${to}] ${subject}`;
        toAddress = devRedirect;
      }

      const mailOptions = {
        from: `"Leave Management System" <${emailConfig.auth.user}>`,
        to: toAddress,
        subject: subjectLine,
        html
      };

      console.log(`📧 Sending email to: ${to}`);
      console.log(`📧 Subject: ${subject}`);
      
      const tx = await getTransporter();
      const result = await tx.sendMail(mailOptions);
      // If Ethereal, print preview URL for convenience
      const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(result) : null;
      if (preview) {
        console.log(`🔗 Ethereal preview URL: ${preview}`);
      }
      console.log(`✅ Email sent successfully: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Send leave application notification to manager
  async notifyLeaveApplication(employeeData, managerData, leaveData) {
    const template = emailTemplates.leaveApplication(
      `${employeeData.firstName} ${employeeData.lastName}`,
      leaveData.leaveType,
      leaveData.startDate,
      leaveData.endDate,
      leaveData.reason,
      `${managerData.firstName} ${managerData.lastName}`
    );

    return await this.sendEmail(managerData.email, template.subject, template.html);
  },

  // Send leave approval notification to employee
  async notifyLeaveApproval(employeeData, managerData, leaveData) {
    const template = emailTemplates.leaveApproval(
      `${employeeData.firstName} ${employeeData.lastName}`,
      leaveData.leaveType,
      leaveData.startDate,
      leaveData.endDate,
      `${managerData.firstName} ${managerData.lastName}`
    );

    return await this.sendEmail(employeeData.email, template.subject, template.html);
  },

  // Send leave rejection notification to employee
  async notifyLeaveRejection(employeeData, managerData, leaveData, rejectionReason) {
    const template = emailTemplates.leaveRejection(
      `${employeeData.firstName} ${employeeData.lastName}`,
      leaveData.leaveType,
      leaveData.startDate,
      leaveData.endDate,
      `${managerData.firstName} ${managerData.lastName}`,
      rejectionReason
    );

    return await this.sendEmail(employeeData.email, template.subject, template.html);
  },

  // Send leave cancellation request to manager
  async notifyLeaveCancellationRequest(employeeData, managerData, leaveData, cancellationReason) {
    const template = emailTemplates.leaveCancellationRequest(
      `${employeeData.firstName} ${employeeData.lastName}`,
      leaveData.leaveType,
      leaveData.startDate,
      leaveData.endDate,
      cancellationReason,
      `${managerData.firstName} ${managerData.lastName}`
    );

    return await this.sendEmail(managerData.email, template.subject, template.html);
  },

  // Send leave cancellation approval to employee
  async notifyLeaveCancellationApproval(employeeData, managerData, leaveData) {
    const template = emailTemplates.leaveCancellationApproval(
      `${employeeData.firstName} ${employeeData.lastName}`,
      leaveData.leaveType,
      leaveData.startDate,
      leaveData.endDate,
      `${managerData.firstName} ${managerData.lastName}`
    );

    return await this.sendEmail(employeeData.email, template.subject, template.html);
  },

  // Test email connection
  async testConnection() {
    try {
      const tx = await getTransporter();
      await tx.verify();
      console.log('✅ Email server connection verified');
      return { success: true };
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;