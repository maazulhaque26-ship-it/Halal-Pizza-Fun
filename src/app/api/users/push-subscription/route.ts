import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { PushSubscription } from "@/lib/db/models/PushSubscription";
import mongoose from "mongoose";

/**
 * POST /api/users/push-subscription
 * Body: { subscription: PushSubscriptionJSON }
 *
 * Saves subscription to BOTH:
 *   1. User.notificationTokens (existing — backward compat)
 *   2. PushSubscription collection (new — queryable, role-aware)
 *
 * Idempotent — safe to call multiple times.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subscription } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ success: false, message: "Invalid push subscription" }, { status: 400 });
    }

    await connectDB();

    const userId = session.user.id;
    const role   = (session.user as any).role as string;
    const branchId = (session.user as any).branchId as string | undefined;

    const tokenStr = JSON.stringify(subscription);

    // ── 1. Existing behavior: save to User.notificationTokens (backward compat) ──
    await User.updateOne(
      { _id: userId, notificationTokens: { $ne: tokenStr } },
      { $push: { notificationTokens: tokenStr } }
    );

    // ── 2. New: upsert into PushSubscription collection ────────────────────────
    // findOneAndUpdate with upsert prevents duplicate endpoints.
    // If the endpoint already exists (same browser/device), just update metadata.
    const ua = req.headers.get("user-agent") || "";
    const deviceInfo = ua.slice(0, 300); // Truncate — enough for debugging

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        $set: {
          userId: new mongoose.Types.ObjectId(userId),
          role,
          branchId: branchId ? new mongoose.Types.ObjectId(branchId) : undefined,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
          deviceInfo,
          isActive: true,
          lastUsedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[PushSub] ✅ Subscription saved for ${session.user.email} (role: ${role}${branchId ? `, branch: ${branchId}` : ""})`);
    return NextResponse.json({ success: true, message: "Push subscription registered" });
  } catch (error: any) {
    // 11000 = duplicate key on endpoint — already exists, not an error
    if (error?.code === 11000) {
      return NextResponse.json({ success: true, message: "Subscription already registered" });
    }
    console.error("[PushSub] POST error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/users/push-subscription
 * Body: { endpoint: string }
 * Removes subscription from both storage locations.
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ success: false, message: "endpoint required" }, { status: 400 });
    }

    await connectDB();

    // ── 1. Remove from User.notificationTokens ─────────────────────────────
    const user = await User.findById(session.user.id).select("notificationTokens");
    if (user?.notificationTokens) {
      const matching = user.notificationTokens.filter((t: string) => {
        try { return JSON.parse(t).endpoint === endpoint; } catch { return false; }
      });
      if (matching.length > 0) {
        await User.updateOne(
          { _id: session.user.id },
          { $pullAll: { notificationTokens: matching } }
        );
      }
    }

    // ── 2. Deactivate in PushSubscription collection ──────────────────────
    await PushSubscription.updateOne(
      { endpoint, userId: new mongoose.Types.ObjectId(session.user.id) },
      { $set: { isActive: false } }
    );

    console.log(`[PushSub] 🗑️ Subscription removed for user ${session.user.email}`);
    return NextResponse.json({ success: true, message: "Push subscription removed" });
  } catch (error: any) {
    console.error("[PushSub] DELETE error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
