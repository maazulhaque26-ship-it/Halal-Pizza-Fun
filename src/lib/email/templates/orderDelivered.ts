import type { EmailBranding } from "../branding";
import { baseTemplate, greeting, greenInfoCard, ctaButton, divider, sectionHeading } from "./base";
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
  if (currency === "INR") return "&#8377;" + amount.toFixed(2);
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

  const rateUrl    = reviewUrl  || `${branding.websiteUrl}/reviews`;
  const orderAgainUrl = reorderUrl || `${branding.websiteUrl}/menu`;

  // Compact items summary rows
  const itemSummaryRows = items
    .map((item) => {
      const addonsTotal = (item.selectedAddons || []).reduce((s, a) => s + a.price, 0);
      const lineTotal = (item.price + addonsTotal) * item.quantity;
      return (
        `<tr>` +
        `<td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;` +
        `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
        item.name +
        (item.variantName ? ` <span style="color:#9ca3af;">— ${item.variantName}</span>` : "") +
        `</td>` +
        `<td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:center;` +
        `font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
        `&times;${item.quantity}` +
        `</td>` +
        `<td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;` +
        `font-size:13px;color:#111827;font-weight:600;` +
        `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
        fmt(lineTotal, currency) +
        `</td>` +
        `</tr>`
      );
    })
    .join("");

  const content =
    greeting(customerName) +

    // Delivered celebration banner
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:0 0 24px 0;">
       <tr>
         <td align="center" style="background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:12px;
                                   padding:28px 20px;">
           <p style="margin:0 0 8px 0;font-size:38px;">&#127881;</p>
           <h2 style="margin:0 0 6px 0;font-size:20px;font-weight:800;color:#065f46;
                      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
             Your order has been delivered!
           </h2>
           <p style="margin:0;font-size:14px;color:#047857;
                     font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
             We hope you enjoy every bite. Bon appétit! 🍕
           </p>
         </td>
       </tr>
     </table>` +

    `<p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;text-align:center;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       Order reference: <strong style="color:#111827;">${orderId}</strong>
     </p>` +

    // Order summary
    sectionHeading("Order Summary") +
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:8px 0 0 0;">
       ${itemSummaryRows}
       <tr style="border-top:2px solid #1a3320;">
         <td colspan="2" style="padding:10px 0 4px 0;font-size:14px;font-weight:700;color:#111827;
                                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Total Paid</td>
         <td style="padding:10px 0 4px 0;text-align:right;font-size:16px;font-weight:800;color:#1a3320;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmt(total, currency)}</td>
       </tr>
     </table>` +

    divider() +

    // Review prompt
    greenInfoCard({
      icon: "&#11088;",
      title: "How was your experience?",
      body: `Your feedback helps us serve you better. Leave a quick review and let us know what you thought about your order!`,
    }) +

    // Star rating row (decorative)
    `<p style="margin:0 0 20px 0;text-align:center;font-size:30px;letter-spacing:4px;">
       &#11088;&#11088;&#11088;&#11088;&#11088;
     </p>` +

    // Two action buttons
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 8px 0;">
       <tr>
         <td width="48%" align="center">
           ${ctaButton({ href: rateUrl, label: "Leave a Review", color: "#2e7d52" })}
         </td>
         <td width="4%"></td>
         <td width="48%" align="center">
           <a href="${orderAgainUrl}"
              style="display:inline-block;border:2px solid #f4813f;color:#f4813f;font-weight:700;
                     font-size:14px;text-decoration:none;padding:12px 20px;border-radius:8px;
                     font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
             Order Again →
           </a>
         </td>
       </tr>
     </table>`;

  return baseTemplate({
    branding,
    previewText: `Order ${orderId} delivered! Rate your experience — we'd love to hear from you.`,
    content,
    features: [
      { icon: "&#127881;", iconBg: "#dcfce7", title: "Delivered!",       desc: "Enjoy your meal" },
      { icon: "&#11088;",  iconBg: "#fefce8", title: "Rate Us",          desc: "Your feedback counts" },
      { icon: "&#127829;", iconBg: "#fce7f3", title: "Order Again",      desc: "Same great taste" },
      { icon: "&#128150;", iconBg: "#fff7ed", title: "Thank You!",       desc: "We appreciate you" },
    ],
  });
}
