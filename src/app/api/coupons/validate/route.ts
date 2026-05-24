import { NextResponse } from "next/server";
import { z } from "zod";
import { Coupon } from "@/lib/db/models/Coupon";
import { connectDB } from "@/lib/db/mongoose";

const querySchema = z.object({
  code: z.string().min(1),
  orderValue: z.string().transform(Number),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      code: searchParams.get("code"),
      orderValue: searchParams.get("orderValue"),
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid parameters" }, { status: 400 });
    }

    const { code, orderValue } = parsed.data;

    await connectDB();
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!coupon) {
      return NextResponse.json({ success: false, message: "Coupon is invalid or expired" }, { status: 404 });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ success: false, message: "Coupon usage limit reached" }, { status: 400 });
    }

    if (orderValue < coupon.minOrderValue) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order value Rs ${coupon.minOrderValue} required`,
        },
        { status: 400 }
      );
    }

    const discount =
      coupon.discountType === "PERCENTAGE"
        ? (orderValue * coupon.discountValue) / 100
        : coupon.discountValue;

    return NextResponse.json({ success: true, discount: parseFloat(discount.toFixed(2)) });
  } catch (error) {
    console.error("Coupon validate error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
