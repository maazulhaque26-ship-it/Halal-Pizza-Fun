import type { EmailBranding } from "../branding";
import { baseTemplate, greeting, greenInfoCard, orangeInfoCard, ctaButton, divider } from "./base";

export interface PasswordResetEmailOptions {
  branding: EmailBranding;
  recipientName?: string;
  resetUrl: string;
  expiryHours?: number;
}

export function buildPasswordResetEmail(opts: PasswordResetEmailOptions): string {
  const { branding, recipientName, resetUrl, expiryHours = 24 } = opts;
  const name = recipientName || "there";

  const content =
    greeting(name) +

    `<p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.7;text-align:center;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       We received a request to reset your password for your
       <strong>${branding.appName}</strong> account.<br/>
       Click the button below to choose a new password.
     </p>` +

    `<p style="margin:0 0 24px 0;text-align:center;">` +
    ctaButton({ href: resetUrl, label: "Reset My Password →", color: "#2e7d52" }) +
    `</p>` +

    greenInfoCard({
      icon: "&#9203;",
      title: `Link expires in ${expiryHours} hours`,
      body: "This link is valid for one-time use only. After it expires you will need to request a new password reset.",
    }) +

    orangeInfoCard({
      icon: "&#9888;",
      title: "Didn't request this?",
      body: `If you did not request a password reset, please ignore this email — your account is safe and your password will not change. <strong>${branding.appName}</strong> will never ask you for your password.`,
    }) +

    divider() +

    `<p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;line-height:1.6;word-break:break-all;text-align:center;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       If the button above doesn't work, paste this link into your browser:<br/>
       <a href="${resetUrl}" style="color:#2e7d52;text-decoration:none;">${resetUrl}</a>
     </p>`;

  return baseTemplate({
    branding,
    previewText: `Reset your ${branding.appName} password — link expires in ${expiryHours} hours`,
    content,
    features: [
      { icon: "&#128274;", iconBg: "#dcfce7", title: "Secure Reset",   desc: "One-time link" },
      { icon: "&#9203;",   iconBg: "#fef9c3", title: `${expiryHours}h Expiry`, desc: "Act quickly" },
      { icon: "&#9989;",   iconBg: "#dcfce7", title: "Halal & Safe",   desc: "Your trust matters" },
      { icon: "&#128172;", iconBg: "#fff7ed", title: "Need Help?",     desc: "We are here for you" },
    ],
  });
}
