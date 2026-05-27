import type { EmailBranding } from "../branding";
import { baseTemplate, ctaButton, divider } from "./base";

export interface WelcomeEmailOptions {
  branding: EmailBranding;
  recipientName: string;
  loginUrl?: string;
}

export function buildWelcomeEmail(opts: WelcomeEmailOptions): string {
  const { branding, recipientName, loginUrl } = opts;
  const primary = branding.primaryColor || "#f59e0b";
  const menuUrl = loginUrl || branding.websiteUrl + "/menu";

  // Feature highlights
  const features: Array<{ icon: string; title: string; desc: string }> = [
    {
      icon: "&#x1F525;",
      title: "Fresh Every Time",
      desc: "Every order is prepared fresh using premium halal-certified ingredients.",
    },
    {
      icon: "&#x26A1;",
      title: "Lightning Fast Delivery",
      desc: "Real-time order tracking so you always know when your food arrives.",
    },
    {
      icon: "&#x1F381;",
      title: "Exclusive Deals",
      desc: "App-only offers, loyalty rewards and seasonal coupons just for you.",
    },
  ];

  const featureCells = features
    .map(
      (f) =>
        '<td width="33%" align="center" valign="top" style="padding:0 8px;">' +
        '<p style="font-size:28px;margin:0 0 8px 0;">' +
        f.icon +
        "</p>" +
        '<p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
        f.title +
        "</p>" +
        '<p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
        f.desc +
        "</p>" +
        "</td>"
    )
    .join("");

  const content =
    '<p style="margin:0 0 20px 0;font-size:22px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "Welcome, " +
    '<span style="color:' +
    primary +
    ';">' +
    recipientName +
    "</span>!" +
    "</p>" +
    '<p style="margin:0 0 28px 0;font-size:15px;color:#4b5563;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "Thank you for joining <strong>" +
    branding.appName +
    "</strong>. Your account is ready and you can start exploring our menu right away." +
    "</p>" +
    // Feature table
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 32px 0;background:#f9fafb;border-radius:10px;padding:24px 16px;">' +
    "<tr>" +
    featureCells +
    "</tr>" +
    "</table>" +
    // CTA
    '<p style="margin:0 0 20px 0;text-align:center;">' +
    ctaButton({ href: menuUrl, label: "Explore Our Menu →", primary, fullWidth: false }) +
    "</p>" +
    divider() +
    '<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "If you have any questions, reply to this email or contact us at " +
    (branding.supportEmail
      ? '<a href="mailto:' +
        branding.supportEmail +
        '" style="color:' +
        primary +
        ';text-decoration:none;">' +
        branding.supportEmail +
        "</a>"
      : "our support team") +
    ". We are always happy to help." +
    "</p>";

  return baseTemplate({
    branding,
    previewText: "Welcome to " + branding.appName + "! Your account is ready — start ordering now.",
    content,
  });
}
