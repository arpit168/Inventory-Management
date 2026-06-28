import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html, text }) => {
  // Check if SMTP configuration exists
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || '"Inventory Pro" <noreply@inventorypro.com>',
        to,
        subject,
        text,
        html,
      });
      console.log('Email sent: %s', info.messageId);
      return true;
    } catch (err) {
      console.error('Failed to send SMTP email:', err.message);
    }
  }

  // Fallback dev logging if no SMTP credentials
  console.log('====================================================');
  console.log('MOCK EMAIL SENDING (No SMTP configuration found in .env)');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text Body:\n${text}`);
  console.log('====================================================');
  return true;
};
