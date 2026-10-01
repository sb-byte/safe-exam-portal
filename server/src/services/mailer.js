import nodemailer from 'nodemailer';
import { db } from '../db.js';

let transporter = null;

// Initialize mailer
async function getTransporter() {
  if (transporter) return transporter;

  // If user provided SMTP credentials via environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback: create ethereal test account or mock transport for demo viva
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err) {
    // If offline, use a stream transport
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  return transporter;
}

/**
 * Send security email alert when 3+ failed logins occur
 */
export async function sendSecurityAlertEmail({ user, attemptDetails, attemptCount }) {
  const mail = await getTransporter();

  const recipientEmail = user.email || `${user.username}@secureexam.edu`;
  const subject = `🚨 [CRITICAL ALERT] Someone is trying to log in to your SecureExam account`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .card { background-color: #1e293b; border-radius: 12px; border: 1px solid #dc2626; padding: 28px; max-width: 580px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { display: flex; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }
        .title { font-size: 20px; font-weight: bold; color: #f87171; margin: 0; }
        .badge { background: #ef4444; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-left: 8px; }
        .details-box { background-color: #0b0f19; border-radius: 8px; border: 1px solid #334155; padding: 18px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; }
        .label { color: #94a3b8; font-weight: 500; }
        .val { color: #38bdf8; font-family: monospace; font-weight: 600; }
        .warning-text { background: rgba(239, 68, 68, 0.15); border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; font-size: 14px; color: #fca5a5; margin-bottom: 20px; }
        .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 class="title">⚠️ Security Alert: Unauthorized Login Detected</h2>
          <span class="badge">${attemptCount} Failed Attempts</span>
        </div>
        <div class="warning-text">
          <strong>Security Action Required:</strong> Someone has repeatedly attempted to access your SecureExam account using incorrect credentials. For your protection, this incident has been logged and forwarded to the Exam Security Admin.
        </div>
        <div class="details-box">
          <div class="detail-row">
            <span class="label">Target Account:</span>
            <span class="val">${user.username} (${user.fullName})</span>
          </div>
          <div class="detail-row">
            <span class="label">Attacker IP Address:</span>
            <span class="val">${attemptDetails.location.ip || attemptDetails.ip}</span>
          </div>
          <div class="detail-row">
            <span class="label">Approximate Location:</span>
            <span class="val">${attemptDetails.location.city}, ${attemptDetails.location.region}, ${attemptDetails.location.country}</span>
          </div>
          <div class="detail-row">
            <span class="label">Attacker Device:</span>
            <span class="val">${attemptDetails.device.device} (${attemptDetails.device.os})</span>
          </div>
          <div class="detail-row">
            <span class="label">Attacker Browser:</span>
            <span class="val">${attemptDetails.device.browser}</span>
          </div>
          <div class="detail-row">
            <span class="label">Timestamp:</span>
            <span class="val">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
          If this was you, please reset your password immediately or use AI Face Login. If this was NOT you, rest assured our multi-factor liveness protection and brute-force mitigation have blocked this access.
        </p>
        <div class="footer">
          SecureExam Autonomous AI Proctoring & Identity Verification Engine • AIACS Project
        </div>
      </div>
    </body>
    </html>
  `;

  let previewUrl = null;
  try {
    const info = await mail.sendMail({
      from: '"SecureExam Cyber Defense" <security-alerts@secureexam.edu>',
      to: recipientEmail,
      subject: subject,
      html: htmlContent
    });

    previewUrl = nodemailer.getTestMessageUrl(info) || null;
    console.log(`[SECURITY ALERT] Email alert triggered for ${user.username} (${recipientEmail}).`);
    if (previewUrl) {
      console.log(`[ETHEREAL PREVIEW URL]: ${previewUrl}`);
    }
  } catch (error) {
    console.warn('[MAIL WARNING] Could not dispatch external SMTP email, saving to internal security inbox:', error.message);
  }

  // Always record to DB so it is visible in Admin & Student UI even without internet
  const emailRecord = db.addSecurityEmail({
    to: recipientEmail,
    username: user.username,
    fullName: user.fullName,
    subject,
    html: htmlContent,
    previewUrl,
    attemptDetails,
    attemptCount,
    sentAt: new Date().toISOString()
  });

  return emailRecord;
}
