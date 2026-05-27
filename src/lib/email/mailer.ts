import nodemailer from "nodemailer";
import { emailConfig } from "./config";

// ─── Singleton transporter ────────────────────────────────────────────────────
// We lazily create and cache a single transporter instance so that connection
// pooling works correctly across the Node.js runtime lifetime.
let _transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport(emailConfig.smtp);
  }
  return _transporter;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send a transactional email.
 *
 * Silently skips sending when EMAIL_USER / EMAIL_PASS are not configured so
 * the application works in development without SMTP credentials.
 *
 * Returns `true` when the email was dispatched, `false` when skipped.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, text, replyTo, cc, bcc } = options;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "[Mailer] Email credentials not configured — skipping email dispatch." +
        " Set EMAIL_USER and EMAIL_PASS in your .env to enable transactional emails."
    );
    return false;
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: emailConfig.from,
      replyTo: replyTo || emailConfig.replyTo || undefined,
      to,
      cc,
      bcc,
      subject,
      html,
      text: text || stripHtml(html) || subject,
    });
    console.log(`[Mailer] Email sent: ${info.messageId} -> ${Array.isArray(to) ? to.join(", ") : to}`);
    return true;
  } catch (error: any) {
    console.error("[Mailer] Failed to send email:", error.message);
    throw error;
  }
}

// ─── Minimal HTML stripper for auto-generated plain-text fallback ─────────────
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
