import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { PushSubscription } from "@/lib/db/models/PushSubscription";

/**
 * POST /api/push/resubscribe
 *
 * Called by the Service Worker's `pushsubscriptionchange` handler.
 * The SW runs in a background context with no session cookies, so this
 * endpoint uses the OLD endpoint as proof-of-prior-subscription instead
 * of a session token.
 *
 * Security model:
 * - Only UPDATES existing subscriptions (never creates new ones from this endpoint)
 * - The old endpoint MUST exist in our PushSubscription collection
 * - No unauthenticated inserts are possible
 * - The new endpoint replaces the old one atomically
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { oldEndpoint, newSubscription } = body as {
      oldEndpoint?: string;
      newSubscription?: { endpoint: string; keys?: { p256dh?: string; auth?: string } };
    };

    // Both old and new endpoints are required
    if (!oldEndpoint || !newSubscription?.endpoint || !newSubscription?.keys?.p256dh || !newSubscription?.keys?.auth) {
      return NextResponse.json({ success: false, message: "Invalid resubscription payload" }, { status: 400 });
    }

    // Prevent trivial endpoint spoofing: they must differ
    if (oldEndpoint === newSubscription.endpoint) {
      return NextResponse.json({ success: true, message: "Subscription unchanged" });
    }

    await connectDB();

    // Find the existing subscription by old endpoint — this is the auth proof
    const existing = await PushSubscription.findOne({ endpoint: oldEndpoint });
    if (!existing) {
      // Old subscription not in our DB — ignore (could be a token from old User.notificationTokens era)
      console.log(`[PushResubscribe] Old endpoint not found — ignoring (may be legacy): ${oldEndpoint?.slice(0, 60)}...`);
      return NextResponse.json({ success: false, message: "Old subscription not found" }, { status: 404 });
    }

    // Atomically replace old with new using findOneAndUpdate + upsert
    // This prevents duplicate-endpoint errors if browser fires the event twice
    await PushSubscription.findOneAndUpdate(
      { endpoint: oldEndpoint },
      {
        $set: {
          endpoint: newSubscription.endpoint,
          keys: {
            p256dh: newSubscription.keys.p256dh,
            auth: newSubscription.keys.auth,
          },
          isActive: true,
          lastUsedAt: new Date(),
        },
      },
      { new: true }
    );

    console.log(
      `[PushResubscribe] ✅ Subscription updated for user ${existing.userId} (role: ${existing.role})`
    );

    return NextResponse.json({ success: true, message: "Subscription refreshed" });
  } catch (error: any) {
    // Duplicate endpoint key error — new endpoint already registered, that's fine
    if (error?.code === 11000) {
      return NextResponse.json({ success: true, message: "Endpoint already registered" });
    }
    console.error("[PushResubscribe] Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
