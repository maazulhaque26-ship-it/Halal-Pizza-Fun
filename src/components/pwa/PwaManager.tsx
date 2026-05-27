"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Download, Bell, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.replace(/=/g, "").length % 4)) % 4);
  const base64 = (base64String.replace(/=/g, "") + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function PwaManager() {
  const { data: session } = useSession();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // ── 1. Service Worker registration (production only) ──────────────────────
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] ✅ Service Worker registered, scope:", reg.scope);
          reg.update().catch(() => {});

          const activateWaiting = (sw: ServiceWorker) => sw.postMessage({ type: "SKIP_WAITING" });
          if (reg.waiting) activateWaiting(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const newSW = reg.installing;
            if (!newSW) return;
            newSW.addEventListener("statechange", () => {
              if (newSW.state === "installed" && navigator.serviceWorker.controller) activateWaiting(newSW);
            });
          });

          reg.pushManager.getSubscription().then((sub) => {
            if (sub && isMounted.current) setIsSubscribed(true);
          });
        })
        .catch((err) => console.warn("[PWA] ❌ SW registration failed:", err));

      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    }

    // ── 2. Install prompt (shown to ALL visitors, not just logged-in) ────────
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      if (isMounted.current) { setDeferredPrompt(e); setShowInstallBanner(true); }
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // ── 3. Notification permission state ────────────────────────────────────
    if ("Notification" in window && isMounted.current) {
      setPermission(Notification.permission);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // ── Auto-subscribe admins/managers once they log in ────────────────────────
  useEffect(() => {
    if (!session?.user) return;
    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "BRANCH_MANAGER") return;
    if (isSubscribed) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    subscribeInternal();
  }, [session, isSubscribed]);

  const subscribeInternal = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn("[PWA] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — push disabled");
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // If an existing subscription was created with a different VAPID key, the
      // browser throws InvalidStateError. Unsubscribe it first, then resubscribe.
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        const existingKey = existingSub.options?.applicationServerKey;
        if (existingKey) {
          const existingKeyArray = new Uint8Array(existingKey as ArrayBuffer);
          if (!existingKeyArray.every((v, i) => v === applicationServerKey[i])) {
            console.log("[PWA] VAPID key changed — unsubscribing old subscription");
            await existingSub.unsubscribe();
          } else {
            // Same key, already subscribed
            if (isMounted.current) setIsSubscribed(true);
            return;
          }
        } else {
          await existingSub.unsubscribe();
        }
      }

      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      console.log("[PWA] 📡 Push subscription created:", sub.endpoint);
      if (isMounted.current) setIsSubscribed(true);

      const res = await fetch("/api/users/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      const data = await res.json();
      console.log("[PWA] Push subscription saved:", data.message);
    } catch (err) {
      console.warn("[PWA] ❌ Failed to subscribe to Web Push:", err);
    }
  };

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const result = await Notification.requestPermission();
      if (isMounted.current) setPermission(result);
      if (result !== "granted") return;
      await subscribeInternal();
    } catch (err) {
      console.warn("[PWA] ❌ Notification request failed:", err);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setShowInstallBanner(false); setDeferredPrompt(null); }
  };

  // Only show the notification prompt to admins/managers who are logged in
  const isStaff = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "BRANCH_MANAGER";
  const showNotificationPrompt = isStaff && permission === "default";

  return (
    <>
      {/* ── PWA Install Banner (visible to all users) ── */}
      {showInstallBanner && (
        <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#080d15]/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192x192.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow-md shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-white">Install HPF Partner App</h4>
              <p className="text-xs text-white/60">Get real-time order alerts &amp; native mobile experience.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#080d15] font-bold px-3 py-1.5 rounded-xl text-xs shadow-lg transition-all flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-white/50 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Enable Notifications Prompt (staff only) ── */}
      {showNotificationPrompt && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-amber-500/10 backdrop-blur-md border border-amber-500/30 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Enable Order Alerts</h4>
              <p className="text-xs text-white/60">Never miss a new order or urgent kitchen alert.</p>
            </div>
          </div>
          <button
            onClick={subscribeToPush}
            className="bg-amber-500 hover:bg-amber-600 text-[#080d15] font-bold px-4 py-1.5 rounded-xl text-xs shadow-lg transition-all shrink-0"
          >
            Allow
          </button>
        </div>
      )}
    </>
  );
}
