import type { EmailBranding } from "../branding";

// ─── Base HTML email template ─────────────────────────────────────────────────
// Table-based, max-600px, inline CSS only in the body cells.
// A <style> block is also included in <head> for clients that support it
// (Apple Mail, Outlook desktop, Thunderbird) while still looking good in Gmail
// which strips <style> blocks but retains inline styles.

export function baseTemplate({
  branding,
  previewText,
  content,
  footerNote,
}: {
  branding: EmailBranding;
  previewText: string;
  content: string;
  footerNote?: string;
}): string {
  const year = new Date().getFullYear();
  const primary = branding.primaryColor || "#f59e0b";
  const dark = "#0d1117";

  const logoCell = branding.logoUrl
    ? '<img src="' +
      branding.logoUrl +
      '" alt="' +
      branding.appName +
      '" width="120" style="display:block;max-width:120px;height:auto;margin:0 auto 16px auto;" />'
    : '<h2 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:' +
      primary +
      ';">' +
      branding.appName +
      "</h2>";

  // Build social links for footer
  const socials = branding.socialLinks;
  const socialItems: string[] = [];
  if (socials.facebook) {
    socialItems.push(
      '<a href="' +
        socials.facebook +
        '" target="_blank" rel="noopener noreferrer" style="color:#9ca3af;text-decoration:none;font-size:12px;margin:0 8px;">Facebook</a>'
    );
  }
  if (socials.instagram) {
    socialItems.push(
      '<a href="' +
        socials.instagram +
        '" target="_blank" rel="noopener noreferrer" style="color:#9ca3af;text-decoration:none;font-size:12px;margin:0 8px;">Instagram</a>'
    );
  }
  if (socials.twitter) {
    socialItems.push(
      '<a href="' +
        socials.twitter +
        '" target="_blank" rel="noopener noreferrer" style="color:#9ca3af;text-decoration:none;font-size:12px;margin:0 8px;">Twitter</a>'
    );
  }
  if (socials.youtube) {
    socialItems.push(
      '<a href="' +
        socials.youtube +
        '" target="_blank" rel="noopener noreferrer" style="color:#9ca3af;text-decoration:none;font-size:12px;margin:0 8px;">YouTube</a>'
    );
  }
  const socialRow = socialItems.length
    ? '<p style="margin:10px 0 0 0;">' + socialItems.join(" &middot; ") + "</p>"
    : "";

  const supportLine = branding.supportEmail
    ? '<p style="margin:8px 0 0 0;font-size:12px;color:#6b7280;">Support: <a href="mailto:' +
      branding.supportEmail +
      '" style="color:' +
      primary +
      ';text-decoration:none;">' +
      branding.supportEmail +
      "</a></p>"
    : "";

  const websiteLine = branding.websiteUrl
    ? '<p style="margin:8px 0 0 0;font-size:12px;"><a href="' +
      branding.websiteUrl +
      '" target="_blank" rel="noopener noreferrer" style="color:' +
      primary +
      ';text-decoration:none;">' +
      branding.websiteUrl +
      "</a></p>"
    : "";

  const extraFooterNote = footerNote
    ? '<p style="margin:12px 0 0 0;font-size:11px;color:#4b5563;">' + footerNote + "</p>"
    : "";

  return (
    "<!DOCTYPE html>" +
    '<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">' +
    "<head>" +
    '<meta charset="UTF-8" />' +
    '<meta name="viewport" content="width=device-width,initial-scale=1" />' +
    "<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\" />" +
    "<meta name=\"x-apple-disable-message-reformatting\" />" +
    "<title>" +
    branding.appName +
    "</title>" +
    "<style>" +
    "body{margin:0;padding:0;background:#f3f4f6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}" +
    "table{border-spacing:0;}" +
    "td{padding:0;}" +
    "img{border:0;display:block;}" +
    "a{color:" +
    primary +
    ";}" +
    ".email-wrapper{width:100%;background:#f3f4f6;padding:24px 0;}" +
    ".email-container{max-width:600px;margin:0 auto;}" +
    ".email-header{background:" +
    dark +
    ";padding:32px 40px;text-align:center;border-radius:12px 12px 0 0;}" +
    ".email-body{background:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;}" +
    ".email-footer{background:" +
    dark +
    ";padding:24px 40px;text-align:center;border-radius:0 0 12px 12px;}" +
    "@media only screen and (max-width:600px){" +
    ".email-wrapper{padding:12px 0!important;}" +
    ".email-header{padding:24px 20px!important;}" +
    ".email-body{padding:28px 20px!important;}" +
    ".email-footer{padding:20px!important;}" +
    ".btn-full{width:100%!important;display:block!important;text-align:center!important;}" +
    "}" +
    "</style>" +
    "</head>" +
    "<body>" +
    // Preview text (hidden)
    '<div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">' +
    previewText +
    " &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;" +
    "</div>" +
    // Wrapper
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;">' +
    "<tr><td>" +
    '<table class="email-container" width="600" align="center" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;">' +
    // Spacer
    '<tr><td style="height:24px;"></td></tr>' +
    // Header
    '<tr><td class="email-header" style="background:' +
    dark +
    ';padding:32px 40px;text-align:center;border-radius:12px 12px 0 0;">' +
    logoCell +
    '<p style="margin:0;font-size:13px;color:#9ca3af;letter-spacing:0.05em;">' +
    branding.appName +
    "</p>" +
    "</td></tr>" +
    // Body
    '<tr><td class="email-body" style="background:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">' +
    content +
    "</td></tr>" +
    // Footer
    '<tr><td class="email-footer" style="background:' +
    dark +
    ';padding:24px 40px;text-align:center;border-radius:0 0 12px 12px;">' +
    socialRow +
    supportLine +
    websiteLine +
    extraFooterNote +
    '<p style="margin:16px 0 0 0;font-size:11px;color:#4b5563;">' +
    "&copy; " +
    year +
    " " +
    branding.appName +
    ". All rights reserved." +
    "</p>" +
    '<p style="margin:6px 0 0 0;font-size:10px;color:#374151;">' +
    "This is a transactional email. You are receiving it because you have an account or placed an order." +
    "</p>" +
    "</td></tr>" +
    // Bottom spacer
    '<tr><td style="height:24px;"></td></tr>' +
    "</table>" +
    "</td></tr>" +
    "</table>" +
    "</body>" +
    "</html>"
  );
}

