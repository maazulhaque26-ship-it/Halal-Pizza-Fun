import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";

/**
 * POST /api/users/push-subscription
 * Body: { subscription: PushSubscriptionJSON }
 * Saves a push subscription to the authenticated user's notificationTokens array.
 * Idempotent — will not add duplicates.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subscription } = body;

    if (!subscription?.endpoint) {
      return NextResponse.json({ success: false, message: "Invalid push subscription" }, { status: 400 });
    }

    await connectDB();

    const tokenStr = JSON.stringify(subscription);

    // Add to array only if not already present (avoid duplicate subscriptions)
    await User.updateOne(
      { _id: session.user.id, notificationTokens: { $ne: tokenStr } },
      { $push: { notificationTokens: tokenStr } }
    );

    console.log(`[PushSub] ✅ Subscription saved for user ${session.user.email}`);
    return NextResponse.json({ success: true, message: "Push subscription registered" });
  } catch (error: any) {
    console.error("[PushSub] POST error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/users/push-subscription
 * Body: { endpoint: string }
 * Removes a specific push subscription by endpoint.
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

    // Pull any token whose JSON contains this endpoint
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

    console.log(`[PushSub] 🗑️ Subscription removed for user ${session.user.email}`);
    return NextResponse.json({ success: true, message: "Push subscription removed" });
  } catch (error: any) {
    console.error("[PushSub] DELETE error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
