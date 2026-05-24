import { Order, IOrder } from "@/lib/db/models/Order";
import { AuditService } from "./AuditService";
import mongoose from "mongoose";
import axios from "axios";

/**
 * RefundService
 * 
 * Handles order refunds and payment reversals
 * Supports automatic refund initiation when orders are rejected
 */
export class RefundService {
  /**
   * Initiate refund for an order
   * 
   * Refund Reasons:
   * - ITEM_UNAVAILABLE: Item not available at any branch
   * - TRANSFER_LIMIT_EXCEEDED: Too many transfers attempted
   * - CUSTOMER_REQUEST: Customer requested cancellation
   * - BRANCH_CLOSED: Branch unexpectedly closed
   * - PAYMENT_FAILED: Payment verification failed
   */
  static async initiateRefund(data: {
    orderId: mongoose.Types.ObjectId;
    reason: string;
    initiatedBy: mongoose.Types.ObjectId;
    userRole: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; refundId?: string; error?: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Fetch order
      const order = await Order.findById(data.orderId).session(session);
      if (!order) {
        throw new Error("Order not found");
      }

      // 2. Check if order is eligible for refund
      if (order.paymentStatus !== "PAID") {
        throw new Error("Order payment not completed. Cannot refund.");
      }

      if (order.refundStatus === "COMPLETED") {
        throw new Error("Order already refunded");
      }

      // 3. Generate refund ID
      const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 4. Update order with refund details
      order.refundStatus = "INITIATED";
      order.refundDetails = {
        refundId,
        amount: order.total,
        reason: data.reason,
        initiatedAt: new Date(),
        status: "PROCESSING",
      };

      await order.save({ session });

      // 5. Process payment refund (Razorpay)
      let paymentRefund = null;
      if (order.paymentId) {
        try {
          paymentRefund = await this.processPaymentRefund(order.paymentId, order.total);
        } catch (error) {
          console.error("Error processing payment refund:", error);
          // Continue even if payment refund fails - mark as manual
        }
      }

      // 6. Log audit trail
      await AuditService.logAction({
        action: "REFUND_INITIATED",
        userId: data.initiatedBy,
        userRole: data.userRole,
        orderId: data.orderId,
        branchId: order.branchId,
        details: {
          refundId,
          amount: order.total,
          reason: data.reason,
          paymentRefund: paymentRefund ? "SUCCESS" : "MANUAL",
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      await session.commitTransaction();

      return {
        success: true,
        refundId,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error initiating refund:", error);

      // Log failed refund attempt
      try {
        await AuditService.logAction({
          action: "REFUND_INITIATED",
          userId: data.initiatedBy,
          userRole: data.userRole,
          orderId: data.orderId,
          details: {
            status: "FAILED",
            errorMessage: (error as Error).message,
          },
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        });
      } catch (auditError) {
        console.error("Failed to log refund error:", auditError);
      }

      return {
        success: false,
        error: (error as Error).message,
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Process payment refund via Razorpay
   */
  private static async processPaymentRefund(
    paymentId: string,
    amount: number
  ): Promise<any> {
    try {
      const razorpayKey = process.env.RAZORPAY_KEY_SECRET;
      const razorpaySecret = process.env.RAZORPAY_SECRET;

      if (!razorpayKey || !razorpaySecret) {
        throw new Error("Razorpay credentials not configured");
      }

      const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString(
        "base64"
      );

      const response = await axios.post(
        `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
        {
          amount: Math.round(amount * 100), // Convert to paise
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Razorpay refund error:", error);
      throw new Error("Failed to process payment refund");
    }
  }

  /**
   * Complete refund (after payment is processed)
   */
  static async completeRefund(
    orderId: mongoose.Types.ObjectId,
    completedBy: mongoose.Types.ObjectId
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (!order.refundDetails) {
        throw new Error("No refund details found for this order");
      }

      order.refundStatus = "COMPLETED";
      order.refundDetails.status = "COMPLETED";
      order.refundDetails.completedAt = new Date();

      await order.save();

      // Log completion
      await AuditService.logAction({
        action: "REFUND_COMPLETED",
        userId: completedBy,
        userRole: "ADMIN",
        orderId,
        details: {
          refundId: order.refundDetails.refundId,
          amount: order.refundDetails.amount,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error completing refund:", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get refund status
   */
  static async getRefundStatus(
    orderId: mongoose.Types.ObjectId
  ): Promise<{
    status: string;
    refundId?: string;
    amount?: number;
    initiatedAt?: Date;
    completedAt?: Date;
  } | null> {
    try {
      const order = await Order.findById(orderId);
      if (!order || !order.refundDetails) {
        return null;
      }

      return {
        status: order.refundDetails.status,
        refundId: order.refundDetails.refundId,
        amount: order.refundDetails.amount,
        initiatedAt: order.refundDetails.initiatedAt,
        completedAt: order.refundDetails.completedAt,
      };
    } catch (error) {
      console.error("Error fetching refund status:", error);
      throw new Error("Failed to fetch refund status");
    }
  }

  /**
   * Get all refunds for a date range
   */
  static async getRefundsForDateRange(
    startDate: Date,
    endDate: Date,
    branchId?: mongoose.Types.ObjectId
  ): Promise<any[]> {
    try {
      const query: any = {
        refundStatus: { $exists: true },
        "refundDetails.initiatedAt": {
          $gte: startDate,
          $lte: endDate,
        },
      };

      if (branchId) {
        query.branchId = branchId;
      }

      const refunds = await Order.find(query)
        .select("orderId total refundDetails createdAt branchId")
        .sort({ "refundDetails.initiatedAt": -1 });

      return refunds;
    } catch (error) {
      console.error("Error fetching refunds:", error);
      throw new Error("Failed to fetch refunds");
    }
  }

  /**
   * Get refund analytics
   */
  static async getRefundAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRefunded: number;
    totalRefundAmount: number;
    completedRefunds: number;
    pendingRefunds: number;
    refundReasons: Record<string, number>;
  }> {
    try {
      const refunds = await Order.find({
        refundStatus: { $exists: true },
        "refundDetails.initiatedAt": {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const completed = refunds.filter(
        (r) => r.refundDetails?.status === "COMPLETED"
      );
      const pending = refunds.filter(
        (r) => r.refundDetails?.status === "PROCESSING"
      );

      const reasons: Record<string, number> = {};
      refunds.forEach((r) => {
        const reason = r.refundDetails?.reason || "UNKNOWN";
        reasons[reason] = (reasons[reason] || 0) + 1;
      });

      const totalAmount = refunds.reduce(
        (sum, r) => sum + (r.refundDetails?.amount || 0),
        0
      );

      return {
        totalRefunded: refunds.length,
        totalRefundAmount: totalAmount,
        completedRefunds: completed.length,
        pendingRefunds: pending.length,
        refundReasons: reasons,
      };
    } catch (error) {
      console.error("Error generating refund analytics:", error);
      throw new Error("Failed to generate refund analytics");
    }
  }
}
