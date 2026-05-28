// ============================================================
// CENTRALIZED APPLICATION CONFIGURATION
// Single source of truth for all app-wide constants.
// All values are environment-driven — zero hardcoding.
// ============================================================

export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || "HPF",
  DESCRIPTION:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "Premium Multi-Branch Food Delivery & Restaurant Platform",
  URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
  RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
} as const;

// ============================================================
// STATIC ASSET PATHS — Centralized so no scattered hardcoding
// ============================================================
export const ASSETS = {
  /**
   * Logo is served from /public/logo.png.
   * If it doesn't exist, the Navbar falls back to text-only branding.
   * Managed in admin panel → Settings → Branding.
   */
  LOGO: "/logo.png",
  /**
   * Favicon served from /public/favicon.ico automatically by Next.js.
   * Custom one can be uploaded via admin panel which replaces this file.
   */
  FAVICON: "/favicon.ico",
  FALLBACK_FOOD_IMAGE:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  PLACEHOLDER_AVATAR: "/placeholder-avatar.png",
} as const;

// ============================================================
// ROUTE CONSTANTS — All navigation paths in one place
// ============================================================
export const ROUTES = {
  HOME: "/",
  MENU: "/menu",
  CHECKOUT: "/checkout",
  ORDER_TRACKING: (id: string) => `/orders/${id}`,
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    BRANCHES: "/admin/branches",
    PRODUCTS: "/admin/products",
    CATEGORIES: "/admin/categories",
    USERS: "/admin/users",
    ORDERS: "/admin/orders",
    SETTINGS: "/admin/settings",
    COUPONS: "/admin/coupons",
  },
  BRANCH: {
    DASHBOARD: "/branch/dashboard",
    ORDERS: "/branch/orders",
    INVENTORY: "/branch/inventory",
  },
} as const;

// ============================================================
// API ENDPOINT CONSTANTS
// ============================================================
export const API = {
  AUTH: "/api/auth",
  USERS: "/api/users",
  BRANCHES: "/api/branches",
  BRANCHES_NEAREST: "/api/branches/nearest",
  PRODUCTS: "/api/products",
  CATEGORIES: "/api/categories",
  ORDERS: "/api/orders",
  PAYMENTS_CREATE: "/api/payments/create",
  PAYMENTS_VERIFY: "/api/payments/verify",
  DELIVERY_ESTIMATE: "/api/delivery-estimate",
  SETTINGS: "/api/settings",
  UPLOAD: "/api/upload",
  COUPONS: "/api/coupons",
  NOTIFICATIONS: "/api/notifications",
} as const;

// ============================================================
// ROLES — Matching the User model enum
// ============================================================
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  BRANCH_MANAGER: "BRANCH_MANAGER",
  MANAGER: "MANAGER",          // alias for BRANCH_MANAGER (UI display)
  DELIVERY_STAFF: "DELIVERY_STAFF",
  CUSTOMER: "CUSTOMER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ============================================================
// ORDER STATUS
// ============================================================
export const ORDER_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  PREPARING: "PREPARING",
  PACKED: "PACKED",            // Added: between PREPARING and OUT_FOR_DELIVERY
  READY: "READY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
  TRANSFERRED: "TRANSFERRED",
  REFUNDED: "REFUNDED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// ============================================================
// PAYMENT STATUS
// ============================================================
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

// ============================================================
// SOCKET EVENTS — Centralized to prevent typos across files
// ============================================================
export const SOCKET_EVENTS = {
  // Server → Branch Dashboard
  NEW_ORDER: "NEW_ORDER",
  // Branch → Server → Customer
  ORDER_STATUS_UPDATED: "ORDER_STATUS_UPDATED",
  // Branch joins room
  JOIN_BRANCH_ROOM: "JOIN_BRANCH_ROOM",
  // Customer joins room
  JOIN_ORDER_ROOM: "JOIN_ORDER_ROOM",
} as const;

// ============================================================
// DELIVERY CONFIG DEFAULTS (overridden by DB Settings)
// ============================================================
export const DELIVERY_CONFIG = {
  BASE_FEE: 2.99,
  TAX_PERCENTAGE: 8.5,
  MAX_RADIUS_KM: 20,
  FREE_DELIVERY_ABOVE: 50,
} as const;

// ============================================================
// PAGINATION
// ============================================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;
