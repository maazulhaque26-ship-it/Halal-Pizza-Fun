import type { EmailBranding } from "../branding";
import { baseTemplate, ctaButton, divider, sectionHeading } from "./base";
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
  if (currency === "INR") return "₹" + amount.toFixed(2);
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

  const primary = branding.primaryColor || "#f59e0b";
  const adminUrl = ordersAdminUrl || branding.websiteUrl + "/admin/orders";

  // Item rows
  const itemRows = items
    .map((item) => {
      const addonsTotal = (item.selectedAddons || []).reduce((s, a) => s + a.price, 0);
      const lineTotal = (item.price + addonsTotal) * item.quantity;
      return (
        "<tr>" +
        '<td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
        item.name +
        (item.variantName ? " <span style=\"color:#9ca3af;\">(" + item.variantName + ")</span>" : "") +
        "</td>" +
        '<td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:13px;color:#374151;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
        "&times;" + item.quantity +
        "</td>" +
        '<td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-size:13px;color:#111827;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
        fmt(lineTotal, currency) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  // Address
  const addrParts = [
    deliveryAddress.houseNumber,
    deliveryAddress.floor ? "Floor " + deliveryAddress.floor : "",
    deliveryAddress.street,
    deliveryAddress.landmark ? "Near " + deliveryAddress.landmark : "",
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.pincode,
  ].filter(Boolean);

  // Info row helper
  const infoRow = (label: string, value: string): string =>
    '<tr>' +
    '<td style="padding:7px 0;font-size:13px;color:#6b7280;width:140px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    label +
    "</td>" +
    '<td style="padding:7px 0;font-size:13px;color:#111827;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    value +
    "</td>" +
    "</tr>";

  const paidBadge =
    paymentStatus === "PAID"
      ? '<span style="display:inline-block;background:#10b981;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;">PAID</span>'
      : '<span style="display:inline-block;background:#f59e0b;color:#0d1117;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;">COD</span>';

  const content =
    // Alert header row
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px 0;">' +
    "<tr>" +
    '<td style="background:#fef3c7;border:2px solid ' +
    primary +
    ";border-radius:10px;padding:16px 20px;\">" +
    '<p style="margin:0 0 4px 0;font-size:18px;font-weight:800;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "&#x1F514; New Order Received!" +
    "</p>" +
    '<p style="margin:0;font-size:13px;color:#374151;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    "A new order requires your attention." +
    (branchName ? " Branch: <strong>" + branchName + "</strong>" : "") +
    "</p>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    // Order ID + amount
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px 0;">' +
    '<tr>' +
    '<td style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
    '<p style="margin:0 0 2px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Order ID</p>' +
    '<p style="margin:0;font-size:22px;font-weight:800;color:#111827;">' + orderId + "</p>" +
    "</td>" +
    '<td align="right" valign="top">' +
    '<p style="margin:0 0 2px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;text-align:right;">Total</p>' +
    '<p style="margin:0;font-size:22px;font-weight:800;color:' + primary + ';text-align:right;">' + fmt(total, currency) + "</p>" +
    '<p style="margin:4px 0 0 0;text-align:right;">' + paidBadge + "</p>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    // Customer info
    sectionHeading("Customer Info", primary) +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 24px 0;">' +
    infoRow("Name", customerName) +
    (customerEmail ? infoRow("Email", customerEmail) : "") +
    (customerPhone ? infoRow("Phone", customerPhone) : "") +
    infoRow("Payment", paymentMethod === "COD" ? "Cash on Delivery" : "Online / " + paymentMethod) +
    infoRow("Status", orderStatus) +
    "</table>" +
    // Items table
    sectionHeading("Order Items", primary) +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 0 0;">' +
    '<tr style="border-bottom:2px solid #e5e7eb;">' +
    '<th style="text-align:left;padding:6px 0;font-size:11px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Item</th>' +
    '<th style="text-align:center;padding:6px;font-size:11px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Qty</th>' +
    '<th style="text-align:right;padding:6px 0;font-size:11px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Total</th>' +
    "</tr>" +
    itemRows +
    "</table>" +
    // Totals
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:12px 0 24px 0;">' +
    '<tr><td style="padding:3px 0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Subtotal</td><td style="text-align:right;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' + fmt(subTotal, currency) + "</td></tr>" +
    '<tr><td style="padding:3px 0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Tax</td><td style="text-align:right;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' + fmt(tax, currency) + "</td></tr>" +
    '<tr><td style="padding:3px 0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Delivery Fee</td><td style="text-align:right;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' + (deliveryFee === 0 ? "FREE" : fmt(deliveryFee, currency)) + "</td></tr>" +
    '<tr style="border-top:2px solid #e5e7eb;"><td style="padding:8px 0 4px 0;font-size:14px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Grand Total</td><td style="padding:8px 0 4px 0;text-align:right;font-size:15px;font-weight:800;color:' + primary + ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' + fmt(total, currency) + "</td></tr>" +
    "</table>" +
    divider() +
    // Delivery address
    sectionHeading("Delivery Address", primary) +
    '<p style="margin:8px 0 4px 0;font-size:13px;font-weight:600;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' + deliveryAddress.fullName + "</p>" +
    '<p style="margin:0 0 4px 0;font-size:13px;color:#4b5563;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' + addrParts.join(", ") + "</p>" +
    '<p style="margin:0 0 4px 0;font-size:13px;color:#4b5563;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Phone: ' + deliveryAddress.phone + "</p>" +
    (specialInstructions
      ? '<p style="margin:6px 0 0 0;font-size:12px;color:#92400e;background:#fef3c7;padding:8px 12px;border-radius:6px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">&#x1F4DD; Note: ' + specialInstructions + "</p>"
      : "") +
    divider() +
    // Action button
    '<p style="margin:0;text-align:center;">' +
    ctaButton({ href: adminUrl, label: "View in Dashboard →", primary }) +
    "</p>";

  return baseTemplate({
    branding,
    previewText: "New order " + orderId + " — " + fmt(total, currency) + " — requires action.",
    content,
    footerNote: "This is an automated order notification from " + branding.appName + ".",
  });
}
