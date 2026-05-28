import mongoose from "mongoose";
import { User } from "@/lib/db/models/User";
import { Notification } from "@/lib/db/models/Notification";
import { PushSubscription } from "@/lib/db/models/PushSubscription";
import { Settings } from "@/lib/db/models/Settings";
import { connectDB } from "@/lib/db/mongoose";
import { env } from "@/config/env";
import webpush from "web-push";

// ── VAPID Initialization ───────────────────────────────────────────────────
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

// ── Types ──────────────────────────────────────────────────────────────────
interface PushTarget {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  source: "PushSubscription" | "User.notificationTokens";
  subscriptionDocId?: string; // PushSubscription._id for cleanup
}

export class NotificationService {
  /**
   * Central order notification dispatcher.
   * Runs three independent pipelines in parallel — none can block the others:
   *   1. Socket.IO broadcast  (existing — unchanged)
   *   2. Web Push delivery    (upgraded: concurrent + dual-source + stale cleanup)
   *   3. MongoDB persistence  (added in previous upgrade)
   *
   * NEVER throws — all errors are caught and logged.
   */
  static async sendOrderAlert(options: {
    branchId: string;
    orderId: string;
    orderTotal: number;
    customerName?: string;
    order?: Record<string, any>;
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

    // ── Pipeline 1: Socket.IO Broadcast (fire-and-forget, unchanged) ──────
    const socketUrl = env.NEXT_PUBLIC_SOCKET_URL;
    console.log(`[NotificationService] 📡 Emitting to socket: ${socketUrl}/api/notify/new-order`);
    fetch(`${socketUrl}/api/notify/new-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.SOCKET_API_KEY || "dev_socket_api_key_123",
      },
      body: JSON.stringify(socketPayload),
    })
      .then((r) => r.json())
      .then((d) => console.log(`[NotificationService] Socket result:`, d))
      .catch((err) => console.error("[NotificationService] ❌ Socket failed:", err));

    // ── Pipelines 2 & 3 share a single DB lookup ──────────────────────────
    // Run pipelines 2 and 3 concurrently — they don't depend on each other.
    Promise.allSettled([
      NotificationService._deliverPush({ branchId, orderId, orderTotal, order }),
      NotificationService._persistOrderNotifications({
        branchId,
        orderId,
        orderMongoId: order?._id?.toString?.(),
        orderTotal,
      }),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          const label = i === 0 ? "Push delivery" : "DB persistence";
          console.error(`[NotificationService] ❌ ${label} pipeline failed:`, r.reason);
        }
      });
    });
  }

  // ── Pipeline 2: Web Push Delivery ─────────────────────────────────────────
  /**
   * Collects all push targets from BOTH storage backends (PushSubscription model
   * and legacy User.notificationTokens), deduplicates by endpoint, and sends
   * to all recipients concurrently via Promise.allSettled.
   *
   * Automatically deactivates/prunes stale subscriptions on 410/404 responses.
   */
  private static async _deliverPush(options: {
    branchId: string;
    orderId: string;
    orderTotal: number;
    order?: Record<string, any>;
  }) {
    const { branchId, orderId, orderTotal, order } = options;

    await connectDB();

    // ── Fetch notification icon ────────────────────────────────────────────
    let notifIcon = "/icons/icon-192x192.png";
    try {
      const siteSettings = await Settings.findOne().select("mobileLogoUrl logoUrl").lean() as any;
      const logo = siteSettings?.mobileLogoUrl || siteSettings?.logoUrl;
      if (logo) notifIcon = logo;
    } catch { /* fallback */ }

    // ── Collect targets from PushSubscription model (primary) ─────────────
    const [managerSubs, adminSubs] = await Promise.allSettled([
      PushSubscription.find({
        branchId: mongoose.isValidObjectId(branchId) ? new mongoose.Types.ObjectId(branchId) : undefined,
        role: "BRANCH_MANAGER",
        isActive: true,
      }).lean(),
      PushSubscription.find({
        role: "SUPER_ADMIN",
        isActive: true,
      }).lean(),
    ]);

    const primaryManagerTargets: PushTarget[] = managerSubs.status === "fulfilled"
      ? managerSubs.value.map((s: any) => ({
          endpoint: s.endpoint,
          keys: s.keys,
          source: "PushSubscription" as const,
          subscriptionDocId: s._id.toString(),
        }))
      : [];

    const primaryAdminTargets: PushTarget[] = adminSubs.status === "fulfilled"
      ? adminSubs.value.map((s: any) => ({
          endpoint: s.endpoint,
          keys: s.keys,
          source: "PushSubscription" as const,
          subscriptionDocId: s._id.toString(),
        }))
      : [];

    // ── Collect legacy targets from User.notificationTokens (backward compat) ──
    const [legacyManagers, legacyAdmins] = await Promise.allSettled([
      User.find({
        branchId,
        role: "BRANCH_MANAGER",
        notificationTokens: { $exists: true, $not: { $size: 0 } },
      }).select("notificationTokens email").lean(),
      User.find({
        role: "SUPER_ADMIN",
        notificationTokens: { $exists: true, $not: { $size: 0 } },
      }).select("notificationTokens email").lean(),
    ]);

    const legacyManagerTargets: PushTarget[] = legacyManagers.status === "fulfilled"
      ? legacyManagers.value.flatMap((m: any) =>
          (m.notificationTokens || []).map((tokenStr: string) => {
            try {
              const parsed = JSON.parse(tokenStr);
              if (!parsed?.endpoint || !parsed?.keys?.p256dh || !parsed?.keys?.auth) return null;
              return { endpoint: parsed.endpoint, keys: parsed.keys, source: "User.notificationTokens" as const };
            } catch { return null; }
          }).filter(Boolean)
        )
      : [];

    const legacyAdminTargets: PushTarget[] = legacyAdmins.status === "fulfilled"
      ? legacyAdmins.value.flatMap((a: any) =>
          (a.notificationTokens || []).map((tokenStr: string) => {
            try {
              const parsed = JSON.parse(tokenStr);
              if (!parsed?.endpoint || !parsed?.keys?.p256dh || !parsed?.keys?.auth) return null;
              return { endpoint: parsed.endpoint, keys: parsed.keys, source: "User.notificationTokens" as const };
            } catch { return null; }
          }).filter(Boolean)
        )
      : [];

    // ── Merge + deduplicate by endpoint ────────────────────────────────────
    // PushSubscription model takes precedence (has more metadata for cleanup)
    const seen = new Set<string>();
    const dedup = (targets: PushTarget[]) =>
      targets.filter((t) => {
        if (!t?.endpoint || seen.has(t.endpoint)) return false;
        seen.add(t.endpoint);
        return true;
      });

    const managerTargets = dedup([...primaryManagerTargets, ...legacyManagerTargets]);
    const adminTargets   = dedup([...primaryAdminTargets,   ...legacyAdminTargets]);

    console.log(
      `[NotificationService] 📤 Push targets: ${managerTargets.length} manager(s), ${adminTargets.length} admin(s) for order ${orderId}`
    );

    // ── Build payloads ─────────────────────────────────────────────────────
    const managerPayload = JSON.stringify({
      title:   "📦 New Branch Order",
      body:    `Order #${orderId} — ₹${orderTotal.toFixed(2)} awaiting your action`,
      url:     "/branch/orders",
      urgency: orderTotal > 500 ? "urgent" : "normal",
      icon:    notifIcon,
      orderId,
    });

    const adminPayload = JSON.stringify({
      title:   "🍕 New Order Received",
      body:    `Order #${orderId} — ₹${orderTotal.toFixed(2)} placed`,
      url:     "/admin/orders",
      urgency: "normal",
      icon:    notifIcon,
      orderId,
    });

    // ── Send concurrently — Promise.allSettled tolerates individual failures ──
    const sendAll = async (targets: PushTarget[], payload: string, label: string) => {
      const results = await Promise.allSettled(
        targets.map((target) =>
          webpush
            .sendNotification(
              {
                endpoint: target.endpoint,
                keys: { p256dh: target.keys.p256dh, auth: target.keys.auth },
              },
              payload
            )
            .then(() => {
              // Update lastUsedAt on success (fire-and-forget)
              if (target.subscriptionDocId) {
                PushSubscription.updateOne(
                  { _id: target.subscriptionDocId },
                  { $set: { lastUsedAt: new Date() } }
                ).catch(() => {});
              }
              return { ok: true, endpoint: target.endpoint };
            })
        )
      );

      let successCount = 0;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const target = targets[i];
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          const err = result.reason as any;
          const statusCode = err?.statusCode ?? err?.status ?? 0;
          console.error(
            `[NotificationService] ❌ Push failed for ${label} endpoint (${statusCode}): ${target.endpoint.slice(0, 60)}...`
          );

          // ── Stale subscription cleanup ────────────────────────────────
          // 410 Gone / 404 Not Found = browser revoked this subscription
          if (statusCode === 410 || statusCode === 404) {
            // 1. Soft-delete in PushSubscription model
            if (target.subscriptionDocId) {
              PushSubscription.updateOne(
                { _id: target.subscriptionDocId },
                { $set: { isActive: false } }
              ).catch(() => {});
            }

            // 2. Prune from User.notificationTokens (legacy cleanup)
            if (target.source === "User.notificationTokens") {
              User.updateMany(
                {},
                { $pull: { notificationTokens: { $regex: target.endpoint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") } } }
              ).catch(() => {});
            }
          }
        }
      }

      console.log(
        `[NotificationService] ✅ Push delivered to ${successCount}/${targets.length} ${label} recipient(s) for order ${orderId}`
      );
    };

    // Send to managers and admins concurrently
    await Promise.allSettled([
      sendAll(managerTargets, managerPayload, "BRANCH_MANAGER"),
      sendAll(adminTargets,   adminPayload,   "SUPER_ADMIN"),
    ]);
  }

  // ── Pipeline 3: MongoDB Notification Persistence ───────────────────────────
  private static async _persistOrderNotifications(options: {
    branchId: string;
    orderId: string;
    orderMongoId?: string;
    orderTotal: number;
  }) {
    const { branchId, orderId, orderMongoId, orderTotal } = options;

    await connectDB();

    const branchObjectId = mongoose.isValidObjectId(branchId)
      ? new mongoose.Types.ObjectId(branchId)
      : undefined;

    const orderObjectId = orderMongoId && mongoose.isValidObjectId(orderMongoId)
      ? new mongoose.Types.ObjectId(orderMongoId)
      : undefined;

    const metadata: Record<string, unknown> = { orderId, total: orderTotal };

    // Fetch ALL branch managers + super admins for in-app bell
    const [allManagers, allAdmins] = await Promise.allSettled([
      User.find({ branchId, role: "BRANCH_MANAGER", isActive: { $ne: false } }).select("_id").lean(),
      User.find({ role: "SUPER_ADMIN", isActive: { $ne: false } }).select("_id").lean(),
    ]);

    const managerDocs = allManagers.status === "fulfilled" ? allManagers.value : [];
    const adminDocs   = allAdmins.status   === "fulfilled" ? allAdmins.value   : [];

    const docs = [
      ...managerDocs.map((m: any) => ({
        recipientId: m._id,
        title:   "📦 New Branch Order",
        message: `Order #${orderId} — ₹${orderTotal.toFixed(2)} is waiting for your action.`,
        type:    "NEW_ORDER" as const,
        orderId: orderObjectId,
        isRead:  false,
        role:    "BRANCH_MANAGER",
        branchId: branchObjectId,
        metadata,
      })),
      ...adminDocs.map((a: any) => ({
        recipientId: a._id,
        title:   "🍕 New Order Received — HPF",
        message: `Order #${orderId} (₹${orderTotal.toFixed(2)}) placed at branch ${branchId}`,
        type:    "NEW_ORDER" as const,
        orderId: orderObjectId,
        isRead:  false,
        role:    "SUPER_ADMIN",
        branchId: branchObjectId,
        metadata,
      })),
    ];

    if (!docs.length) return;

    try {
      await Notification.insertMany(docs, { ordered: false });
      console.log(`[NotificationService] ✅ Persisted ${docs.length} notification(s) for order ${orderId}`);
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
      console.log(`[NotificationService] ℹ️ Duplicate notifications skipped for order ${orderId}`);
    }
  }
}
