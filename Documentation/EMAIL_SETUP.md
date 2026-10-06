Email setup for LMS backend
================================

The backend sends notification emails (leave application, approval/rejection, cancellation flows) using `nodemailer` via the service in `src/services/emailService.js`.

Quick options
-------------

1. Fast dev preview (no real emails): set `EMAIL_MODE=ethereal` in `backend/.env`. Emails use an auto-generated Ethereal test account and log a preview URL.
2. Redirect all emails to you: set `DEV_EMAIL_REDIRECT=your@email.com`. Real recipient appears in the subject prefix; useful to avoid spamming real users.
3. Real delivery via Gmail: use an App Password (2‑step verification required) and set `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` (or their `SMTP_` equivalents).
4. Sandbox with Mailtrap: create an inbox at https://mailtrap.io and use the SMTP credentials it provides.

Supported environment variable names
------------------------------------
The email service looks for either `SMTP_*` or `MAIL_*` variants:

```
SMTP_HOST / MAIL_HOST
SMTP_PORT / MAIL_PORT
SMTP_USER / MAIL_USER
SMTP_PASS / MAIL_PASS
```

If both are present, `SMTP_*` takes precedence for that field.

Port & TLS behavior
-------------------
- If the chosen port is **465**, `secure=true` (implicit TLS).
- For **587** (recommended for most providers incl. Gmail, Mailtrap), `secure=false` and STARTTLS is negotiated automatically.
- Ethereal uses port 587 in dev.

Fallback / Ethereal auto-selection
----------------------------------
If credentials look like placeholders (e.g. host contains `example.com`, user is `your-email@gmail.com`, pass is `your-app-password`) OR `EMAIL_MODE=ethereal` is set, the service automatically switches to an Ethereal test account and prints a preview link.

Example `.env` configurations
-----------------------------

Ethereal (dev only):
```
EMAIL_MODE=ethereal
DEV_EMAIL_REDIRECT=
```

Gmail (App Password):
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your.address@gmail.com
MAIL_PASS=your-app-password  # App Password, NOT your normal password
DEV_EMAIL_REDIRECT=your.address@gmail.com  # optional
```

Implicit TLS (if provider requires 465):
```
SMTP_HOST=smtp.provider.com
SMTP_PORT=465
SMTP_USER=prod@company.com
SMTP_PASS=super-secret-pass
```

Mailtrap sandbox:
```
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=<mailtrap-user>
MAIL_PASS=<mailtrap-pass>
```

Security & good practices
-------------------------
- Never commit real SMTP credentials. Keep `.env` out of version control or use environment-specific secret management.
- Rotate App Passwords / SMTP passwords periodically.
- Use the `DEV_EMAIL_REDIRECT` during staging demos to avoid accidental external sends.
- In production, remove Ethereal fallback by ensuring real creds are always injected (CI/CD secrets, container env vars, etc.).

Operational notes
-----------------
- Console logs include:
	- `📧 Sending email to:` (original recipient)
	- `🔗 Ethereal preview URL:` when using Ethereal (open in browser to view rendered email)
- Manager notifications require: each employee row must have a valid `ManagerID` AND the manager's `Email` field populated.
- Redirected emails modify the subject line to show the original recipient: `[REDIRECTED from original@domain]`.

Diagnostics
-----------
Run the diagnostic script to verify connectivity and send a test message (or produce an Ethereal preview link):

```
node backend/scripts/diagnose-email.js you@example.com
```

Troubleshooting tips
--------------------
- Gmail failures: Ensure 2‑Step Verification is enabled and you generated an App Password (16 characters, no spaces). Normal passwords are rejected.
- STARTTLS issues: Confirm port 587 and no corporate firewall blocking outbound SMTP.
- Ethereal not used when expected: Ensure `EMAIL_MODE=ethereal` or that placeholders haven't been replaced with real creds.
- Unexpected real sends in dev: Remove real SMTP creds or set `DEV_EMAIL_REDIRECT` to your own address.

Summary
-------
Use Ethereal for local development, Mailtrap for shared QA environments, and App Password + Gmail or a dedicated SMTP provider for production. Configure via `MAIL_*` or `SMTP_*` env vars; the service auto-falls back to Ethereal when placeholders are detected.
