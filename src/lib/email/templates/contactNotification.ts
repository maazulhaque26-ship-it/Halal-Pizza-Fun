import type { EmailBranding } from "../branding";
import { baseTemplate, divider, sectionHeading } from "./base";

// ─── Admin notification for contact / inquiry form submissions ─────────────────
// This template is used for ANY form inquiry (contact page, franchise page, etc.)
// It is intentionally minimal — just the submitted data displayed cleanly.

export interface ContactNotificationAdminOptions {
  branding: EmailBranding;
  /** Label shown in the email header — e.g. "New Contact Inquiry" */
  formType?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  fields: Array<{ label: string; value: string }>;
  submittedAt?: Date;
}

export interface ContactAcknowledgementOptions {
  branding: EmailBranding;
  recipientName: string;
  /** Friendly label for what was submitted — e.g. "contact inquiry", "partnership request" */
  inquiryType?: string;
  /** Expected reply timeframe — e.g. "48 hours" */
  replyWithin?: string;
}

// ─── 1. Admin notification ────────────────────────────────────────────────────
export function buildContactNotificationEmail(opts: ContactNotificationAdminOptions): string {
  const {
    branding,
    formType = "New Inquiry",
    submitterName,
    submitterEmail,
    submitterPhone,
    fields,
    submittedAt,
  } = opts;

  const primary = branding.primaryColor || "#f59e0b";

  const infoRow = (label: string, value: string): string =>
    "<tr>" +
    '<td style="padding:8px 0;font-size:13px;color:#6b7280;width:140px;vertical-align:top;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    label +
    "</td>" +
    '<td style="padding:8px 0;font-size:13px;color:#111827;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    value +
    "</td>" +
    "</tr>";

  const fieldRows = fields.map((f) => infoRow(f.label, f.value)).join("");
  const timeStr = submittedAt ? submittedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const content =
    // Alert header
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px 0;">' +
    "<tr>" +
    '<td style="background:#fef3c7;border-left:4px solid ' +
    primary +
    ";border-radius:0 8px 8px 0;padding:16px 20px;\">" +
    '<p style="margin:0 0 4px 0;font-size:17px;font-weight:800;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "&#x1F4EC; " +
    formType +
    "</p>" +
    '<p style="margin:0;font-size:13px;color:#374151;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "Received on " +
    timeStr +
    "</p>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    // Contact info
    sectionHeading("Submitted By", primary) +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 20px 0;">' +
    infoRow("Name", submitterName) +
    infoRow("Email", '<a href="mailto:' + submitterEmail + '" style="color:' + primary + ';text-decoration:none;">' + submitterEmail + "</a>") +
    (submitterPhone ? infoRow("Phone", submitterPhone) : "") +
    "</table>" +
    divider() +
    // Form fields
    sectionHeading("Submitted Details", primary) +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 0 0;">' +
    fieldRows +
    "</table>";

  return baseTemplate({
    branding,
    previewText: formType + " from " + submitterName + " (" + submitterEmail + ")",
    content,
    footerNote: "This is an automated notification from " + branding.appName + ". Reply directly to this email to respond to the submitter.",
  });
}

// ─── 2. Submitter acknowledgement ─────────────────────────────────────────────
export function buildContactAcknowledgementEmail(opts: ContactAcknowledgementOptions): string {
  const { branding, recipientName, inquiryType = "inquiry", replyWithin = "48 hours" } = opts;
  const primary = branding.primaryColor || "#f59e0b";

  const content =
    '<p style="margin:0 0 20px 0;font-size:18px;font-weight:600;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "Hi " + recipientName + "," +
    "</p>" +
    '<p style="margin:0 0 20px 0;font-size:15px;color:#4b5563;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "Thank you for reaching out to <strong>" + branding.appName + "</strong>. " +
    "We have successfully received your " + inquiryType + " and our team will review it shortly." +
    "</p>" +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px 0;">' +
    "<tr>" +
    '<td style="background:#f0fdf4;border:1px solid #6ee7b7;border-radius:8px;padding:16px 20px;">' +
    '<p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#065f46;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "&#x2705; We have received your message!" +
    "</p>" +
    '<p style="margin:0;font-size:13px;color:#047857;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "A member of our team will get back to you within <strong>" + replyWithin + "</strong>." +
    "</p>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    divider() +
    '<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "In the meantime, you can explore our menu at " +
    '<a href="' + branding.websiteUrl + '/menu" style="color:' + primary + ';text-decoration:none;">' + branding.websiteUrl + "/menu</a>. " +
    "If you have an urgent question, you can reach us at " +
    (branding.supportEmail
      ? '<a href="mailto:' + branding.supportEmail + '" style="color:' + primary + ';text-decoration:none;">' + branding.supportEmail + "</a>"
      : "our support email") +
    "." +
    "</p>";

  return baseTemplate({
    branding,
    previewText: "We received your " + inquiryType + " — our team will reply within " + replyWithin + ".",
    content,
  });
}
