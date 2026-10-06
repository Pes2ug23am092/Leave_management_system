require('dotenv').config();
const emailService = require('../src/services/emailService');

(async () => {
  console.log('--- Email Diagnostics ---');
  const cfg = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS ? '(set)' : '(missing)',
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS ? '(set)' : '(missing)',
    DEV_EMAIL_REDIRECT: process.env.DEV_EMAIL_REDIRECT,
    EMAIL_MODE: process.env.EMAIL_MODE
  };
  console.log(cfg);

  const result = await emailService.testConnection();
  console.log('testConnection:', result);

  // Send a quick test email
  const to = process.argv[2] || process.env.DEV_EMAIL_REDIRECT;
  if (to) {
    console.log(`Attempting to send test email to ${to}...`);
    const send = await emailService.sendEmail(to, 'Test Email from LMS', '<p>This is a test email from LMS.</p>');
    console.log('sendEmail:', send);
  } else {
    console.log('No recipient provided. Pass an email as arg or set DEV_EMAIL_REDIRECT.');
  }
})();
