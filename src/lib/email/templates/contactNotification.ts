import type { EmailBranding } from "../branding";
import {
  baseTemplate, greeting, greenInfoCard, orangeInfoCard,
  ctaButton, divider, sectionHeading, DEFAULT_FEATURES,
} from "./base";

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT ACKNOWLEDGEMENT  — sent to the person who submitted the form
// ─────────────────────────────────────────────────────────────────────────────

export interface ContactAcknowledgementOptions {
  branding: EmailBranding;
  recipientName: string;
  inquiryType?: string;
  replyWithin?: string;
}

export function buildContactAcknowledgementEmail(opts: ContactAcknowledgementOptions): string {
  const { branding, recipientName, inquiryType = "inquiry", replyWithin = "48 hours" } = opts;

  const menuUrl = `${branding.websiteUrl}/menu`;
  const contactLine = branding.supportEmail
    ? `If you have an urgent question, you can reach us at <a href="mailto:${branding.supportEmail}"
         style="color:#2e7d52;font-weight:600;">${branding.supportEmail}</a>.`
    : "";

  const content =
    greeting(recipientName) +
    `<p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.7;text-align:center;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       Thank you for reaching out to <strong>${branding.appName}</strong>.<br/>
       We have successfully received your ${inquiryType} and our team will review it shortly.
     </p>` +

    greenInfoCard({
      icon: "&#9993;",
      title: "We have received your message!",
      body: `A member of our team will get back to you within <strong>${replyWithin}</strong>.`,
    }) +

    orangeInfoCard({
      icon: "&#128172;",
      title: "Explore our menu in the meantime",
      body: `You can explore our menu at <a href="${menuUrl}"
               style="color:#2e7d52;font-weight:600;">${menuUrl}</a>. ${contactLine}`,
    });

  return baseTemplate({
    branding,
    previewText: `Thank you for contacting ${branding.appName}!`,
    content,
    features: DEFAULT_FEATURES,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT NOTIFICATION  — sent to admin when a form is submitted
// ─────────────────────────────────────────────────────────────────────────────

export interface ContactNotificationAdminOptions {
  branding: EmailBranding;
  formType: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  fields: Array<{ label: string; value: string }>;
  submittedAt?: Date;
}

export function buildContactNotificationEmail(opts: ContactNotificationAdminOptions): string {
  const { branding, formType, submitterName, submitterEmail, fields, submittedAt } = opts;

  const fieldRows = fields
    .map(
      (f) =>
        `<tr>` +
        `<td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;width:36%;` +
        `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;` +
        `border-bottom:1px solid #f3f4f6;background:#f9fafb;">${f.label}</td>` +
        `<td style="padding:9px 14px;font-size:13px;color:#111827;` +
        `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;` +
        `border-bottom:1px solid #f3f4f6;">${f.value}</td>` +
        `</tr>`
    )
    .join("");

  const replyUrl = `mailto:${submitterEmail}?subject=Re: ${encodeURIComponent(formType)}`;

  const content =
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;">
       <tr><td align="center" style="padding-bottom:14px;">
         <div style="display:inline-block;width:52px;height:52px;border-radius:50%;
                     background:#fef9c3;font-size:26px;line-height:52px;text-align:center;">&#128276;</div>
       </td></tr>
       <tr><td align="center">
         <h2 style="margin:0 0 6px 0;font-size:22px;font-weight:800;color:#111827;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
           New ${formType}
         </h2>
         <p style="margin:0;font-size:14px;color:#6b7280;
                   font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
           from <strong style="color:#111827;">${submitterName}</strong>
           ${submittedAt ? `&nbsp;&middot;&nbsp;${submittedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : ""}
         </p>
       </td></tr>
     </table>` +

    sectionHeading("Submission Details") +
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:8px 0 24px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
       ${fieldRows}
     </table>` +

    divider() +
    `<p style="margin:16px 0 0 0;text-align:center;">` +
    ctaButton({ href: replyUrl, label: `Reply to ${submitterName} →`, color: "#2e7d52" }) +
    `</p>`;

  return baseTemplate({
    branding,
    previewText: `New ${formType} from ${submitterName}`,
    content,
  });
}
