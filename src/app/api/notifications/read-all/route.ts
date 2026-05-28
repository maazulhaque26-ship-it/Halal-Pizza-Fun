import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { Notification } from "@/lib/db/models/Notification";
import { ROLES } from "@/config/constants";

// ── PATCH /api/notifications/read-all ────────────────────────────────────
// Mark ALL unread notifications as read for the current user.
// Strictly scoped to the current user's recipientId — no cross-user writes.
export async function PATCH(_request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as string;
    if (role !== ROLES.SUPER_ADMIN && role !== ROLES.BRANCH_MANAGER) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const result = await Notification.updateMany(
      {
        recipientId: new mongoose.Types.ObjectId(session.user.id),
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("PATCH /api/notifications/read-all error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
