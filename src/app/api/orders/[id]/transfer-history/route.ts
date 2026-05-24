import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { OrderTransferService } from "@/lib/services/OrderTransferService";
import { connectDB } from "@/lib/db/mongoose";
import mongoose from "mongoose";

// GET /api/orders/[id]/transfer-history - Get transfer history for order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const transfers = await OrderTransferService.getOrderTransferHistory(
      new mongoose.Types.ObjectId(id)
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
