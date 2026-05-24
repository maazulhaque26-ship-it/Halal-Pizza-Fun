"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Download, Bell, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.replace(/=/g, "").length % 4)) % 4);
  const base64 = (base64String.replace(/=/g, "") + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PwaManager() {
  const { data: session } = useSession();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Guard against state updates after unmount (prevents React 19 enqueueModel TypeError)
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // ── 1. Service Worker Registration ─────────────────────────────────────
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] ✅ Service Worker registered, scope:", reg.scope);

          // Force the browser to check for an updated SW immediately.
          reg.update().catch(() => {});

          // When a new SW finishes installing (waiting), tell it to skip
          // waiting and take over right away so stale caches are purged.
          const activateWaiting = (sw: ServiceWorker) => {
            sw.postMessage({ type: "SKIP_WAITING" });
          };

          if (reg.waiting) activateWaiting(reg.waiting);

          reg.addEventListener("updatefound", () => {
            const newSW = reg.installing;
            if (!newSW) return;
            newSW.addEventListener("statechange", () => {
              if (newSW.state === "installed" && navigator.serviceWorker.controller) {
                activateWaiting(newSW);
              }
            });
          });

          reg.pushManager.getSubscription().then((sub) => {
            if (sub && isMounted.current) {
              console.log("[PWA] Existing push subscription found");
              setIsSubscribed(true);
            }
          });
        })
        .catch((err) => console.warn("[PWA] ❌ Service Worker registration failed:", err));

      // Reload once when a new SW takes control so the page loads fresh chunks.
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    }

    // ── 2. Install Prompt ───────────────────────────────────────────────────
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      if (isMounted.current) {
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if ("Notification" in window && isMounted.current) {
      setPermission(Notification.permission);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // ── Auto-subscribe admins/managers on login ─────────────────────────────
  useEffect(() => {
    if (!session?.user) return;
    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "BRANCH_MANAGER") return;
    if (isSubscribed) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    // Already granted — silently register subscription
    subscribeInternal();
  }, [session, isSubscribed]);

  const subscribeInternal = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn("[PWA] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
        return;
      }
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      console.log("[PWA] 📡 Push subscription created:", sub.endpoint);
      if (isMounted.current) setIsSubscribed(true);

      // ── Persist to backend (array-safe endpoint) ────────────────────────
      const res = await fetch("/api/users/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      const data = await res.json();
      console.log("[PWA] Push subscription save result:", data.message);
    } catch (err) {
      console.warn("[PWA] ❌ Failed to subscribe to Web Push:", err);
    }
  };

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const permissionResult = await Notification.requestPermission();
      if (isMounted.current) setPermission(permissionResult);
      if (permissionResult !== "granted") return;
      await subscribeInternal();
    } catch (err) {
      console.warn("[PWA] ❌ Notification request failed:", err);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  if (!session) return null;

  return (
    <>
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#080d15]/95 backdrop-blur-md border border-white/10/50 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-4 text-white/10 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192x192.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow-md" />
            <div>
              <h4 className="font-semibold text-sm">Install HPF Partner App</h4>
              <p className="text-xs text-white/10">Get real-time order alerts &amp; native mobile experience.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#080d15] font-bold px-3 py-1.5 rounded-xl text-xs shadow-lg transition-all flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Install
            </button>
            <button onClick={() => setShowInstallBanner(false)} className="text-white/10 hover:text-white/10 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Enable Notifications Prompt */}
      {permission === "default" && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-amber-500/10 backdrop-blur-md border border-amber-500/30 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-4 text-white/10 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Enable Order Alerts</h4>
              <p className="text-xs text-white/10">Never miss a new order or urgent kitchen alert.</p>
            </div>
          </div>
          <button
            onClick={subscribeToPush}
            className="bg-amber-500 hover:bg-amber-600 text-[#080d15] font-bold px-4 py-1.5 rounded-xl text-xs shadow-lg transition-all"
          >
            Allow
          </button>
        </div>
      )}
    </>
  );
}
