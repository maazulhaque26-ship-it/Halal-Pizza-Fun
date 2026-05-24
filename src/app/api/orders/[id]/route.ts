import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import { Product } from "@/lib/db/models/Product"; // For population

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // Check if valid ObjectId vs string ID
    const query = id.length === 24 ? { _id: id } : { orderId: id };

    const order = await Order.findOne(query)
      .populate("branchId", "name address contactNumber")
      .populate("items.productId", "name image isVegetarian")
      .lean();

    if (!order) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
