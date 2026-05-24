import { AuditLog, IAuditLog, AuditAction } from "@/lib/db/models/AuditLog";
import mongoose from "mongoose";

/**
 * AuditService
 * 
 * Enterprise-grade audit logging for compliance, debugging, and analytics
 * Tracks all critical operations with full context
 */
export class AuditService {
  /**
   * Log an action
   */
  static async logAction(data: {
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
    status?: "SUCCESS" | "FAILED";
    errorMessage?: string;
  }): Promise<IAuditLog> {
    try {
      const log = new AuditLog({
        action: data.action,
        userId: data.userId,
        userRole: data.userRole,
        orderId: data.orderId,
        branchId: data.branchId,
        fromBranchId: data.fromBranchId,
        toBranchId: data.toBranchId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: data.status || "SUCCESS",
        errorMessage: data.errorMessage,
      });

      await log.save();
      return log;
    } catch (error) {
      console.error("Error logging audit action:", error);
      throw new Error("Failed to log audit action");
    }
  }

  /**
   * Get audit logs for an order
   */
  static async getOrderAuditLogs(
    orderId: mongoose.Types.ObjectId
  ): Promise<IAuditLog[]> {
    try {
      const logs = await AuditLog.find({ orderId })
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      return logs;
    } catch (error) {
      console.error("Error fetching order audit logs:", error);
      throw new Error("Failed to fetch audit logs for order");
    }
  }

  /**
   * Get audit logs for a branch
   */
  static async getBranchAuditLogs(
    branchId: mongoose.Types.ObjectId,
    limit: number = 100,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    try {
      const logs = await AuditLog.find({
        $or: [
          { branchId },
          { fromBranchId: branchId },
          { toBranchId: branchId },
        ],
      })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return logs;
    } catch (error) {
      console.error("Error fetching branch audit logs:", error);
      throw new Error("Failed to fetch audit logs for branch");
    }
  }

  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(
    userId: mongoose.Types.ObjectId,
    limit: number = 100,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    try {
      const logs = await AuditLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return logs;
    } catch (error) {
      console.error("Error fetching user audit logs:", error);
      throw new Error("Failed to fetch audit logs for user");
    }
  }

  /**
   * Get logs by action type
   */
  static async getLogsByAction(
    action: AuditAction,
    limit: number = 100,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    try {
      const logs = await AuditLog.find({ action })
        .populate("userId", "name email")
        .populate("branchId", "name")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return logs;
    } catch (error) {
      console.error("Error fetching logs by action:", error);
      throw new Error("Failed to fetch logs by action");
    }
  }

  /**
   * Get transfer analytics for a branch
   */
  static async getTransferAnalytics(
    branchId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalTransfersOut: number;
    totalTransfersIn: number;
    transferReasons: Record<string, number>;
    topTransferTargets: Array<{ branchId: string; count: number }>;
  }> {
    try {
      const logs = await AuditLog.find({
        action: "ORDER_TRANSFERRED",
        createdAt: { $gte: startDate, $lte: endDate },
        $or: [
          { fromBranchId: branchId },
          { toBranchId: branchId },
        ],
      });

      const transfersOut = logs.filter(
        (log) => log.fromBranchId?.toString() === branchId.toString()
      );
      const transfersIn = logs.filter(
        (log) => log.toBranchId?.toString() === branchId.toString()
      );

      const transferReasons: Record<string, number> = {};
      transfersOut.forEach((log) => {
        const reason = log.details?.reason || "UNKNOWN";
        transferReasons[reason] = (transferReasons[reason] || 0) + 1;
      });

      const topTargets: Record<string, number> = {};
      transfersOut.forEach((log) => {
        const targetId = log.toBranchId?.toString() || "unknown";
        topTargets[targetId] = (topTargets[targetId] || 0) + 1;
      });

      return {
        totalTransfersOut: transfersOut.length,
        totalTransfersIn: transfersIn.length,
        transferReasons,
        topTransferTargets: Object.entries(topTargets)
          .map(([branchId, count]) => ({
            branchId,
            count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      };
    } catch (error) {
      console.error("Error generating transfer analytics:", error);
      throw new Error("Failed to generate transfer analytics");
    }
  }

  /**
   * Get failed operations logs
   */
  static async getFailedOperations(
    limit: number = 50,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    try {
      const logs = await AuditLog.find({ status: "FAILED" })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return logs;
    } catch (error) {
      console.error("Error fetching failed operations:", error);
      throw new Error("Failed to fetch failed operations");
    }
  }

  /**
   * Search audit logs
   */
  static async searchLogs(
    query: {
      action?: AuditAction;
      userId?: mongoose.Types.ObjectId;
      branchId?: mongoose.Types.ObjectId;
      status?: "SUCCESS" | "FAILED";
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 50,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    try {
      const filter: any = {};

      if (query.action) filter.action = query.action;
      if (query.userId) filter.userId = query.userId;
      if (query.branchId) filter.branchId = query.branchId;
      if (query.status) filter.status = query.status;

      if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt.$gte = query.startDate;
        if (query.endDate) filter.createdAt.$lte = query.endDate;
      }

      const logs = await AuditLog.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return logs;
    } catch (error) {
      console.error("Error searching audit logs:", error);
      throw new Error("Failed to search audit logs");
    }
  }
}
