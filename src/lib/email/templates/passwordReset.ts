import type { EmailBranding } from "../branding";
import { baseTemplate, ctaButton, divider } from "./base";

export interface PasswordResetEmailOptions {
  branding: EmailBranding;
  recipientName?: string;
  resetUrl: string;
  expiryHours?: number;
}

export function buildPasswordResetEmail(opts: PasswordResetEmailOptions): string {
  const { branding, recipientName, resetUrl, expiryHours = 24 } = opts;
  const primary = branding.primaryColor || "#f59e0b";
  const greeting = recipientName ? "Hi " + recipientName + "," : "Hello,";

  const content =
    // Greeting
    '<p style="margin:0 0 20px 0;font-size:18px;font-weight:600;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    greeting +
    "</p>" +
    '<p style="margin:0 0 8px 0;font-size:15px;color:#4b5563;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "We received a request to reset your password for your <strong>" +
    branding.appName +
    "</strong> account. Click the button below to choose a new password." +
    "</p>" +
    '<p style="margin:0 0 28px 0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "This link will expire in <strong>" +
    expiryHours +
    " hours</strong>." +
    "</p>" +
    // CTA button
    '<p style="margin:0 0 28px 0;text-align:center;">' +
    ctaButton({ href: resetUrl, label: "Reset My Password", primary }) +
    "</p>" +
    // URL fallback
    '<p style="margin:0 0 24px 0;font-size:12px;color:#9ca3af;line-height:1.6;word-break:break-all;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "If the button does not work, copy and paste this link into your browser:" +
    "<br />" +
    '<a href="' +
    resetUrl +
    '" style="color:' +
    primary +
    ';text-decoration:none;">' +
    resetUrl +
    "</a>" +
    "</p>" +
    // Expiry warning box
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px 0;">' +
    "<tr>" +
    '<td style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;">' +
    '<p style="margin:0;font-size:13px;color:#92400e;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "&#x26A0;&#xFE0F; <strong>This link expires in " +
    expiryHours +
    " hours</strong> and can only be used once." +
    "</p>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    divider() +
    // Security notice
    '<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "<strong style=\"color:#374151;\">Not you?</strong> " +
    "If you did not request a password reset, you can safely ignore this email. " +
    "Your account password will not change." +
    "</p>";

  return baseTemplate({
    branding,
    previewText: "Password reset request for your " + branding.appName + " account.",
    content,
    footerNote:
      "For security, this password reset link is valid for " +
      expiryHours +
      " hours and can only be used once.",
  });
}
