import mongoose, { Schema, Document } from "mongoose";

/**
 * Notification model — stores in DB for persistence (e.g. unread counts).
 * Real-time delivery is handled by Socket.IO; this is the durable store.
 */
export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId; // Branch Manager / Admin user ID
  title: string;
  message: string;
  type: "NEW_ORDER" | "ORDER_UPDATED" | "SYSTEM";
  orderId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["NEW_ORDER", "ORDER_UPDATED", "SYSTEM"],
      required: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
