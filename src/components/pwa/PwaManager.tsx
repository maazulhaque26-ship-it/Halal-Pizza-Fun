"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Download, Bell, X } from "lucide-react";
import { usePwaStore } from "@/store/pwaStore";

const FALLBACK_ICON = "/icons/icon-192x192.png";

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
  const { deferredPrompt, showBanner, setDeferredPrompt, clearDeferredPrompt, setShowBanner, setInstalled } = usePwaStore();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [appLogoUrl, setAppLogoUrl] = useState<string>(FALLBACK_ICON);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Check if already installed
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }
  }, [setInstalled]);

  // Fetch admin's uploaded logo to use in the install banner
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const logo = d.data?.mobileLogoUrl || d.data?.logoUrl;
          if (logo && isMounted.current) setAppLogoUrl(logo);
        }
      })
      .catch(() => {});
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

    // ── 2. Capture beforeinstallprompt — store in Zustand for Footer to use ──
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      if (isMounted.current) setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // ── 3. Detect when app is installed ──────────────────────────────────────
    const handleAppInstalled = () => {
      if (isMounted.current) { clearDeferredPrompt(); setInstalled(true); }
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // ── 4. Notification permission state ────────────────────────────────────
    if ("Notification" in window && isMounted.current) {
      setPermission(Notification.permission);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [setDeferredPrompt, clearDeferredPrompt, setInstalled]);

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
      if (!vapidPublicKey) return;

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        const existingKey = existingSub.options?.applicationServerKey;
        if (existingKey) {
          const existingKeyArray = new Uint8Array(existingKey as ArrayBuffer);
          if (!existingKeyArray.every((v, i) => v === applicationServerKey[i])) {
            await existingSub.unsubscribe();
          } else {
            if (isMounted.current) setIsSubscribed(true);
            return;
          }
        } else {
          await existingSub.unsubscribe();
        }
      }

      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      if (isMounted.current) setIsSubscribed(true);

      await fetch("/api/users/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
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
    if (outcome === "accepted") clearDeferredPrompt();
  };

  const isStaff = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "BRANCH_MANAGER";
  const showNotificationPrompt = isStaff && permission === "default";

  return (
    <>
      {/* ── Floating Install Banner — shown when Chrome fires beforeinstallprompt ── */}
      {showBanner && deferredPrompt && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#080d15]/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/15 bg-[#0d1117] flex items-center justify-center shadow-md">
              <img
                src={appLogoUrl}
                alt="App Icon"
                className="w-full h-full object-cover object-center"
                onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK_ICON; }}
              />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Install the App</h4>
              <p className="text-xs text-white/60">Get real-time order alerts &amp; faster experience.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-linear-to-r from-amber-500 to-amber-600 text-[#080d15] font-bold px-3 py-1.5 rounded-xl text-xs shadow-lg transition-all flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Install
            </button>
            <button
              onClick={() => setShowBanner(false)}
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
