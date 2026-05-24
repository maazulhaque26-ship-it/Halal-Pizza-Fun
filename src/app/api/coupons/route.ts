import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Coupon } from "@/lib/db/models/Coupon";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";

export const dynamic = "force-dynamic";

// ─── GET — public: returns all active, non-expired coupons ────────────────────
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === ROLES.SUPER_ADMIN;

    let query: any = {};
    if (!all || !isAdmin) {
      // Public: only active + not expired
      query = { isActive: true, expiresAt: { $gt: new Date() } };
    }

    const coupons = await Coupon.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: coupons });
  } catch (error: any) {
    console.error("GET /api/coupons error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST — admin only: create coupon ─────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const coupon = await Coupon.create(body);
    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/coupons error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: "Coupon code already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
