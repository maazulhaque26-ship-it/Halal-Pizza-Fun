/**
 * Socket.io Events for Hyperlocal Order System
 * 
 * Rooms:
 * - branch_{branchId}: All managers in a branch
 * - order_{orderId}: Customer tracking real-time updates
 * - customer_{customerId}: Customer-specific notifications
 * 
 * Events:
 * - order:transfer:initiated: Order transferred from branch
 * - order:transfer:received: Order received at new branch
 * - order:transfer:rejected: Transfer rejected by new branch
 * - order:reassigned: Customer notified of reassignment
 * - order:status:updated: Order status changed
 * - refund:initiated: Refund started
 * - refund:completed: Refund processed
 * - inventory:updated: Inventory changed at branch
 */

export const SOCKET_EVENTS = {
  // Order Transfer Events
  ORDER_TRANSFER_INITIATED: "order:transfer:initiated",
  ORDER_TRANSFER_RECEIVED: "order:transfer:received",
  ORDER_TRANSFER_REJECTED: "order:transfer:rejected",
  ORDER_REASSIGNED: "order:reassigned",

  // Order Status Events
  ORDER_STATUS_UPDATED: "order:status:updated",
  ORDER_ACCEPTED: "order:accepted",
  ORDER_PREPARING: "order:preparing",
  ORDER_READY: "order:ready",
  ORDER_OUT_FOR_DELIVERY: "order:out-for-delivery",
  ORDER_DELIVERED: "order:delivered",
  ORDER_CANCELLED: "order:cancelled",

  // Refund Events
  REFUND_INITIATED: "refund:initiated",
  REFUND_COMPLETED: "refund:completed",
  REFUND_FAILED: "refund:failed",

  // Inventory Events
  INVENTORY_UPDATED: "inventory:updated",
  INVENTORY_LOW_STOCK: "inventory:low-stock",
  INVENTORY_OUT_OF_STOCK: "inventory:out-of-stock",

  // Branch Events
  BRANCH_BUSY: "branch:busy",
  BRANCH_OFFLINE: "branch:offline",
  BRANCH_ONLINE: "branch:online",

  // Admin Events
  ADMIN_ALERT: "admin:alert",
} as const;

// Socket.io Room Patterns
export const SOCKET_ROOMS = {
  BRANCH: (branchId: string) => `branch_${branchId}`,
  ORDER: (orderId: string) => `order_${orderId}`,
  CUSTOMER: (customerId: string) => `customer_${customerId}`,
  ADMIN: "admin",
  DELIVERY: "delivery",
} as const;
