import mongoose, { Schema, Document } from "mongoose";

/**
 * Notification model — durable store for the in-app bell + history.
 * Real-time delivery is handled by Socket.IO; this is the persistence layer.
 *
 * Backward-compatible: all new fields are OPTIONAL so existing documents
 * are unaffected. Indexes are additive and do not change existing read paths.
 */
export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "NEW_ORDER" | "ORDER_UPDATED" | "ORDER_TRANSFERRED" | "SYSTEM";
  orderId?: mongoose.Types.ObjectId;
  isRead: boolean;
  // ── New optional fields (v2) ──────────────────────────────────────────────
  /** Role of the recipient — used for RBAC-safe querying without a join */
  role?: string;
  /** Branch this notification belongs to — for branch-manager isolation */
  branchId?: mongoose.Types.ObjectId;
  /** Arbitrary extra payload (orderId string, total, etc.) for UI display */
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["NEW_ORDER", "ORDER_UPDATED", "ORDER_TRANSFERRED", "SYSTEM"],
      required: true,
    },
    orderId:  { type: Schema.Types.ObjectId, ref: "Order" },
    isRead:   { type: Boolean, default: false },
    // ── v2 optional fields ────────────────────────────────────────────────
    role:     { type: String },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// ── Compound indexes for performant RBAC queries ───────────────────────────
// These are ADDITIVE — they do not remove or alter the existing index on recipientId.
NotificationSchema.index({ recipientId: 1, isRead: 1 });  // unread count per user
NotificationSchema.index({ branchId: 1, createdAt: -1 });  // branch history feed
NotificationSchema.index({ role: 1, createdAt: -1 });      // admin feed
NotificationSchema.index({ createdAt: -1 });               // global sort

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
