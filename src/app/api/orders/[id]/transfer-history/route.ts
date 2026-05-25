import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { OrderTransferService } from "@/lib/services/OrderTransferService";
import { Order } from "@/lib/db/models/Order";
import { connectDB } from "@/lib/db/mongoose";
import { ROLES } from "@/config/constants";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId, branchId: sessionBranchId } = session.user;

    // CUSTOMER: no access to internal transfer history
    if (role === ROLES.CUSTOMER) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 });
    }

    await connectDB();

    // BRANCH_MANAGER: only their own branch's orders
    if (role === ROLES.BRANCH_MANAGER) {
      const order = await Order.findById(id).select("branchId").lean();
      if (!order) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      if ((order as any).branchId?.toString() !== sessionBranchId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const transfers = await OrderTransferService.getOrderTransferHistory(
      new mongoose.Types.ObjectId(id)
    );

    return NextResponse.json({ success: true, data: transfers });
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transfer history" },
      { status: 500 }
    );
  }
}
