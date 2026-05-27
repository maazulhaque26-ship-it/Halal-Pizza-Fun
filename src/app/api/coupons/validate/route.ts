import { NextResponse } from "next/server";
import { z } from "zod";
import { Coupon } from "@/lib/db/models/Coupon";
import { connectDB } from "@/lib/db/mongoose";

// ─── Per-IP rate limiter: prevent brute-forcing coupon codes ──────────────
const RATE_LIMIT = 20;                  // 20 lookups per window
const RATE_WINDOW_MS = 5 * 60 * 1000;   // 5 minutes
const couponLookupMap = new Map<string, { count: number; resetAt: number }>();

function isCouponRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = couponLookupMap.get(ip);
  if (!entry || now > entry.resetAt) {
    couponLookupMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

const querySchema = z.object({
  code: z.string().min(1).max(50),
  orderValue: z.string().transform(Number),
});

export async function GET(request: Request) {
  try {
    // ─── Rate limit BEFORE any DB work ───────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (isCouponRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: "Too many coupon lookups. Please try again later." },
        { status: 429 }
      );
    }

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
