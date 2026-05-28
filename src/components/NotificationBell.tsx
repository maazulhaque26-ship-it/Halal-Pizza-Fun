"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, ShoppingBag, RefreshCw, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useNotificationStore, AppNotification } from "@/store/useNotificationStore";
import { getSocket } from "@/lib/socket";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function typeIcon(type: AppNotification["type"]) {
  switch (type) {
    case "NEW_ORDER":         return "🛒";
    case "ORDER_UPDATED":     return "📦";
    case "ORDER_TRANSFERRED": return "🔄";
    default:                  return "🔔";
  }
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function NotificationSkeleton() {
  return (
    <div className="space-y-2.5 px-3 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-3 rounded-xl animate-pulse">
          <div className="w-8 h-8 bg-white/8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/8 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Single notification row ───────────────────────────────────────────────────
function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer rounded-xl mx-2 transition-all duration-200",
        notification.isRead
          ? "hover:bg-white/4"
          : "bg-primary/5 border border-primary/10 hover:bg-primary/8"
      )}
      onClick={() => !notification.isRead && onRead(notification._id)}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-all",
          notification.isRead ? "bg-white/5" : "bg-primary/15"
        )}
      >
        {typeIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold leading-snug truncate",
            notification.isRead ? "text-white/60" : "text-white"
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-white/40 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[10px] text-white/25 mt-1.5 font-medium">
          {formatRelative(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function NotificationBell() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen]   = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef           = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllRead,
    addNotification,
  } = useNotificationStore();

  // Extract primitives to avoid unnecessary effect re-runs on session object changes
  const userId   = session?.user?.id;
  const userRole = (session?.user as any)?.role as string | undefined;

  // ── Mount guard (hydration safety) ─────────────────────────────────────
  useEffect(() => { setMounted(true); }, []);

  // ── Fetch on mount when user is an admin/manager ────────────────────────
  useEffect(() => {
    if (!userId) return;
    if (userRole !== "SUPER_ADMIN" && userRole !== "BRANCH_MANAGER") return;
    fetchNotifications();
  }, [userId, userRole, fetchNotifications]);

  // ── Socket listener — ADDITIVE, does NOT interfere with OrderPopup ──────
  // OrderPopup has its own NEW_ORDER listener for the popup modal.
  // We add a second independent listener here for the bell counter.
  // Socket.IO supports multiple listeners for the same event — no conflicts.
  const handleNewOrder = useCallback(
    (data: any) => {
      const order = data.order ?? {};
      const displayOrderId = data.orderId || order.orderId || "—";

      addNotification({
        _id: `temp_${Date.now()}_${displayOrderId}`,
        title: "🛒 New Order",
        message: `Order #${displayOrderId} — ₹${order.total ?? "0"} received`,
        type: "NEW_ORDER",
        isRead: false,
        createdAt: new Date().toISOString(),
        branchId: data.branchId,
        metadata: { orderId: displayOrderId, total: order.total },
      });
    },
    [addNotification]
  );

  useEffect(() => {
    if (!userId) return;
    if (userRole !== "SUPER_ADMIN" && userRole !== "BRANCH_MANAGER") return;

    const socket = getSocket();
    socket.on("NEW_ORDER", handleNewOrder);
    return () => { socket.off("NEW_ORDER", handleNewOrder); };
  }, [userId, userRole, handleNewOrder]);

  // ── Close dropdown on outside click ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // ── Close on Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // ── Toggle: refresh when opening ────────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (!isOpen) {
      // Force refresh by resetting the throttle bypass on open
      fetchNotifications();
    }
    setIsOpen((v) => !v);
  }, [isOpen, fetchNotifications]);

  // Don't render until mounted (SSR safety) or if user is not staff
  if (!mounted || !userId) return null;
  if (userRole !== "SUPER_ADMIN" && userRole !== "BRANCH_MANAGER") return null;

  const hasUnread = unreadCount > 0;
  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div ref={dropdownRef} className="relative">
      {/* ── Bell Button ── */}
      <button
        id="notification-bell-btn"
        onClick={handleToggle}
        aria-label={`Notifications${hasUnread ? ` (${displayCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={cn(
          "relative p-2 rounded-xl transition-all duration-200",
          isOpen
            ? "bg-primary/15 text-primary"
            : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
        )}
      >
        <Bell className="w-5 h-5" />

        {/* Badge */}
        <AnimatePresence>
          {hasUnread && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
                "bg-red-500 text-white text-[10px] font-black rounded-full",
                "flex items-center justify-center leading-none shadow-md"
              )}
            >
              {displayCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "absolute right-0 top-full mt-2 w-[360px] z-50",
              "rounded-2xl shadow-2xl shadow-black/50 overflow-hidden",
              "border border-white/8"
            )}
            style={{
              background: "linear-gradient(160deg, rgba(13,17,23,0.99) 0%, rgba(5,10,20,0.99) 100%)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/7">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Notifications</span>
                {hasUnread && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                    {displayCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Refresh button */}
                <button
                  onClick={() => {
                    // Force re-fetch by bypassing throttle
                    useNotificationStore.setState({ lastFetchedAt: 0 });
                    fetchNotifications();
                  }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                  aria-label="Refresh notifications"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                </button>
                {/* Mark all as read */}
                {hasUnread && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-primary hover:text-primary/80 hover:bg-primary/8 rounded-lg transition-colors"
                    aria-label="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    All read
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[420px] overflow-y-auto py-2 scrollbar-thin">
              {isLoading && notifications.length === 0 ? (
                <NotificationSkeleton />
              ) : notifications.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <Inbox className="w-7 h-7 text-white/20" />
                  </div>
                  <p className="text-sm font-bold text-white/40">No notifications yet</p>
                  <p className="text-xs text-white/25 mt-1">
                    New orders and updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {notifications.map((n) => (
                    <NotificationRow
                      key={n._id}
                      notification={n}
                      onRead={(id) => {
                        markAsRead(id);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-white/7 flex items-center justify-between">
                <span className="text-[11px] text-white/25 font-medium">
                  {notifications.length} notification{notifications.length !== 1 ? "s" : ""} loaded
                </span>
                {/* Subtle icon */}
                <ShoppingBag className="w-3.5 h-3.5 text-white/15" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
