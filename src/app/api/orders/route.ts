import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import "@/lib/db/models/Branch";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES, PAGINATION, ORDER_STATUS } from "@/config/constants";
import { env } from "@/config/env";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT));
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");

    const query: any = {};
    if (status) query.status = status;
    
    // ─── Enforce Role-based Access Boundaries ──────────────────────────────
    if (session.user.role === ROLES.CUSTOMER) {
      query.customerId = session.user.id;
    } else if (session.user.role === ROLES.BRANCH_MANAGER) {
      if (!session.user.branchId) {
        return NextResponse.json({ success: false, message: "Manager is not assigned to any branch" }, { status: 403 });
      }
      query.branchId = session.user.branchId;

      // If they queried for a different branch, reject
      if (branchId && branchId !== session.user.branchId) {
        return NextResponse.json({ success: false, message: "Forbidden: Access restricted to assigned branch only" }, { status: 403 });
      }
    } else if (session.user.role === ROLES.SUPER_ADMIN) {
      if (branchId) query.branchId = branchId;
    } else {
      // Default fallback for any other roles (like delivery staff)
      if (session.user.branchId) {
        query.branchId = session.user.branchId;
      } else {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("customerId", "name email phone")
        .populate("branchId", "name address")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    // ─── Prevent Global System Stats Leak ──────────────────────────────────
    // Ensure allData is filtered by the SAME query object, not global collection
    const allData = limit <= 5 ? await Order.find(query).select("status total createdAt").lean() : undefined;

    return NextResponse.json({ success: true, data: orders, total, allData });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, message: "orderId and status required" }, { status: 400 });
    }

    // Validate request status value matches ENUM
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid order status value" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: { status },
        $push: {
          orderTimeline: {
            status,
            timestamp: new Date(),
            note: `Status updated to ${status} by ${session.user.name} (${session.user.role})`
          }
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedOrder) return NextResponse.json({ success: false, message: "Order not found during update" }, { status: 404 });

    // ─── Enforce Branch Manager RBAC Boundaries on Order Mutation ──────────
    if (session.user.role === ROLES.BRANCH_MANAGER) {
      if (!session.user.branchId || updatedOrder.branchId.toString() !== session.user.branchId) {
        return NextResponse.json({ success: false, message: "Forbidden: Cannot update orders outside your branch" }, { status: 403 });
      }
    } else if (session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Forbidden: Unauthorized to edit orders" }, { status: 403 });
    }

    // Re-populate for response
    await updatedOrder.populate([
      { path: "customerId", select: "name email" },
      { path: "branchId", select: "name" }
    ]);

    // Trigger Socket Broadcast with API Key auth
    if (env.NEXT_PUBLIC_SOCKET_URL) {
      fetch(`${env.NEXT_PUBLIC_SOCKET_URL}/api/notify/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.SOCKET_API_KEY || "dev_socket_api_key_123"
        },
        body: JSON.stringify({
          userId: updatedOrder.customerId?._id?.toString(),
          orderId: updatedOrder.orderId,
          status,
          branchId: updatedOrder.branchId?._id?.toString(),
        }),
      }).catch(err => console.error("Failed to broadcast order status:", err));
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("PATCH /api/orders error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
