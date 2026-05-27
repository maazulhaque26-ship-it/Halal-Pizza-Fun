import type { EmailBranding } from "../branding";
import {
  baseTemplate, greeting, greenInfoCard, orangeInfoCard,
  ctaButton, divider, sectionHeading, featureGrid,
} from "./base";

export interface OrderItem {
  name: string;
  variantName?: string;
  quantity: number;
  price: number;
  selectedAddons?: Array<{ name: string; price: number }>;
}

export interface OrderConfirmationEmailOptions {
  branding: EmailBranding;
  customerName: string;
  orderId: string;
  orderStatus?: string;
  items: OrderItem[];
  subTotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    houseNumber: string;
    floor?: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    deliveryInstructions?: string;
  };
  estimatedMinutes?: number;
  trackUrl?: string;
  currency?: string;
}

function fmt(amount: number, currency = "INR"): string {
  if (currency === "INR") return "&#8377;" + amount.toFixed(2);
  return currency + " " + amount.toFixed(2);
}

function statusColor(status: string): string {
  const s = status.toUpperCase();
  if (s === "DELIVERED") return "#10b981";
  if (s === "CANCELLED" || s === "REJECTED") return "#ef4444";
  return "#2e7d52";
}

export function buildOrderConfirmationEmail(opts: OrderConfirmationEmailOptions): string {
  const {
    branding, customerName, orderId, orderStatus = "PLACED",
    items, subTotal, tax, deliveryFee, total,
    paymentMethod, deliveryAddress, estimatedMinutes,
    trackUrl, currency = "INR",
  } = opts;

  const appUrl = trackUrl || `${branding.websiteUrl}/orders`;

  // Items table rows
  const itemRows = items.map((item) => {
    const addonsTotal = (item.selectedAddons || []).reduce((s, a) => s + a.price, 0);
    const lineTotal = (item.price + addonsTotal) * item.quantity;
    const addonNote =
      item.selectedAddons && item.selectedAddons.length > 0
        ? `<br/><span style="font-size:11px;color:#9ca3af;">` +
          item.selectedAddons.map((a) => `${a.name} (+${fmt(a.price, currency)})`).join(", ") +
          `</span>`
        : "";
    const variantNote = item.variantName
      ? `<br/><span style="font-size:11px;color:#9ca3af;">${item.variantName}</span>`
      : "";

    return (
      `<tr>` +
      `<td style="padding:10px 0;border-bottom:1px solid #f3f4f6;` +
      `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
      `<p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${item.name}</p>` +
      variantNote + addonNote +
      `</td>` +
      `<td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:center;` +
      `font-size:14px;color:#374151;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
      `&times;${item.quantity}` +
      `</td>` +
      `<td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;` +
      `font-size:14px;color:#111827;font-weight:600;` +
      `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
      fmt(lineTotal, currency) +
      `</td>` +
      `</tr>`
    );
  }).join("");

  const addrParts = [
    deliveryAddress.houseNumber,
    deliveryAddress.floor ? `Floor ${deliveryAddress.floor}` : "",
    deliveryAddress.street,
    deliveryAddress.landmark ? `Near ${deliveryAddress.landmark}` : "",
    deliveryAddress.city, deliveryAddress.state, deliveryAddress.pincode,
  ].filter(Boolean);

  const etaHtml = estimatedMinutes
    ? `<p style="margin:0 0 16px 0;font-size:14px;color:#374151;text-align:center;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
         &#128336; Estimated delivery in approximately <strong>${estimatedMinutes} minutes</strong>.
       </p>`
    : "";

  const content =
    greeting(customerName) +
    `<p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.7;text-align:center;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       Your order has been received and is being prepared with fresh, halal ingredients!
     </p>` +

    // Order ID + status badge
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:0 0 20px 0;background:#f9fafb;border:1px solid #e5e7eb;
                   border-radius:10px;padding:16px 20px;">
       <tr>
         <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
           <p style="margin:0 0 2px 0;font-size:11px;color:#9ca3af;font-weight:600;
                     text-transform:uppercase;letter-spacing:0.1em;">Order Number</p>
           <p style="margin:0;font-size:22px;font-weight:800;color:#111827;">${orderId}</p>
         </td>
         <td align="right" valign="middle">
           <span style="display:inline-block;background:${statusColor(orderStatus)};color:#fff;
                        font-size:11px;font-weight:700;letter-spacing:0.08em;
                        padding:4px 12px;border-radius:20px;">
             ${orderStatus.toUpperCase()}
           </span>
         </td>
       </tr>
     </table>` +

    etaHtml +

    // Items table
    sectionHeading("Your Items") +
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:8px 0 0 0;">
       <tr style="border-bottom:2px solid #e5e7eb;">
         <th style="text-align:left;padding:8px 0;font-size:12px;color:#6b7280;font-weight:600;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Item</th>
         <th style="text-align:center;padding:8px;font-size:12px;color:#6b7280;font-weight:600;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Qty</th>
         <th style="text-align:right;padding:8px 0;font-size:12px;color:#6b7280;font-weight:600;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Total</th>
       </tr>
       ${itemRows}
     </table>` +

    // Totals
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:12px 0 24px 0;">
       <tr>
         <td style="padding:5px 0;font-size:14px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Subtotal</td>
         <td style="padding:5px 0;text-align:right;font-size:14px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmt(subTotal, currency)}</td>
       </tr>
       <tr>
         <td style="padding:5px 0;font-size:14px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Tax</td>
         <td style="padding:5px 0;text-align:right;font-size:14px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmt(tax, currency)}</td>
       </tr>
       <tr>
         <td style="padding:5px 0;font-size:14px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Delivery Fee</td>
         <td style="padding:5px 0;text-align:right;font-size:14px;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
           ${deliveryFee === 0 ? `<span style="color:#10b981;font-weight:600;">FREE</span>` : fmt(deliveryFee, currency)}
         </td>
       </tr>
       <tr style="border-top:2px solid #1a3320;">
         <td style="padding:10px 0 4px 0;font-size:16px;font-weight:700;color:#111827;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Total</td>
         <td style="padding:10px 0 4px 0;text-align:right;font-size:18px;font-weight:800;
                    color:#1a3320;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmt(total, currency)}</td>
       </tr>
     </table>` +

    divider() +

    sectionHeading("Delivery Address") +
    `<p style="margin:8px 0 3px 0;font-size:14px;font-weight:600;color:#111827;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       ${deliveryAddress.fullName}
     </p>
     <p style="margin:0 0 3px 0;font-size:13px;color:#4b5563;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       ${addrParts.join(", ")}
     </p>
     <p style="margin:0 0 20px 0;font-size:13px;color:#4b5563;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       &#128222; ${deliveryAddress.phone}
     </p>` +

    divider() +

    sectionHeading("Payment") +
    `<p style="margin:8px 0 24px 0;font-size:14px;font-weight:600;color:#111827;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       ${paymentMethod === "COD" ? "&#128181; Cash on Delivery" : "&#128179; Online Payment"}
     </p>` +

    `<p style="margin:0;text-align:center;">` +
    ctaButton({ href: appUrl, label: "Track Your Order →", color: "#2e7d52" }) +
    `</p>`;

  return baseTemplate({
    branding,
    previewText: `Order ${orderId} confirmed! We are preparing your food now.`,
    content,
    features: [
      { icon: "✅", iconBg: "#dcfce7", title: "Order Confirmed",    desc: "We got your order!" },
      { icon: "🍕", iconBg: "#fce7f3", title: "Being Prepared",     desc: "Fresh & made to order" },
      { icon: "🛵", iconBg: "#fff7ed", title: "Fast Delivery",       desc: "On its way to you" },
      { icon: "&#127775;", iconBg: "#fefce8", title: "Enjoy!", desc: "Delicious halal food" },
    ],
  });
}
