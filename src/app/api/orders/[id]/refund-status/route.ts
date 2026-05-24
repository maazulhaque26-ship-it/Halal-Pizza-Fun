import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { RefundService } from "@/lib/services/RefundService";
import { connectDB } from "@/lib/db/mongoose";
import mongoose from "mongoose";

// GET /api/orders/[id]/refund-status - Get refund status
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

    const refundStatus = await RefundService.getRefundStatus(
      new mongoose.Types.ObjectId(id)
    );

    if (!refundStatus) {
      return NextResponse.json(
        { success: true, data: null, message: "No refund for this order" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: refundStatus,
    });
  } catch (error) {
    console.error("Error fetching refund status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch refund status",
      },
      { status: 500 }
    );
  }
}
