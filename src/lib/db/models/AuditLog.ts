import mongoose, { Schema, Document } from "mongoose";

/**
 * AuditLog Model
 * 
 * Enterprise-grade audit logging for compliance and debugging.
 * Tracks all critical operations: transfers, refunds, inventory changes, etc.
 * 
 * Action Types:
 * - ORDER_CREATED
 * - ORDER_TRANSFERRED
 * - ORDER_REJECTED
 * - REFUND_INITIATED
 * - REFUND_COMPLETED
 * - INVENTORY_UPDATED
 * - BRANCH_CLOSED
 * - MANAGER_LOGIN
 * - ADMIN_OVERRIDE
 */

export type AuditAction =
  | "ORDER_CREATED"
  | "ORDER_TRANSFERRED"
  | "ORDER_REJECTED"
  | "REFUND_INITIATED"
  | "REFUND_COMPLETED"
  | "INVENTORY_UPDATED"
  | "BRANCH_CLOSED"
  | "MANAGER_LOGIN"
  | "ADMIN_OVERRIDE"
  | "AREA_CREATED"
  | "AREA_UPDATED"
  | "AREA_DELETED";

export interface IAuditLog extends Document {
  action: AuditAction;
  userId: mongoose.Types.ObjectId;
  userRole: string;
  orderId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  fromBranchId?: mongoose.Types.ObjectId;
  toBranchId?: mongoose.Types.ObjectId;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: "SUCCESS" | "FAILED";
  errorMessage?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      enum: [
        "ORDER_CREATED",
        "ORDER_TRANSFERRED",
        "ORDER_REJECTED",
        "REFUND_INITIATED",
        "REFUND_COMPLETED",
        "INVENTORY_UPDATED",
        "BRANCH_CLOSED",
        "MANAGER_LOGIN",
        "ADMIN_OVERRIDE",
        "AREA_CREATED",
        "AREA_UPDATED",
        "AREA_DELETED",
      ],
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      index: true,
    },
    fromBranchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
    },
    toBranchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
      index: true,
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: false }
);

// Index for time-based queries
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
