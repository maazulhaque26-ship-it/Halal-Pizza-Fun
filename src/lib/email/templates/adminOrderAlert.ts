import type { EmailBranding } from "../branding";
import { baseTemplate, greenInfoCard, orangeInfoCard, ctaButton, divider, sectionHeading } from "./base";
import type { OrderItem } from "./orderConfirmation";

export interface AdminOrderAlertOptions {
  branding: EmailBranding;
  orderId: string;
  orderStatus?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  subTotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  branchName?: string;
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
  };
  specialInstructions?: string;
  ordersAdminUrl?: string;
  currency?: string;
}

function fmt(amount: number, currency = "INR"): string {
  if (currency === "INR") return "&#8377;" + amount.toFixed(2);
  return currency + " " + amount.toFixed(2);
}

export function buildAdminOrderAlertEmail(opts: AdminOrderAlertOptions): string {
  const {
    branding,
    orderId,
    orderStatus = "PENDING",
    customerName,
    customerEmail,
    customerPhone,
    items,
    subTotal,
    tax,
    deliveryFee,
    total,
    paymentMethod,
    paymentStatus = "PENDING",
    branchName,
    deliveryAddress,
    specialInstructions,
    ordersAdminUrl,
    currency = "INR",
  } = opts;

  const adminUrl = ordersAdminUrl || `${branding.websiteUrl}/admin/orders`;

  // Item rows
  const itemRows = items
    .map((item) => {
      const addonsTotal = (item.selectedAddons || []).reduce((s, a) => s + a.price, 0);
      const lineTotal = (item.price + addonsTotal) * item.quantity;
      return (
        `<tr>` +
        `<td style="padding:9px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;` +
        `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
        item.name +
        (item.variantName ? ` <span style="color:#9ca3af;">(${item.variantName})</span>` : "") +
        `</td>` +
        `<td style="padding:9px 8px;border-bottom:1px solid #f3f4f6;text-align:center;` +
        `font-size:13px;color:#374151;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
        `&times;${item.quantity}` +
        `</td>` +
        `<td style="padding:9px 0;border-bottom:1px solid #f3f4f6;text-align:right;` +
        `font-size:13px;color:#111827;font-weight:600;` +
        `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">` +
        fmt(lineTotal, currency) +
        `</td>` +
        `</tr>`
      );
    })
    .join("");

  // Address
  const addrParts = [
    deliveryAddress.houseNumber,
    deliveryAddress.floor ? `Floor ${deliveryAddress.floor}` : "",
    deliveryAddress.street,
    deliveryAddress.landmark ? `Near ${deliveryAddress.landmark}` : "",
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.pincode,
  ].filter(Boolean);

  const paidBadge =
    paymentStatus === "PAID"
      ? `<span style="display:inline-block;background:#10b981;color:#fff;font-size:11px;font-weight:700;` +
        `padding:3px 10px;border-radius:20px;letter-spacing:0.05em;">PAID</span>`
      : `<span style="display:inline-block;background:#f59e0b;color:#0d1117;font-size:11px;font-weight:700;` +
        `padding:3px 10px;border-radius:20px;letter-spacing:0.05em;">COD</span>`;

  const content =
    // Alert header
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;text-align:center;">
       <tr><td align="center" style="padding-bottom:14px;">
         <div style="display:inline-block;width:52px;height:52px;border-radius:50%;
                     background:#fef9c3;font-size:26px;line-height:52px;text-align:center;">&#128276;</div>
       </td></tr>
       <tr><td align="center">
         <h2 style="margin:0 0 4px 0;font-size:22px;font-weight:800;color:#111827;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
           New Order Received!
         </h2>
         <p style="margin:0;font-size:14px;color:#6b7280;
                   font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
           A new order requires your attention${branchName ? ` &middot; Branch: <strong style="color:#111827;">${branchName}</strong>` : ""}.
         </p>
       </td></tr>
     </table>` +

    // Order ID + total + badge
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
           <p style="margin:0 0 4px 0;font-size:18px;font-weight:800;color:#1a3320;text-align:right;
                     font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
             ${fmt(total, currency)}
           </p>
           ${paidBadge}
         </td>
       </tr>
     </table>` +

    // Customer info as green info card
    greenInfoCard({
      icon: "&#128100;",
      title: `Customer: ${customerName}`,
      body:
        (customerEmail ? `&#9993; ${customerEmail}<br/>` : "") +
        (customerPhone ? `&#128222; ${customerPhone}<br/>` : "") +
        `&#128179; ${paymentMethod === "COD" ? "Cash on Delivery" : `Online Payment`} &nbsp;&middot;&nbsp; Status: <strong>${orderStatus}</strong>`,
    }) +

    // Items table
    sectionHeading("Order Items") +
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:8px 0 0 0;">
       <tr style="border-bottom:2px solid #e5e7eb;">
         <th style="text-align:left;padding:7px 0;font-size:11px;color:#9ca3af;font-weight:600;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Item</th>
         <th style="text-align:center;padding:7px 8px;font-size:11px;color:#9ca3af;font-weight:600;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Qty</th>
         <th style="text-align:right;padding:7px 0;font-size:11px;color:#9ca3af;font-weight:600;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Total</th>
       </tr>
       ${itemRows}
     </table>` +

    // Totals
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:10px 0 24px 0;">
       <tr>
         <td style="padding:4px 0;font-size:13px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Subtotal</td>
         <td style="padding:4px 0;text-align:right;font-size:13px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmt(subTotal, currency)}</td>
       </tr>
       <tr>
         <td style="padding:4px 0;font-size:13px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Tax</td>
         <td style="padding:4px 0;text-align:right;font-size:13px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${fmt(tax, currency)}</td>
       </tr>
       <tr>
         <td style="padding:4px 0;font-size:13px;color:#6b7280;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Delivery Fee</td>
         <td style="padding:4px 0;text-align:right;font-size:13px;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
           ${deliveryFee === 0 ? `<span style="color:#10b981;font-weight:600;">FREE</span>` : fmt(deliveryFee, currency)}
         </td>
       </tr>
       <tr style="border-top:2px solid #1a3320;">
         <td style="padding:8px 0 4px 0;font-size:15px;font-weight:700;color:#111827;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Grand Total</td>
         <td style="padding:8px 0 4px 0;text-align:right;font-size:17px;font-weight:800;color:#1a3320;
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
     <p style="margin:0 0 ${specialInstructions ? "12" : "20"}px 0;font-size:13px;color:#4b5563;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
       &#128222; ${deliveryAddress.phone}
     </p>` +

    (specialInstructions
      ? orangeInfoCard({
          icon: "&#128221;",
          title: "Special Instructions",
          body: specialInstructions,
        })
      : "") +

    `<p style="margin:0;text-align:center;">` +
    ctaButton({ href: adminUrl, label: "View in Dashboard →", color: "#2e7d52" }) +
    `</p>`;

  return baseTemplate({
    branding,
    previewText: `New order ${orderId} — ${fmt(total, currency)} — requires action`,
    content,
  });
}
