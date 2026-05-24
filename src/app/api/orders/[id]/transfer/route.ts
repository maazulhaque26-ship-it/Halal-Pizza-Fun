import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { OrderTransferService } from "@/lib/services/OrderTransferService";
import { Order } from "@/lib/db/models/Order";
import { connectDB } from "@/lib/db/mongoose";
import mongoose from "mongoose";
import { ROLES } from "@/config/constants";

/**
 * POST /api/orders/[id]/transfer
 * Branch Manager transfers a specific order to another branch.
 * Infers fromBranchId from the order itself — manager only needs to supply toBranchId + reason.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (![ROLES.BRANCH_MANAGER, ROLES.SUPER_ADMIN].includes(role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const { toBranchId, reason, unavailableItems, notes } = body;

    if (!toBranchId || !reason?.trim()) {
      return NextResponse.json(
        { success: false, message: "toBranchId and reason are required" },
        { status: 400 }
      );
    }

    // Fetch order to determine fromBranchId
    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // RBAC: Branch Managers can only transfer orders belonging to their branch
    if (role === ROLES.BRANCH_MANAGER) {
      const managerBranchId = (session.user as any).branchId;
      if (!managerBranchId || order.branchId.toString() !== managerBranchId.toString()) {
        return NextResponse.json(
          { success: false, message: "You can only transfer orders from your own branch" },
          { status: 403 }
        );
      }
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    const userAgent = request.headers.get("user-agent") || "";

    const result = await OrderTransferService.transferOrder({
      orderId: new mongoose.Types.ObjectId(id),
      fromBranchId: order.branchId as mongoose.Types.ObjectId,
      toBranchId: new mongoose.Types.ObjectId(toBranchId),
      reason,
      unavailableItems,
      notes,
      transferredBy: new mongoose.Types.ObjectId(session.user.id),
      userRole: role,
      ipAddress: ip,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Order transferred successfully",
      data: { order: result.order, transfer: result.transfer },
    });
  } catch (error: any) {
    console.error("POST /api/orders/[id]/transfer error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Transfer failed" },
      { status: 500 }
    );
  }
}
