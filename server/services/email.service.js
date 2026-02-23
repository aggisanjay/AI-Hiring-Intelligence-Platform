import nodemailer from "nodemailer";
import logger from "../config/logger.js";

// ─── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP on startup
transporter.verify().then(() => {
  logger.info("✅ SMTP connected — emails will be sent");
}).catch((err) => {
  logger.warn(`⚠️  SMTP not connected: ${err.message} — emails will be skipped`);
});

// ─── Templates ────────────────────────────────────────────────────────────────
const templates = {
  applicationReceived: ({ candidateName, jobTitle, organization }) => ({
    subject: `✅ Application Received – ${jobTitle} at ${organization}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#1e293b">Hi ${candidateName},</h2>
        <p style="color:#475569">Your application for <strong>${jobTitle}</strong> at <strong>${organization}</strong> has been successfully received.</p>
        <div style="background:#fff;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #10b981">
          <p style="margin:0;color:#64748b">We'll review your profile and reach out soon.</p>
        </div>
        <p style="color:#94a3b8;font-size:13px">— HireIQ Platform</p>
      </div>`,
  }),

  statusUpdate: ({ candidateName, jobTitle, status, interviewDate }) => ({
    subject: `🔔 Application Update – ${jobTitle} → ${status}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#1e293b">Hi ${candidateName},</h2>
        <p style="color:#475569">Your application for <strong>${jobTitle}</strong> has been updated.</p>
        <div style="background:#fff;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid ${
          status === "Offer"       ? "#10b981" :
          status === "Rejected"    ? "#ef4444" :
          status === "Interview"   ? "#8b5cf6" :
          status === "Shortlisted" ? "#f59e0b" : "#3b82f6"
        }">
          <p style="margin:0;font-size:18px;font-weight:700;color:#1e293b">Status: ${status}</p>
          ${status === "Interview" && interviewDate ? `<p style="margin:8px 0 0;color:#64748b">Interview Date: <strong>${new Date(interviewDate).toDateString()}</strong></p>` : ""}
          ${status === "Offer"     ? `<p style="margin:8px 0 0;color:#10b981">🎉 Congratulations! You've received an offer.</p>` : ""}
          ${status === "Rejected"  ? `<p style="margin:8px 0 0;color:#64748b">Thank you for your time. We encourage you to apply for future roles.</p>` : ""}
        </div>
        <p style="color:#94a3b8;font-size:13px">— HireIQ Platform</p>
      </div>`,
  }),

  interviewComplete: ({ candidateName, jobRole, score }) => ({
    subject: `🤖 AI Interview Evaluated – ${jobRole}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#1e293b">Hi ${candidateName},</h2>
        <p style="color:#475569">Your AI mock interview for <strong>${jobRole}</strong> has been evaluated.</p>
        <div style="background:#fff;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
          <p style="font-size:48px;font-weight:800;color:${score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444"};margin:0">${score}</p>
          <p style="color:#64748b;margin:4px 0 0">Overall Score / 100</p>
        </div>
        <p style="color:#475569">Log in to view your full feedback report and areas for improvement.</p>
        <p style="color:#94a3b8;font-size:13px">— HireIQ Platform</p>
      </div>`,
  }),
};

// ─── Send directly via SMTP (no Redis needed) ─────────────────────────────────
export const sendEmail = async (type, to, data) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn(`⚠️  Email skipped (${type}) — SMTP credentials not set in .env`);
    return;
  }

  const template = templates[type];
  if (!template) {
    logger.error(`❌ Unknown email template: ${type}`);
    return;
  }

  const { subject, html } = template(data);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"HireIQ" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`📧 Email sent [${type}] → ${to}`);
  } catch (err) {
    // Log but don't crash the main request
    logger.error(`❌ Email failed [${type}] → ${to}: ${err.message}`);
  }
};