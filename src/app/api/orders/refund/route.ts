import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { RefundService } from "@/lib/services/RefundService";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import mongoose from "mongoose";
import { ROLES } from "@/config/constants";

// POST /api/orders/refund - Initiate refund for an order
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only branch managers and super admins can initiate refunds
    const role = session.user?.role;
    if (role !== ROLES.BRANCH_MANAGER && role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only managers can initiate refunds" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, reason } = body;

    // Validate required fields
    if (!orderId || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "orderId and reason are required",
        },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // ─── Branch Manager RBAC: only their own branch's orders ─────────────
    if (role === ROLES.BRANCH_MANAGER) {
      const managerBranchId = session.user.branchId;
      if (!managerBranchId) {
        return NextResponse.json(
          { success: false, error: "Branch manager is not assigned to a branch" },
          { status: 403 }
        );
      }
      const orderRow = await Order.findById(orderId).select("branchId").lean();
      if (!orderRow) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }
      if ((orderRow as any).branchId?.toString() !== managerBranchId.toString()) {
        return NextResponse.json(
          { success: false, error: "Forbidden: order belongs to a different branch" },
          { status: 403 }
        );
      }
    }

    // Get client IP and user agent for audit logging
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "";
    const userAgent = request.headers.get("user-agent") || "";

    const result = await RefundService.initiateRefund({
      orderId: new mongoose.Types.ObjectId(orderId),
      reason,
      initiatedBy: new mongoose.Types.ObjectId(session.user?.id),
      userRole: session.user?.role || "UNKNOWN",
      ipAddress: ip,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          refundId: result.refundId,
        },
        message: "Refund initiated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initiating refund:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initiate refund",
      },
      { status: 500 }
    );
  }
}
