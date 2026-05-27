import type { EmailBranding } from "../branding";

// ─────────────────────────────────────────────────────────────────────────────
// BASE EMAIL TEMPLATE
// Design: dark-green header + pizza hero, white body, dark-green footer
// Compatible: Gmail · Outlook · Apple Mail · mobile
// All layout is table-based; critical styles are inlined everywhere they matter.
// ─────────────────────────────────────────────────────────────────────────────

export function baseTemplate({
  branding,
  previewText,
  content,
  footerNote,
  features,
}: {
  branding: EmailBranding;
  previewText: string;
  content: string;
  footerNote?: string;
  /** Optional 4-item feature grid shown below the main content */
  features?: FeatureItem[];
}): string {
  const dark  = branding.darkColor  || "#1a3320";
  const accentGreen = branding.accentColor || "#2e7d52";
  const orange = branding.primaryColor || "#f4813f";
  const year   = new Date().getFullYear();

  // ── Header logo / name ────────────────────────────────────────────────────
  const logoImg = branding.logoUrl
    ? `<img src="${esc(branding.logoUrl)}" alt="${esc(branding.appName)}" width="72" height="72"
         style="display:block;margin:0 auto 10px auto;border-radius:50%;
                border:3px solid rgba(255,255,255,0.25);object-fit:cover;" />`
    : "";

  // ── Social icon circles ───────────────────────────────────────────────────
  const sl = branding.socialLinks;
  const socialCells: string[] = [];
  if (sl.facebook) {
    socialCells.push(socialIcon(sl.facebook, "#1877f2", "f", "Facebook"));
  }
  if (sl.instagram) {
    socialCells.push(socialIcon(sl.instagram, "#e1306c", "&#9679;", "Instagram"));
  }
  if (sl.whatsapp) {
    socialCells.push(socialIcon(sl.whatsapp, "#25d366", "&#10004;", "WhatsApp"));
  }
  if (sl.twitter) {
    socialCells.push(socialIcon(sl.twitter, "#1da1f2", "t", "Twitter"));
  }
  if (sl.youtube) {
    socialCells.push(socialIcon(sl.youtube, "#ff0000", "&#9654;", "YouTube"));
  }

  const socialRow = socialCells.length
    ? `<p style="margin:0 0 12px 0;font-size:13px;color:#9ca3af;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
         Follow us on
       </p>
       <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 16px auto;">
         <tr>${socialCells.map(c => `<td style="padding:0 5px;">${c}</td>`).join("")}</tr>
       </table>`
    : "";

  // ── Footer contact row ────────────────────────────────────────────────────
  const contactParts: string[] = [];
  if (branding.supportEmail) {
    contactParts.push(
      `&#9993;&nbsp;<a href="mailto:${esc(branding.supportEmail)}"
          style="color:#d1d5db;text-decoration:none;font-size:12px;">${esc(branding.supportEmail)}</a>`
    );
  }
  if (branding.phone) {
    contactParts.push(
      `&#128222;&nbsp;<a href="tel:${esc(branding.phone)}"
          style="color:#d1d5db;text-decoration:none;font-size:12px;">${esc(branding.phone)}</a>`
    );
  }
  if (branding.websiteUrl) {
    const domain = branding.websiteUrl.replace(/^https?:\/\//, "");
    contactParts.push(
      `&#127760;&nbsp;<a href="${esc(branding.websiteUrl)}" target="_blank" rel="noopener noreferrer"
          style="color:#d1d5db;text-decoration:none;font-size:12px;">${esc(domain)}</a>`
    );
  }

  const contactRow = contactParts.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="border-top:1px dashed rgba(255,255,255,0.15);margin:12px 0 16px 0;">
         <tr><td style="padding:16px 0;text-align:center;">
           ${contactParts.map(p =>
             `<span style="display:inline-block;padding:0 12px;
                    border-right:1px solid rgba(255,255,255,0.2);
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                    color:#d1d5db;">${p}</span>`
           ).join("")}
         </td></tr>
       </table>`
    : "";

  // ── Feature grid ──────────────────────────────────────────────────────────
  const featureGridHtml = features && features.length
    ? featureGrid(features)
    : "";

  // ── Extra footer note ─────────────────────────────────────────────────────
  const footerNoteHtml = footerNote
    ? `<p style="margin:8px 0 0 0;font-size:11px;color:#6b7280;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
         ${footerNote}
       </p>`
    : "";

  return (
    `<!DOCTYPE html>` +
    `<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">` +
    `<head>` +
    `<meta charset="UTF-8" />` +
    `<meta name="viewport" content="width=device-width,initial-scale=1" />` +
    `<meta http-equiv="X-UA-Compatible" content="IE=edge" />` +
    `<meta name="x-apple-disable-message-reformatting" />` +
    `<meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />` +
    `<title>${esc(branding.appName)}</title>` +
    `<style>` +
    `body{margin:0;padding:0;background:#f1f5f1;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}` +
    `table{border-spacing:0;}td{padding:0;}img{border:0;display:block;}` +
    `.email-outer{background:#f1f5f1;padding:20px 0;}` +
    `.email-wrap{max-width:600px;margin:0 auto;}` +
    `a{color:${orange};}` +
    `@media only screen and (max-width:600px){` +
    `.email-outer{padding:0!important;}` +
    `.hdr-text{padding:24px 16px!important;}` +
    `.hdr-img{display:none!important;max-height:0!important;overflow:hidden!important;}` +
    `.body-pad{padding:28px 18px!important;}` +
    `.feat-cell{display:block!important;width:100%!important;padding:10px 0!important;}` +
    `.btn-full{width:100%!important;display:block!important;}` +
    `}` +
    `</style>` +
    `</head>` +
    `<body style="margin:0;padding:0;background:#f1f5f1;">` +

    // ── Preview text (hidden) ───────────────────────────────────────────────
    `<div style="display:none;font-size:1px;color:#f1f5f1;line-height:1px;` +
    `max-height:0;max-width:0;opacity:0;overflow:hidden;">` +
    esc(previewText) +
    `&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;` +
    `&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;` +
    `</div>` +

    // ── Outer wrapper ───────────────────────────────────────────────────────
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"` +
    ` style="background:#f1f5f1;" class="email-outer">` +
    `<tr><td>` +

    // ── Container ──────────────────────────────────────────────────────────
    `<table class="email-wrap" align="center" width="600" cellpadding="0" cellspacing="0"` +
    ` role="presentation" style="max-width:600px;margin:0 auto;">` +

    // Spacer
    `<tr><td style="height:20px;"></td></tr>` +

    // ── HEADER ─────────────────────────────────────────────────────────────
    `<tr><td style="border-radius:16px 16px 0 0;overflow:hidden;">` +
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">` +
    `<tr bgcolor="${dark}">` +

    // Header left — logo + name + tagline
    `<td class="hdr-text" valign="middle"` +
    ` style="background:${dark};padding:32px 28px;text-align:center;width:60%;">` +
    logoImg +
    `<h1 style="margin:0 0 6px 0;font-size:26px;font-weight:800;line-height:1.2;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    `<span style="color:#4ade80;">${esc(branding.appName.split(" ")[0])}</span>` +
    `<span style="color:#ffffff;"> ${esc(branding.appName.split(" ").slice(1).join(" "))}</span>` +
    `</h1>` +
    `<p style="margin:0;font-size:14px;font-style:italic;color:#86efac;` +
    `font-family:Georgia,'Times New Roman',serif;letter-spacing:0.03em;">` +
    esc(branding.tagline) +
    `</p>` +
    `</td>` +

    // Header right — food image
    `<td class="hdr-img" valign="bottom" align="right"` +
    ` style="background:${dark};width:40%;padding:0;vertical-align:bottom;">` +
    `<img src="${esc(branding.headerFoodImageUrl)}" alt="Delicious Food" width="200"` +
    ` style="display:block;width:200px;max-width:100%;height:auto;` +
    `border-radius:0 16px 0 0;object-fit:cover;" />` +
    `</td>` +

    `</tr>` +
    `</table>` +
    `</td></tr>` +
    // ── END HEADER ──────────────────────────────────────────────────────────

    // ── BODY ────────────────────────────────────────────────────────────────
    `<tr><td class="body-pad"` +
    ` style="background:#ffffff;padding:36px 40px;` +
    `border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">` +
    content +
    `</td></tr>` +
    // ── END BODY ────────────────────────────────────────────────────────────

    // ── FEATURE GRID ────────────────────────────────────────────────────────
    (featureGridHtml
      ? `<tr><td style="background:#ffffff;padding:0 40px 36px 40px;` +
        `border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">` +
        featureGridHtml +
        `</td></tr>`
      : "") +
    // ── END FEATURE GRID ────────────────────────────────────────────────────

    // ── FOOTER ──────────────────────────────────────────────────────────────
    `<tr><td style="background:${dark};padding:28px 32px;text-align:center;` +
    `border-radius:0 0 16px 16px;">` +
    socialRow +
    contactRow +
    footerNoteHtml +
    `<p style="margin:0;font-size:11px;color:#6b7280;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    `&copy; ${year} ${esc(branding.appName)}. All rights reserved.` +
    `</p>` +
    `<p style="margin:6px 0 0 0;font-size:10px;color:#4b5563;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    `This is a transactional email. You are receiving it because you have an account or placed an order.` +
    `</p>` +
    `</td></tr>` +
    // ── END FOOTER ──────────────────────────────────────────────────────────

    `<tr><td style="height:20px;"></td></tr>` +
    `</table>` +
    `</td></tr>` +
    `</table>` +
    `</body>` +
    `</html>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE GRID COMPONENT
// 4-column grid with icon, title, description — like the screenshot
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureItem {
  icon: string;        // emoji or unicode character
  iconBg: string;      // background color for the icon circle
  title: string;
  desc: string;
}

export const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "✅", iconBg: "#dcfce7", title: "100% Halal",        desc: "Quality ingredients you can trust" },
  { icon: "🍕", iconBg: "#fce7f3", title: "Fresh & Delicious", desc: "Made fresh, just the way you love" },
  { icon: "🛵", iconBg: "#fff7ed", title: "Fast Delivery",      desc: "Quick delivery to your doorstep"  },
  { icon: "💙", iconBg: "#ede9fe", title: "Customer First",     desc: "We care about your happiness"     },
];

export function featureGrid(items: FeatureItem[]): string {
  const cells = items.slice(0, 4).map((item) =>
    `<td class="feat-cell" width="25%" valign="top" align="center"` +
    ` style="padding:8px 6px;width:25%;text-align:center;vertical-align:top;">` +
    `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">` +
    `<tr><td align="center" valign="middle" width="44" height="44"` +
    ` style="width:44px;height:44px;border-radius:50%;background:${item.iconBg};` +
    `font-size:20px;line-height:44px;text-align:center;">` +
    item.icon +
    `</td></tr>` +
    `</table>` +
    `<p style="margin:8px 0 2px 0;font-size:12px;font-weight:700;color:#1a3320;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    esc(item.title) +
    `</p>` +
    `<p style="margin:0;font-size:11px;color:#6b7280;line-height:1.4;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    esc(item.desc) +
    `</p>` +
    `</td>`
  ).join("");

  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"` +
    ` style="border-top:1px solid #f3f4f6;padding-top:24px;margin-top:4px;">` +
    `<tr>${cells}</tr>` +
    `</table>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO CARD COMPONENTS  (green card · orange card)
// ─────────────────────────────────────────────────────────────────────────────

export function greenInfoCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}): string {
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"` +
    ` style="margin:20px 0;background:#f0faf4;border:1px solid #bbf7d0;border-radius:10px;">` +
    `<tr>` +
    `<td valign="middle" align="center" width="56"` +
    ` style="width:56px;padding:16px 0 16px 16px;">` +
    `<div style="width:40px;height:40px;border-radius:50%;background:#2e7d52;` +
    `font-size:18px;line-height:40px;text-align:center;color:#fff;">` +
    icon +
    `</div>` +
    `</td>` +
    `<td style="padding:16px 18px;">` +
    `<p style="margin:0 0 3px 0;font-size:14px;font-weight:700;color:#166534;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    esc(title) +
    `</p>` +
    `<p style="margin:0;font-size:13px;color:#374151;line-height:1.5;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    body +
    `</p>` +
    `</td>` +
    `</tr>` +
    `</table>`
  );
}

