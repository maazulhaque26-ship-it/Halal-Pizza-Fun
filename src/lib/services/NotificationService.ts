import { User } from "@/lib/db/models/User";
import { connectDB } from "@/lib/db/mongoose";
import { env } from "@/config/env";
import webpush from "web-push";

// ── VAPID Initialization ───────────────────────────────────────────────────
// Always use env keys — dynamic generation would break existing subscriptions.
try {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
  console.log("[NotificationService] ✅ VAPID keys initialized");
} catch (error) {
  console.error("[NotificationService] ❌ Failed to initialize VAPID details:", error);
}

export class NotificationService {
  /**
   * Dispatches real-time order alerts to Socket.IO AND Web Push.
   * These run independently — one failure does not block the other.
   */
  static async sendOrderAlert(options: {
    branchId: string;
    orderId: string;
    orderTotal: number;
    customerName?: string;
    order?: Record<string, any>; // Full order object for socket payload
  }) {
    const { branchId, orderId, orderTotal, customerName, order } = options;

    const socketPayload = {
      branchId,
      orderId,
      order: order ?? {
        orderId,
        total: orderTotal,
        deliveryAddress: { street: customerName || "Guest Customer" },
        items: [],
      },
    };

    // ── 1. Socket.IO Broadcast (fire-and-forget) ───────────────────────────
    const socketUrl = env.NEXT_PUBLIC_SOCKET_URL;
    console.log(`[NotificationService] 📡 Emitting to socket server: ${socketUrl}/api/notify/new-order`);
    fetch(`${socketUrl}/api/notify/new-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.SOCKET_API_KEY || "dev_socket_api_key_123",
      },
      body: JSON.stringify(socketPayload),
    })
      .then((r) => r.json())
      .then((d) => console.log(`[NotificationService] Socket broadcast result:`, d))
      .catch((err) => console.error("[NotificationService] ❌ Socket broadcast failed:", err));

    // ── 2. Web Push to Branch Managers ────────────────────────────────────
    try {
      await connectDB();

      const managers = await User.find({
        branchId,
        role: "BRANCH_MANAGER",
        notificationTokens: { $exists: true, $not: { $size: 0 } },
      }).lean();

      console.log(`[NotificationService] Found ${managers.length} manager(s) for branch ${branchId}`);

      const notificationPayload = JSON.stringify({
        title: "🔔 New Order Assigned!",
        body: `Order #${orderId} — ₹${orderTotal.toFixed(2)} is waiting for your action.`,
        url: `/branch/dashboard`,
        urgency: orderTotal > 500 ? "urgent" : "normal",
      });

      for (const manager of managers) {
        if (!manager.notificationTokens?.length) continue;
        console.log(`[NotificationService] Sending push to ${manager.email} (${manager.notificationTokens.length} token(s))`);

        for (const tokenStr of manager.notificationTokens) {
          try {
            const subscription = JSON.parse(tokenStr);
            await webpush.sendNotification(subscription, notificationPayload);
            console.log(`[NotificationService] ✅ Push sent to ${manager.email}`);
          } catch (e: any) {
            console.error(`[NotificationService] ❌ Push failed for ${manager.email}:`, e.message);
            // Prune expired/invalid subscriptions (410 Gone, 404 Not Found)
            if (e.statusCode === 410 || e.statusCode === 404) {
              await User.updateOne(
                { _id: manager._id },
                { $pull: { notificationTokens: tokenStr } }
              );
              console.log(`[NotificationService] 🧹 Pruned expired token for ${manager.email}`);
            }
          }
        }
      }

      // ── Also push to SUPER_ADMINs ────────────────────────────────────────
      const admins = await User.find({
        role: "SUPER_ADMIN",
        notificationTokens: { $exists: true, $not: { $size: 0 } },
      }).lean();

      for (const admin of admins) {
        if (!admin.notificationTokens?.length) continue;
        const adminPayload = JSON.stringify({
          title: "🔔 New Order — HPF",
          body: `Order #${orderId} (₹${orderTotal.toFixed(2)}) placed at branch ${branchId}`,
          url: `/admin/orders`,
          urgency: "normal",
        });
        for (const tokenStr of admin.notificationTokens) {
          try {
            await webpush.sendNotification(JSON.parse(tokenStr), adminPayload);
            console.log(`[NotificationService] ✅ Admin push sent to ${admin.email}`);
          } catch (e: any) {
            if (e.statusCode === 410 || e.statusCode === 404) {
              await User.updateOne({ _id: admin._id }, { $pull: { notificationTokens: tokenStr } });
            }
          }
        }
      }
    } catch (err) {
      console.error("[NotificationService] ❌ Push notification dispatch error:", err);
    }
  }
}
