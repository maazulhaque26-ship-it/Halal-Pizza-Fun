import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Coupon } from "@/lib/db/models/Coupon";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/config/constants";

export const dynamic = "force-dynamic";

// ─── PATCH — toggle active / update ───────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const updated = await Coupon.findByIdAndUpdate(id, { $set: body }, { new: true, lean: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
