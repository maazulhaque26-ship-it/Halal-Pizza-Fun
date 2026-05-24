import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { OrderTransferService } from "@/lib/services/OrderTransferService";
import { connectDB } from "@/lib/db/mongoose";
import mongoose from "mongoose";

// POST /api/orders/transfer - Transfer order to another branch
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

    // Only branch managers and admins can transfer orders
    if (!["BRANCH_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only managers can transfer orders" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      fromBranchId,
      toBranchId,
      reason,
      unavailableItems,
      notes,
    } = body;

    // Validate required fields
    if (!orderId || !fromBranchId || !toBranchId || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "orderId, fromBranchId, toBranchId, and reason are required",
        },
        { status: 400 }
      );
    }

    // Get client IP and user agent for audit logging
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "";
    const userAgent = request.headers.get("user-agent") || "";

    const result = await OrderTransferService.transferOrder({
      orderId: new mongoose.Types.ObjectId(orderId),
      fromBranchId: new mongoose.Types.ObjectId(fromBranchId),
      toBranchId: new mongoose.Types.ObjectId(toBranchId),
      reason,
      unavailableItems,
      notes,
      transferredBy: new mongoose.Types.ObjectId(session.user?.id),
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
          order: result.order,
          transfer: result.transfer,
        },
        message: "Order transferred successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error transferring order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to transfer order",
      },
      { status: 500 }
    );
  }
}

// GET /api/orders/transfer?orderId=... - Get transfer history for an order
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId query parameter is required" },
        { status: 400 }
      );
    }

    const transfers = await OrderTransferService.getOrderTransferHistory(
      new mongoose.Types.ObjectId(orderId)
    );

    return NextResponse.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transfer history",
      },
      { status: 500 }
    );
  }
}
