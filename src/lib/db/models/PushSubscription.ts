import mongoose, { Schema, Document } from "mongoose";

/**
 * PushSubscription — dedicated collection for Web Push subscriptions.
 *
 * Replaces storing raw JSON strings in User.notificationTokens.
 * The old User.notificationTokens approach is kept for backward compat
 * during the transition period. NotificationService queries BOTH.
 *
 * Unique on `endpoint` — one document per browser push endpoint.
 */
export interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  role: string;
  branchId?: mongoose.Types.ObjectId;
  /** Full push endpoint URL */
  endpoint: string;
  /** VAPID / P256DH / auth keys for webpush.sendNotification */
  keys: {
    p256dh: string;
    auth: string;
  };
  /** Browser/device info for debugging (UA string, truncated) */
  deviceInfo?: string;
  /** Soft-delete when 410/404 responses come back from the push service */
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User",   required: true, index: true },
    role:     { type: String, required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },

    endpoint: { type: String, required: true, unique: true }, // unique index prevents duplicates

    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true },
    },

    deviceInfo: { type: String, maxlength: 500 },
    isActive:   { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound indexes for fast push delivery queries
PushSubscriptionSchema.index({ isActive: 1, role: 1 });
PushSubscriptionSchema.index({ branchId: 1, isActive: 1 });
PushSubscriptionSchema.index({ userId: 1, isActive: 1 });

export const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
