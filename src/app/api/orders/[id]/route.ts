import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import { ROLES } from "@/config/constants";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const query = id.length === 24 ? { _id: id } : { orderId: id };

    const order = await Order.findOne(query)
      .populate("branchId", "name address contactNumber")
      .populate("items.productId", "name image isVegetarian")
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    const { role, id: userId, branchId } = session.user;

    // Customers can only see their own orders
    if (role === ROLES.CUSTOMER && order.customerId?.toString() !== userId) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // Branch managers can only see orders assigned to their branch
    if (role === ROLES.BRANCH_MANAGER && order.branchId?.toString() !== branchId) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
