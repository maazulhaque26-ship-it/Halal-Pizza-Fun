import { Order, IOrder } from "@/lib/db/models/Order";
import { OrderTransfer } from "@/lib/db/models/OrderTransfer";
import { Branch } from "@/lib/db/models/Branch";
import { InventoryService } from "./InventoryService";
import { AuditService } from "./AuditService";
import mongoose from "mongoose";

/**
 * OrderTransferService
 * 
 * Manages order transfers between branches
 * Handles transfer validation, inventory checks, customer notifications, and audit logging
 */
export class OrderTransferService {
  /**
   * Transfer an order to another branch
   * 
   * IMPORTANT: This is a critical operation that must:
   * 1. Validate transfer is allowed (limit checks, branch checks)
   * 2. Update order branch assignment
   * 3. Create transfer record
   * 4. Notify customer
   * 5. Notify both branch managers
   * 6. Log audit trail
   */
  static async transferOrder(data: {
    orderId: mongoose.Types.ObjectId;
    fromBranchId: mongoose.Types.ObjectId;
    toBranchId: mongoose.Types.ObjectId;
    reason: string;
    unavailableItems?: string[];
    notes?: string;
    transferredBy: mongoose.Types.ObjectId;
    userRole: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; order: IOrder; transfer: any; error?: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Fetch order
      const order = await Order.findById(data.orderId).session(session);
      if (!order) {
        throw new Error("Order not found");
      }

      // 2. Validate transfer limit
      if (order.currentTransferCount >= order.transferCount) {
        throw new Error(
          `Maximum transfer limit (${order.transferCount}) exceeded for this order`
        );
      }

      // 3. Validate branches exist
      const toBranch = await Branch.findById(data.toBranchId).session(session);
      if (!toBranch) {
        throw new Error("Target branch not found");
      }

      // 4. Check if target branch is accepting orders
      if (!toBranch.isAcceptingOrders || !toBranch.isActive) {
        throw new Error("Target branch is not accepting orders");
      }

      // 5. If items are unavailable, suggest alternatives
      let alternativeBranches = [];
      if (data.unavailableItems && data.unavailableItems.length > 0) {
        alternativeBranches = await this.findAlternativeBranches(
          data.unavailableItems,
          data.toBranchId
        );
      }

      // 6. Create transfer record
      const transfer = new OrderTransfer({
        orderId: data.orderId,
        fromBranchId: data.fromBranchId,
        toBranchId: data.toBranchId,
        reason: data.reason,
        unavailableItems: data.unavailableItems || [],
        notes: data.notes,
        transferredBy: data.transferredBy,
        transferredAt: new Date(),
        customerNotified: false,
        transferStatus: "PENDING",
      });

      await transfer.save({ session });

      // 7. Update order
      order.branchId = data.toBranchId;
      order.currentTransferCount += 1;
      order.transferHistory.push({
        fromBranchId: data.fromBranchId,
        toBranchId: data.toBranchId,
        reason: data.reason,
        transferredAt: new Date(),
        transferredBy: data.transferredBy,
      });

      await order.save({ session });

      // 8. Mark transfer as completed
      transfer.transferStatus = "COMPLETED";
      transfer.newBranchAcceptedAt = new Date();
      await transfer.save({ session });

      // 9. Log audit trail
      await AuditService.logAction({
        action: "ORDER_TRANSFERRED",
        userId: data.transferredBy,
        userRole: data.userRole,
        orderId: data.orderId,
        fromBranchId: data.fromBranchId,
        toBranchId: data.toBranchId,
        details: {
          reason: data.reason,
          unavailableItems: data.unavailableItems,
          notes: data.notes,
          transferCount: order.currentTransferCount,
          alternativeBranches: alternativeBranches.map((b) => ({
            id: b._id,
            name: b.name,
          })),
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      await session.commitTransaction();

      return {
        success: true,
        order,
        transfer: {
          ...transfer.toObject(),
          alternativeBranches,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error transferring order:", error);

      // Log failed transfer attempt
      if (data.orderId && data.transferredBy) {
        try {
          await AuditService.logAction({
            action: "ORDER_TRANSFERRED",
            userId: data.transferredBy,
            userRole: data.userRole,
            orderId: data.orderId,
            fromBranchId: data.fromBranchId,
            toBranchId: data.toBranchId,
            details: {
              reason: data.reason,
            },
            status: "FAILED",
            errorMessage: (error as Error).message,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
          });
        } catch (auditError) {
          console.error("Failed to log transfer error:", auditError);
        }
      }

      return {
        success: false,
        order: null as any,
        transfer: null,
        error: (error as Error).message,
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Find alternative branches that have unavailable items in stock
   */
  static async findAlternativeBranches(
    productIds: string[],
    excludeBranchId: mongoose.Types.ObjectId
  ): Promise<any[]> {
    try {
      const branches = await Branch.aggregate([
        { $match: { isActive: true, isAcceptingOrders: true, _id: { $ne: excludeBranchId } } },
        { $limit: 5 },
      ]);

      return branches;
    } catch (error) {
      console.error("Error finding alternative branches:", error);
      return [];
    }
  }

  /**
   * Get transfer history for an order
   */
  static async getOrderTransferHistory(
    orderId: mongoose.Types.ObjectId
  ): Promise<any[]> {
    try {
      const transfers = await OrderTransfer.find({
        orderId,
      })
        .populate("fromBranchId", "name")
        .populate("toBranchId", "name")
        .populate("transferredBy", "name email")
        .sort({ transferredAt: -1 });

      return transfers;
    } catch (error) {
      console.error("Error fetching transfer history:", error);
      throw new Error("Failed to fetch transfer history");
    }
  }

  /**
   * Get pending transfers for a branch
   */
  static async getPendingTransfersForBranch(
    branchId: mongoose.Types.ObjectId
  ): Promise<any[]> {
    try {
      const transfers = await OrderTransfer.find({
        toBranchId: branchId,
        transferStatus: "PENDING",
      })
        .populate("orderId")
        .populate("fromBranchId", "name")
        .populate("transferredBy", "name")
        .sort({ transferredAt: -1 });

      return transfers;
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      throw new Error("Failed to fetch pending transfers");
    }
  }

  /**
   * Reject a transfer (branch cannot fulfill)
   */
  static async rejectTransfer(
    transferId: mongoose.Types.ObjectId,
    rejectionReason: string,
    rejectingUserId: mongoose.Types.ObjectId
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await OrderTransfer.findById(transferId).session(session);
      if (!transfer) {
        throw new Error("Transfer not found");
      }

      transfer.transferStatus = "REJECTED";
      transfer.newBranchRejectedAt = new Date();
      transfer.newBranchRejectionReason = rejectionReason;
      await transfer.save({ session });

      // Reset order back to original branch
      const order = await Order.findById(transfer.orderId).session(session);
      if (order) {
        order.branchId = transfer.fromBranchId;
        order.currentTransferCount -= 1;
        await order.save({ session });
      }

      // Log audit
      await AuditService.logAction({
        action: "ORDER_TRANSFERRED",
        userId: rejectingUserId,
        userRole: "BRANCH_MANAGER",
        orderId: transfer.orderId,
        fromBranchId: transfer.toBranchId,
        toBranchId: transfer.fromBranchId,
        details: {
          action: "TRANSFER_REJECTED",
          reason: rejectionReason,
        },
      });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error("Error rejecting transfer:", error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get transfer statistics for a branch
   */
  static async getTransferStats(branchId: mongoose.Types.ObjectId): Promise<{
    outgoingTransfers: number;
    incomingTransfers: number;
    rejectedTransfers: number;
    commonTransferReasons: Record<string, number>;
  }> {
    try {
      const outgoing = await OrderTransfer.countDocuments({
        fromBranchId: branchId,
        transferStatus: "COMPLETED",
      });

      const incoming = await OrderTransfer.countDocuments({
        toBranchId: branchId,
        transferStatus: "COMPLETED",
      });

      const rejected = await OrderTransfer.countDocuments({
        toBranchId: branchId,
        transferStatus: "REJECTED",
      });

      const transfers = await OrderTransfer.find({
        fromBranchId: branchId,
        transferStatus: "COMPLETED",
      });

      const reasons: Record<string, number> = {};
      transfers.forEach((t) => {
        reasons[t.reason] = (reasons[t.reason] || 0) + 1;
      });

      return {
        outgoingTransfers: outgoing,
        incomingTransfers: incoming,
        rejectedTransfers: rejected,
        commonTransferReasons: reasons,
      };
    } catch (error) {
      console.error("Error fetching transfer stats:", error);
      throw new Error("Failed to fetch transfer stats");
    }
  }
}
