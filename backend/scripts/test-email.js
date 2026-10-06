require('dotenv').config();
const emailService = require('../src/services/emailService');

(async () => {
  console.log('🔍 Verifying SMTP connection...');
  const ok = await emailService.testConnection();
  if (!ok.success) {
    console.error('❌ SMTP verify failed:', ok.error);
    process.exit(1);
  }
  console.log('✅ SMTP OK');

  const managerEmail = process.env.TEST_MANAGER_EMAIL || process.env.SMTP_USER || process.env.MAIL_USER;
  console.log('📧 Sending test email to:', managerEmail);
  const res = await emailService.sendEmail(
    managerEmail,
    'LMS Test: Leave Application Email Template',
    `<p>This is a test email from LMS.</p>
     <hr/>
     ${emailService ? 'Email service loaded' : 'Email service not loaded'}`
  );
  console.log('📬 Result:', res);
})();
