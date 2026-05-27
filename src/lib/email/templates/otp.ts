import type { EmailBranding } from "../branding";
import { baseTemplate, divider } from "./base";

export interface OtpEmailOptions {
  branding: EmailBranding;
  recipientName?: string;
  otp: string;
  expiryMinutes?: number;
  purpose?: string; // e.g. "email verification", "login"
}

export function buildOtpEmail(opts: OtpEmailOptions): string {
  const {
    branding,
    recipientName,
    otp,
    expiryMinutes = 10,
    purpose = "email verification",
  } = opts;

  const primary = branding.primaryColor || "#f59e0b";
  const greeting = recipientName ? "Hi " + recipientName + "," : "Hello,";

  const content =
    // Greeting
    '<p style="margin:0 0 20px 0;font-size:18px;font-weight:600;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    greeting +
    "</p>" +
    '<p style="margin:0 0 28px 0;font-size:15px;color:#4b5563;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "Your one-time passcode for <strong>" +
    purpose +
    "</strong> at " +
    branding.appName +
    " is:" +
    "</p>" +
    // OTP box
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px 0;">' +
    "<tr><td align=\"center\">" +
    '<div style="display:inline-block;background:' +
    primary +
    ";color:#0d1117;font-size:42px;font-weight:800;letter-spacing:12px;" +
    "padding:20px 36px;border-radius:12px;font-family:'Courier New',Courier,monospace;" +
    "box-shadow:0 4px 16px rgba(245,158,11,0.35);min-width:200px;text-align:center;\">" +
    otp +
    "</div>" +
    "</td></tr>" +
    "</table>" +
    // Expiry notice
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px 0;">' +
    "<tr>" +
    '<td style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;">' +
    '<p style="margin:0;font-size:13px;color:#92400e;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    '<strong>This code expires in ' +
    expiryMinutes +
    " minutes.</strong> Do not share it with anyone." +
    "</p>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    divider() +
    // Security warning
    '<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "<strong style=\"color:#374151;\">Security notice:</strong> " +
    branding.appName +
    " will never ask you for this code via phone, chat, or email. " +
    "If you did not request this code, please ignore this email — your account remains secure." +
    "</p>";

  return baseTemplate({
    branding,
    previewText: "Your verification code is: " + otp + " — expires in " + expiryMinutes + " minutes.",
    content,
    footerNote: "This is an automated security email. Please do not reply.",
  });
}
