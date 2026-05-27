import type { EmailBranding } from "../branding";
import { baseTemplate, greenInfoCard, orangeInfoCard } from "./base";

export interface OtpEmailOptions {
  branding: EmailBranding;
  recipientName: string;
  otp: string;
  expiryMinutes?: number;
  purpose?: string;
}

export function buildOtpEmail(opts: OtpEmailOptions): string {
  const { branding, recipientName, otp, expiryMinutes = 10, purpose = "verification" } = opts;

  const content =
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;text-align:center;">
       <tr><td align="center" style="padding-bottom:14px;">
         <div style="display:inline-block;width:52px;height:52px;border-radius:50%;
                     background:#dcfce7;font-size:26px;line-height:52px;text-align:center;">&#128274;</div>
       </td></tr>
       <tr><td align="center">
         <h2 style="margin:0 0 6px 0;font-size:22px;font-weight:800;color:#111827;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
           Hi ${recipientName},
         </h2>
         <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;
                   font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
           Your one-time password for <strong>${purpose}</strong> is:
         </p>
       </td></tr>
     </table>` +

    // Large OTP box
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:0 0 20px 0;">
       <tr><td align="center">
         <div style="display:inline-block;background:#1a3320;color:#4ade80;
                     font-size:38px;font-weight:900;letter-spacing:14px;
                     padding:18px 32px;border-radius:12px;
                     font-family:'Courier New',Courier,monospace;">
           ${otp}
         </div>
       </td></tr>
     </table>` +

    greenInfoCard({
      icon: "&#9203;",
      title: `Expires in ${expiryMinutes} minutes`,
      body: "This code is valid for one-time use only. Do not share it with anyone.",
    }) +

    orangeInfoCard({
      icon: "&#9888;",
      title: "Security Notice",
      body: `<strong>${branding.appName}</strong> will <strong>never</strong> ask for this code via call, SMS, or email. If you did not request this, please ignore this email and your account will remain secure.`,
    });

  return baseTemplate({
    branding,
    previewText: `Your ${branding.appName} verification code: ${otp}`,
    content,
  });
}