export function orangeInfoCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}): string {
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"` +
    ` style="margin:16px 0;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">` +
    `<tr>` +
    `<td valign="middle" align="center" width="56"` +
    ` style="width:56px;padding:16px 0 16px 16px;">` +
    `<div style="width:40px;height:40px;border-radius:50%;background:#f4813f;` +
    `font-size:18px;line-height:40px;text-align:center;color:#fff;">` +
    icon +
    `</div>` +
    `</td>` +
    `<td style="padding:16px 18px;">` +
    `<p style="margin:0 0 3px 0;font-size:14px;font-weight:700;color:#9a3412;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    esc(title) +
    `</p>` +
    `<p style="margin:0;font-size:13px;color:#374151;line-height:1.5;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    body +
    `</p>` +
    `</td>` +
    `</tr>` +
    `</table>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA BUTTON — orange, rounded, email-safe
// ─────────────────────────────────────────────────────────────────────────────

export function ctaButton({
  href,
  label,
  color = "#f4813f",
  fullWidth = false,
}: {
  href: string;
  label: string;
  color?: string;
  fullWidth?: boolean;
}): string {
  return (
    `<table cellpadding="0" cellspacing="0" role="presentation"` +
    ` style="${fullWidth ? "width:100%;" : "margin:0 auto;"}">` +
    `<tr><td align="center">` +
    `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"` +
    ` style="display:inline-block;${fullWidth ? "width:100%;box-sizing:border-box;" : ""}` +
    `background:${color};color:#ffffff;font-weight:700;font-size:15px;` +
    `text-decoration:none;padding:14px 36px;border-radius:8px;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    esc(label) +
    `</a>` +
    `</td></tr>` +
    `</table>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADING  (small uppercase label)
// ─────────────────────────────────────────────────────────────────────────────

export function sectionHeading(text: string, color = "#2e7d52"): string {
  return (
    `<p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${color};` +
    `letter-spacing:0.1em;text-transform:uppercase;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    esc(text) +
    `</p>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function divider(): string {
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">` +
    `<tr><td style="border-top:1px solid #e5e7eb;padding:12px 0;"></td></tr>` +
    `</table>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GREETING SECTION  (checkmark circle + "Hi [Name],")
// ─────────────────────────────────────────────────────────────────────────────

export function greeting(name: string): string {
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"` +
    ` style="margin:0 0 20px 0;text-align:center;">` +
    `<tr><td align="center" style="padding-bottom:16px;">` +
    `<div style="display:inline-block;width:52px;height:52px;border-radius:50%;` +
    `background:#dcfce7;font-size:26px;line-height:52px;text-align:center;">✅</div>` +
    `</td></tr>` +
    `<tr><td align="center">` +
    `<h2 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#111827;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
    `Hi ${esc(name)},` +
    `</h2>` +
    `</td></tr>` +
    `</table>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** HTML-escape a string to prevent XSS in templates */
function esc(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Circular social icon cell */
function socialIcon(href: string, bg: string, symbol: string, label: string): string {
  return (
    `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"` +
    ` style="text-decoration:none;" title="${esc(label)}">` +
    `<table cellpadding="0" cellspacing="0" role="presentation">` +
    `<tr><td align="center" valign="middle" width="36" height="36"` +
    ` style="width:36px;height:36px;border-radius:50%;background:${bg};` +
    `color:#ffffff;font-size:14px;font-family:Arial,sans-serif;` +
    `font-weight:700;text-align:center;line-height:36px;">` +
    symbol +
    `</td></tr>` +
    `</table>` +
    `</a>`
  );
}
