import mongoose, { Schema, Document } from "mongoose";

/**
 * OrderTransfer Model
 * 
 * Tracks all order transfers between branches.
 * Enables audit logging, transfer limits, and historical analysis.
 * 
 * Transfer Reasons:
 * - WRONG_AREA: Customer selected wrong area
 * - BRANCH_OVERLOADED: Current branch too busy
 * - ITEM_UNAVAILABLE: Item not in stock at current branch
 * - DELIVERY_FAR: Delivery address outside coverage
 * - BRANCH_CLOSED: Emergency closure or offline
 * - MANAGER_REQUEST: Manual manager decision
 * - AUTO_BALANCING: System load balancing
 * 
 * Example:
 * {
 *   orderId: "order_123",
 *   fromBranchId: "branch_1",
 *   toBranchId: "branch_2",
 *   reason: "ITEM_UNAVAILABLE",
 *   unavailableItems: ["pizza_001"],
 *   transferredBy: "manager_user_id",
 *   transferredAt: Date,
 *   customerNotified: true,
 *   transferStatus: "COMPLETED"
 * }
 */

export type TransferReason =
  | "WRONG_AREA"
  | "BRANCH_OVERLOADED"
  | "ITEM_UNAVAILABLE"
  | "DELIVERY_FAR"
  | "BRANCH_CLOSED"
  | "MANAGER_REQUEST"
  | "AUTO_BALANCING";

export type TransferStatus = "PENDING" | "COMPLETED" | "FAILED" | "REJECTED";

export interface IOrderTransfer extends Document {
  orderId: mongoose.Types.ObjectId;
  fromBranchId: mongoose.Types.ObjectId;
  toBranchId: mongoose.Types.ObjectId;
  reason: TransferReason;
  unavailableItems?: string[];
  notes?: string;
  transferredBy: mongoose.Types.ObjectId;
  transferredAt: Date;
  customerNotified: boolean;
  customerNotificationSentAt?: Date;
  transferStatus: TransferStatus;
  newBranchAcceptedAt?: Date;
  newBranchRejectedAt?: Date;
  newBranchRejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderTransferSchema = new Schema<IOrderTransfer>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    fromBranchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    toBranchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        "WRONG_AREA",
        "BRANCH_OVERLOADED",
        "ITEM_UNAVAILABLE",
        "DELIVERY_FAR",
        "BRANCH_CLOSED",
        "MANAGER_REQUEST",
        "AUTO_BALANCING",
      ],
      required: true,
    },
    unavailableItems: [
      {
        type: String,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    transferredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transferredAt: {
      type: Date,
      default: Date.now,
    },
    customerNotified: {
      type: Boolean,
      default: false,
    },
    customerNotificationSentAt: {
      type: Date,
    },
    transferStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    newBranchAcceptedAt: {
      type: Date,
    },
    newBranchRejectedAt: {
      type: Date,
    },
    newBranchRejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for common queries
OrderTransferSchema.index({ orderId: 1, createdAt: -1 });
OrderTransferSchema.index({ fromBranchId: 1, createdAt: -1 });
OrderTransferSchema.index({ toBranchId: 1, createdAt: -1 });
OrderTransferSchema.index({ transferStatus: 1, createdAt: -1 });
OrderTransferSchema.index({ transferredAt: 1 });

export const OrderTransfer =
  mongoose.models.OrderTransfer ||
  mongoose.model<IOrderTransfer>("OrderTransfer", OrderTransferSchema);