// ─── Utility: amber CTA button (table-based, works in all clients) ────────────
export function ctaButton({
  href,
  label,
  primary = "#f59e0b",
  fullWidth = false,
}: {
  href: string;
  label: string;
  primary?: string;
  fullWidth?: boolean;
}): string {
  const widthStyle = fullWidth ? "width:100%;display:block;" : "";
  return (
    '<table cellpadding="0" cellspacing="0" role="presentation" style="' +
    (fullWidth ? "width:100%;" : "margin:0 auto;") +
    '">' +
    "<tr><td style=\"text-align:center;\">" +
    '<a href="' +
    href +
    '" target="_blank" rel="noopener noreferrer" ' +
    'style="' +
    widthStyle +
    "background:" +
    primary +
    ";color:#0d1117;font-weight:700;font-size:15px;text-decoration:none;" +
    "padding:14px 32px;border-radius:8px;display:inline-block;" +
    'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    label +
    "</a>" +
    "</td></tr>" +
    "</table>"
  );
}

// ─── Utility: section heading ─────────────────────────────────────────────────
export function sectionHeading(text: string, primary = "#f59e0b"): string {
  return (
    '<p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:' +
    primary +
    ";letter-spacing:0.1em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">" +
    text +
    "</p>"
  );
}

// ─── Utility: divider line ────────────────────────────────────────────────────
export function divider(): string {
  return '<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-top:1px solid #e5e7eb;padding:16px 0;"></td></tr></table>';
}
