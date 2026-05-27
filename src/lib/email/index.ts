// ─── Email system public API ──────────────────────────────────────────────────
// Import from here to keep usage sites clean and consistent.

export { emailConfig } from "./config";
export { getBranding } from "./branding";
export type { EmailBranding } from "./branding";
export { sendEmail, getTransporter } from "./mailer";
export type { SendEmailOptions } from "./mailer";

// Templates
export { buildOtpEmail } from "./templates/otp";
export type { OtpEmailOptions } from "./templates/otp";

export { buildWelcomeEmail } from "./templates/welcome";
export type { WelcomeEmailOptions } from "./templates/welcome";

export { buildPasswordResetEmail } from "./templates/passwordReset";
export type { PasswordResetEmailOptions } from "./templates/passwordReset";

export { buildOrderConfirmationEmail } from "./templates/orderConfirmation";
export type {
  OrderConfirmationEmailOptions,
  OrderItem,
} from "./templates/orderConfirmation";

export { buildOrderDeliveredEmail } from "./templates/orderDelivered";
export type { OrderDeliveredEmailOptions } from "./templates/orderDelivered";

export { buildAdminOrderAlertEmail } from "./templates/adminOrderAlert";
export type { AdminOrderAlertOptions } from "./templates/adminOrderAlert";

export {
  buildContactNotificationEmail,
  buildContactAcknowledgementEmail,
} from "./templates/contactNotification";
export type {
  ContactNotificationAdminOptions,
  ContactAcknowledgementOptions,
} from "./templates/contactNotification";
