import type { EmailBranding } from "../branding";
import { baseTemplate, greeting, greenInfoCard, ctaButton, DEFAULT_FEATURES } from "./base";

export interface WelcomeEmailOptions {
  branding: EmailBranding;
  recipientName: string;
  loginUrl?: string;
}

export function buildWelcomeEmail(opts: WelcomeEmailOptions): string {
  const { branding, recipientName, loginUrl } = opts;
  const menuUrl = loginUrl || `${branding.websiteUrl}/menu`;

  const content =
    greeting(recipientName) +

    `<p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.7;text-align:center;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       Welcome to the <strong>${branding.appName}</strong> family! 🎉<br/>
       Your account is ready and you can start exploring our delicious halal menu right away.
     </p>` +

    greenInfoCard({
      icon: "&#127881;",
      title: "Your account is active!",
      body: `You can now place orders, track deliveries in real-time, and enjoy exclusive offers on <strong>${branding.appName}</strong>.`,
    }) +

    `<p style="margin:0 0 28px 0;text-align:center;">` +
    ctaButton({ href: menuUrl, label: "Explore Our Menu →", color: "#f4813f" }) +
    `</p>` +

    `<p style="margin:0 0 28px 0;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       Questions? Reach us at
       ${branding.supportEmail
         ? `<a href="mailto:${branding.supportEmail}" style="color:#2e7d52;font-weight:600;text-decoration:none;">${branding.supportEmail}</a>`
         : "our support team"
       } — we are always happy to help.
     </p>`;

  return baseTemplate({
    branding,
    previewText: `Welcome to ${branding.appName}! Your account is ready — start ordering now.`,
    content,
    features: DEFAULT_FEATURES,
  });
}
