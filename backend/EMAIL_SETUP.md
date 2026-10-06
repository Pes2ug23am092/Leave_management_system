Email setup for LMS backend

Quick options

- Fast dev preview (no real emails): set EMAIL_MODE=ethereal in backend/.env. Emails will log a preview URL in the server console.
- Redirect all emails to you: set DEV_EMAIL_REDIRECT=your@email.com. Useful with real SMTP; with Ethereal you still get preview links in console.
- Real delivery via Gmail: use an App Password (2‑step verification required) and set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS.
- Sandbox with Mailtrap: create an inbox in mailtrap.io and use the SMTP creds it gives.

.env examples

# Ethereal preview only (local/dev)
EMAIL_MODE=ethereal

# OR real SMTP (Gmail App Password)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your.address@gmail.com
MAIL_PASS=your-app-password
# Optional: redirect all outgoing emails to your inbox
DEV_EMAIL_REDIRECT=your.address@gmail.com

Notes

- We detect placeholder or example.com credentials and automatically fall back to Ethereal in dev.
- In the console, look for lines starting with "📧 Sending email to:" and "🔗 Ethereal preview URL:" to confirm the flow.
- If you use Gmail, normal passwords will not work. Create an App Password under Google Account → Security → 2‑Step Verification → App passwords.
- Ensure each employee has a valid ManagerID and the manager has a non‑empty Email in the Employee table; otherwise manager emails won't be sent.

Diagnostics

Run:
node backend/scripts/diagnose-email.js you@example.com

This will verify SMTP connectivity and send a test email (or print an Ethereal preview URL).
