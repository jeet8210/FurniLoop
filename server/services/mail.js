import nodemailer from 'nodemailer';

let transport;
function getTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transport) transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

export async function sendAccountLink({ to, subject, heading, text, tokenName, token }) {
  const base = String(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const link = `${base}/?${encodeURIComponent(tokenName)}=${encodeURIComponent(token)}`;
  const mailer = getTransport();
  if (!mailer) {
    if (process.env.NODE_ENV === 'production') throw new Error('SMTP is not configured.');
    console.info(`[FurniLoop local email] ${subject} for ${to}: ${link}`);
    return;
  }
  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: `${heading}\n\n${text}\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#29352c"><h1 style="color:#245b43">${heading}</h1><p>${text}</p><p><a href="${link}" style="display:inline-block;background:#245b43;color:white;padding:12px 18px;text-decoration:none;border-radius:4px">Continue to FurniLoop</a></p><p style="color:#777;font-size:13px">If you did not request this, you can ignore this email.</p></div>`,
  });
}

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
