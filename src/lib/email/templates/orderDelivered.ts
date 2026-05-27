import type { EmailBranding } from "../branding";
import { baseTemplate, ctaButton, divider, sectionHeading } from "./base";
import type { OrderItem } from "./orderConfirmation";

export interface OrderDeliveredEmailOptions {
  branding: EmailBranding;
  customerName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  reviewUrl?: string;
  reorderUrl?: string;
  currency?: string;
}

function fmt(amount: number, currency = "INR"): string {
  if (currency === "INR") return "₹" + amount.toFixed(2);
  return currency + " " + amount.toFixed(2);
}

export function buildOrderDeliveredEmail(opts: OrderDeliveredEmailOptions): string {
  const {
    branding,
    customerName,
    orderId,
    items,
    total,
    reviewUrl,
    reorderUrl,
    currency = "INR",
  } = opts;

  const primary = branding.primaryColor || "#f59e0b";
  const rateUrl = reviewUrl || branding.websiteUrl + "/reviews";
  const orderAgainUrl = reorderUrl || branding.websiteUrl + "/menu";

  // Compact items summary
  const itemSummaryRows = items
    .map(
      (item) =>
        "<tr>" +
        '<td style="padding:6px 0;font-size:13px;color:#4b5563;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
        item.name +
        (item.variantName ? " — " + item.variantName : "") +
        "</td>" +
        '<td style="padding:6px 0;text-align:center;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
        "&times;" + item.quantity +
        "</td>" +
        '<td style="padding:6px 0;text-align:right;font-size:13px;color:#111827;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
        fmt(item.price * item.quantity, currency) +
        "</td>" +
        "</tr>"
    )
    .join("");

  const content =
    // Success banner
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px 0;">' +
    "<tr>" +
    '<td align="center" style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:12px;padding:28px 20px;">' +
    '<p style="margin:0 0 8px 0;font-size:40px;">&#x1F389;</p>' +
    '<p style="margin:0 0 6px 0;font-size:20px;font-weight:800;color:#065f46;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "Your order has been delivered!" +
    "</p>" +
    '<p style="margin:0;font-size:14px;color:#047857;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "We hope you enjoy every bite, " +
    customerName +
    "." +
    "</p>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    // Order reference
    '<p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "Order reference: <strong style=\"color:#111827;\">" +
    orderId +
    "</strong>" +
    "</p>" +
    // Item summary
    sectionHeading("Order Summary", primary) +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:10px 0 0 0;">' +
    itemSummaryRows +
    '<tr style="border-top:2px solid #e5e7eb;">' +
    '<td colspan="2" style="padding:10px 0 4px 0;font-size:14px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Total Paid</td>' +
    '<td style="padding:10px 0 4px 0;text-align:right;font-size:15px;font-weight:800;color:' +
    primary +
    ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    fmt(total, currency) +
    "</td>" +
    "</tr>" +
    "</table>" +
    divider() +
    // Rating CTA
    '<p style="margin:0 0 12px 0;font-size:15px;font-weight:600;color:#111827;text-align:center;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "How was your experience? Your feedback means a lot to us." +
    "</p>" +
    // Star rating row
    '<p style="margin:0 0 20px 0;text-align:center;font-size:32px;">&#x2B50;&#x2B50;&#x2B50;&#x2B50;&#x2B50;</p>' +
    // Two buttons side by side (table-based)
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0;">' +
    "<tr>" +
    '<td width="48%" align="center">' +
    ctaButton({ href: rateUrl, label: "Leave a Review", primary }) +
    "</td>" +
    '<td width="4%"></td>' +
    '<td width="48%" align="center">' +
    '<a href="' +
    orderAgainUrl +
    '" style="display:inline-block;border:2px solid ' +
    primary +
    ";color:" +
    primary +
    ";font-weight:700;font-size:14px;text-decoration:none;" +
    "padding:12px 20px;border-radius:8px;" +
    'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Order Again</a>' +
    "</td>" +
    "</tr>" +
    "</table>";

  return baseTemplate({
    branding,
    previewText: "Your order " + orderId + " has been delivered! Rate your experience.",
    content,
  });
}
