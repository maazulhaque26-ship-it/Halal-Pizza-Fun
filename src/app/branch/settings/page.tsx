"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bell, Volume2, VolumeX, Vibrate, Download, LogOut, Store, ShieldCheck } from "lucide-react";

export default function BranchSettingsPage() {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Load saved preferences
    const savedSound = localStorage.getItem("hpf_sound_enabled");
    if (savedSound !== null) setSoundEnabled(savedSound === "true");

    const savedVibe = localStorage.getItem("hpf_vibe_enabled");
    if (savedVibe !== null) setVibrationEnabled(savedVibe === "true");

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem("hpf_sound_enabled", String(nextState));
  };

  const toggleVibration = () => {
    const nextState = !vibrationEnabled;
    setVibrationEnabled(nextState);
    localStorage.setItem("hpf_vibe_enabled", String(nextState));
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <div className="min-h-screen bg-background text-white/90 p-6 pb-24 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">PWA App Settings</h1>
        <p className="text-sm text-white/50 mt-1">Configure your branch operational alerts & mobile preferences.</p>
      </div>

      {/* Branch Identity Card */}
      <div className="bg-[#0a0e17] p-6 rounded-3xl border border-white/10/50 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Assigned Branch
            </span>
            <h3 className="text-xl font-bold mt-1">{session?.user?.name || "Partner Branch"}</h3>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Role: {session?.user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Permissions */}
      <div className="bg-[#080d15] p-6 rounded-3xl border border-white/8 space-y-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base">Push Notifications</h4>
              <p className="text-xs text-white/50">Receive instant background alerts for new orders.</p>
            </div>
          </div>
          {permission === "granted" ? (
            <span className="bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1.5 rounded-xl text-xs border border-emerald-500/20">
              Active
            </span>
          ) : (
            <button
              onClick={requestNotifications}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition-all"
            >
              Enable Alerts
            </button>
          )}
        </div>

        <hr className="border-white/8" />

        {/* Sound Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="font-bold text-base">Order Alarm Sound</h4>
              <p className="text-xs text-white/50">Play audio ringtone when a new order arrives.</p>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className={`font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all ${
              soundEnabled
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
                : "bg-background/10 text-white/50 hover:bg-background/15"
            }`}
          >
            {soundEnabled ? "Sound ON" : "Sound OFF"}
          </button>
        </div>

        <hr className="border-white/8" />

        {/* Vibration Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Vibrate className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base">Haptic Vibration</h4>
              <p className="text-xs text-white/50">Vibrate mobile device on urgent kitchen alerts.</p>
            </div>
          </div>
          <button
            onClick={toggleVibration}
            className={`font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all ${
              vibrationEnabled
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20"
                : "bg-background/10 text-white/50 hover:bg-background/15"
            }`}
          >
            {vibrationEnabled ? "Vibration ON" : "Vibration OFF"}
          </button>
        </div>

        {deferredPrompt && (
          <>
            <hr className="border-white/8" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Install Home Screen App</h4>
                  <p className="text-xs text-white/50">Install standalone PWA for full native experience.</p>
                </div>
              </div>
              <button
                onClick={handleInstall}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black px-4 py-2 rounded-xl text-xs shadow-lg transition-all"
              >
                Install App
              </button>
            </div>
          </>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-4 rounded-3xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
      >
        <LogOut className="w-5 h-5" /> Sign Out of Partner App
      </button>
    </div>
  );
}
