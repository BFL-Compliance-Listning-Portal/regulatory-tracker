// One-off test: verifies SMTP_USER / SMTP_PASS / NOTIFY_RECIPIENTS actually work by sending
// a single test email. Run this BEFORE testing the full scraper, so an SMTP auth problem
// surfaces in seconds instead of after a 20-40 minute scrape run.
const nodemailer = require('nodemailer');

async function main() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_RECIPIENTS } = process.env;

  if (!SMTP_USER || !SMTP_PASS || !NOTIFY_RECIPIENTS) {
    console.log('❌ Missing required secrets. Need SMTP_USER, SMTP_PASS, and NOTIFY_RECIPIENTS.');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.office365.com',
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection + authentication succeeded.');
  } catch (e) {
    console.log('❌ SMTP connection/auth FAILED:', e.message);
    console.log('   Most likely cause: SMTP AUTH is disabled for this mailbox (Microsoft turns this');
    console.log('   off by default org-wide). Ask IT to enable "Authenticated SMTP" for this specific');
    console.log('   mailbox in the Microsoft 365 admin center, or consider Microsoft Graph API instead.');
    process.exit(1);
  }

  try {
    await transporter.sendMail({
      from: SMTP_USER,
      to: NOTIFY_RECIPIENTS,
      subject: 'Regulatory Tracker — Test Email',
      html: '<p>This is a one-off test to confirm email notifications are wired up correctly. If you got this, the SMTP setup works.</p>'
    });
    console.log(`✅ Test email sent successfully to: ${NOTIFY_RECIPIENTS}`);
  } catch (e) {
    console.log('❌ SMTP connected fine, but sending failed:', e.message);
    process.exit(1);
  }
}

main();
