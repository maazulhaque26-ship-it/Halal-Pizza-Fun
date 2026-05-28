import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: "NEW_ORDER" | "ORDER_UPDATED" | "ORDER_TRANSFERRED" | "SYSTEM";
  orderId?: string;
  isRead: boolean;
  branchId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasFetched: boolean;
  lastFetchedAt: number; // unix ms — used to throttle refetches

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /**
   * Optimistically prepend a notification from a socket event.
   * Deduplicates by _id so the same socket ping cannot add twice.
   */
  addNotification: (n: AppNotification) => void;
  /** Forcefully reset (e.g. on signout). */
  reset: () => void;
}

const REFETCH_THROTTLE_MS = 30_000; // 30 s — don't hammer the API

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasFetched: false,
  lastFetchedAt: 0,

  // ── fetchNotifications ──────────────────────────────────────────────────
  fetchNotifications: async () => {
    const { isLoading, lastFetchedAt } = get();
    // Throttle — avoid concurrent / rapid successive fetches
    if (isLoading) return;
    if (Date.now() - lastFetchedAt < REFETCH_THROTTLE_MS && get().hasFetched) return;

    set({ isLoading: true });
    try {
      const res = await fetch("/api/notifications?limit=25");
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      if (json.success) {
        set({
          notifications: json.data ?? [],
          unreadCount: json.unreadCount ?? 0,
          hasFetched: true,
          lastFetchedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn("[NotificationStore] fetch error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  // ── markAsRead ─────────────────────────────────────────────────────────
  markAsRead: async (id: string) => {
    // Optimistic update
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - (s.notifications.find((n) => n._id === id && !n.isRead) ? 1 : 0)),
    }));

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.warn("[NotificationStore] markAsRead error:", err);
      // Revert on failure — refresh
      get().fetchNotifications();
    }
  },

  // ── markAllRead ─────────────────────────────────────────────────────────
  markAllRead: async () => {
    // Optimistic update
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.warn("[NotificationStore] markAllRead error:", err);
      get().fetchNotifications();
    }
  },

  // ── addNotification ─────────────────────────────────────────────────────
  addNotification: (n: AppNotification) => {
    set((s) => {
      // Dedup: skip if _id already exists (prevents double-socket-fire)
      if (s.notifications.some((existing) => existing._id === n._id)) return s;
      return {
        notifications: [n, ...s.notifications].slice(0, 50), // cap at 50 in memory
        unreadCount: s.unreadCount + 1,
      };
    });
  },

  // ── reset ───────────────────────────────────────────────────────────────
  reset: () =>
    set({ notifications: [], unreadCount: 0, isLoading: false, hasFetched: false, lastFetchedAt: 0 }),
}));
