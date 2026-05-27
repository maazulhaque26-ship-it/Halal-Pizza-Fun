// ─── Centralized email transport config ──────────────────────────────────────
// All SMTP values are pulled from environment variables so no credentials are
// ever hardcoded.  Defaults point to GoDaddy Secure SMTP (port 465 / SSL).
export const emailConfig = {
  smtp: {
    host: process.env.EMAIL_HOST || "smtpout.secureserver.net",
    port: Number(process.env.EMAIL_PORT) || 465,
    secure:
      process.env.EMAIL_SECURE !== undefined
        ? process.env.EMAIL_SECURE === "true"
        : Number(process.env.EMAIL_PORT || 465) === 465,
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASS || "",
    },
  },
  from:
    process.env.EMAIL_FROM ||
    (process.env.EMAIL_USER
      ? `"Food Delivery" <${process.env.EMAIL_USER}>`
      : `"Food Delivery" <noreply@example.com>`),
  replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER || "",
  adminEmail:
    process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "",
};
