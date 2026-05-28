import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { Notification } from "@/lib/db/models/Notification";
import { ROLES, PAGINATION } from "@/config/constants";

// ── GET /api/notifications ─────────────────────────────────────────────────
// Returns paginated notifications for the authenticated user.
// RBAC-isolated: each role only sees their own notifications.
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "25"),
      PAGINATION.MAX_LIMIT
    );
    const unreadOnly = searchParams.get("unread") === "true";

    // ── RBAC query construction ──────────────────────────────────────────
    // Each user only sees their OWN notifications (recipientId).
    // There is NO cross-user or cross-branch leakage.
    const query: Record<string, unknown> = {
      recipientId: new mongoose.Types.ObjectId(session.user.id),
    };

    if (unreadOnly) query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipientId: new mongoose.Types.ObjectId(session.user.id),
        isRead: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      total,
      unreadCount,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// ── PATCH /api/notifications ───────────────────────────────────────────────
// Mark a single notification as read.
// Ownership is enforced: users can only mark their OWN notifications.
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as string;
    if (role !== ROLES.SUPER_ADMIN && role !== ROLES.BRANCH_MANAGER) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { id } = body as { id?: string };

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: "Valid notification id required" }, { status: 400 });
    }

    await connectDB();

    // ── Ownership check — prevents ID enumeration attacks ──────────────
    const updated = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        recipientId: new mongoose.Types.ObjectId(session.user.id), // strict ownership
      },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!updated) {
      // Either does not exist or belongs to another user — return same error
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
