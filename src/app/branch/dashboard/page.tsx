"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Clock, CheckCircle, AlertCircle, RefreshCw, XCircle, Wifi, WifiOff } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API, ORDER_STATUS } from "@/config/constants";
import { getSocket, connectSocket } from "@/lib/socket";

interface Order {
  _id: string; orderId: string; status: string; total: number; createdAt: string; specialInstructions?: string;
  customerId?: { name: string; phone: string };
  items: { productId?: { name: string; isVegetarian: boolean }; quantity: number; price: number }[];
}

const ACTION_MAP: Record<string, string[]> = {
  PENDING: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.REJECTED],
  ACCEPTED: [ORDER_STATUS.PREPARING],
  PREPARING: [ORDER_STATUS.READY],
  READY: [ORDER_STATUS.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [ORDER_STATUS.DELIVERED],
};

const COLOR_MAP: Record<string, string> = {
  ACCEPTED: "bg-blue-500", REJECTED: "bg-red-500", PREPARING: "bg-violet-500",
  READY: "bg-emerald-500", OUT_FOR_DELIVERY: "bg-cyan-500", DELIVERED: "bg-green-500"
};

export default function BranchDashboardPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const ordersRef = useRef<Order[]>(orders);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const fetchOrders = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch(`${API.ORDERS}?branchId=${session.user.branchId || ""}&limit=50`);
      const d = await res.json();
      if (d.success) {
        setOrders(d.data.filter((o: Order) =>
          !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
        ));
      }
    } catch { toast.error("Failed to load live orders"); }
    finally { setLoading(false); }
  }, [session]);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Socket realtime integration ────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user) return;

    const socket = getSocket();

    const joinRooms = () => {
      if (session.user.role === "BRANCH_MANAGER" && session.user.branchId) {
        console.log(`[Dashboard] 🏢 join_branch ${session.user.branchId}`);
        socket.emit("join_branch", session.user.branchId);
      } else if (session.user.role === "SUPER_ADMIN") {
        console.log("[Dashboard] 👑 join_admin");
        socket.emit("join_admin");
      }
      setSocketConnected(true);
    };

    const onConnect = () => {
      console.log("[Dashboard] ✅ Socket connected");
      setSocketConnected(true);
      joinRooms();
    };

    const onDisconnect = (reason: string) => {
      console.warn("[Dashboard] 🔌 Socket disconnected:", reason);
      setSocketConnected(false);
    };

    // New order: prepend to top without full refetch
    const onNewOrder = (data: any) => {
      console.log("[Dashboard] 🔔 NEW_ORDER socket event:", data);
      const incoming: Order = data.order || {
        _id: data.orderId,
        orderId: data.orderId,
        status: "PENDING",
        total: data.total ?? 0,
        createdAt: new Date().toISOString(),
        items: [],
      };

      // Avoid duplicates
      const alreadyExists = ordersRef.current.some(
        (o) => o._id === incoming._id || o.orderId === incoming.orderId
      );
      if (alreadyExists) {
        console.log("[Dashboard] Duplicate NEW_ORDER skipped:", incoming.orderId);
        return;
      }

      setOrders((prev) => [incoming, ...prev]);
      toast.success(`🔔 New order received: ${incoming.orderId}`);
    };

    // Status update from socket: sync status in-place
    const onStatusChanged = (data: any) => {
      console.log("[Dashboard] 🔄 ORDER_STATUS_CHANGED:", data);
      setOrders((prev) =>
        prev
          .map((o) => (o._id === data.orderId || o.orderId === data.orderId)
            ? { ...o, status: data.status }
            : o
          )
          .filter((o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status))
      );
    };

    if (!socket.connected) {
      connectSocket(); // fetches JWT, sets auth, then connects — no raw connect() calls
    } else {
      joinRooms();
      setSocketConnected(true);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("NEW_ORDER", onNewOrder);
    socket.on("ORDER_STATUS_CHANGED", onStatusChanged);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("NEW_ORDER", onNewOrder);
      socket.off("ORDER_STATUS_CHANGED", onStatusChanged);
    };
  }, [session]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(API.ORDERS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Order ${status}`);
        // Optimistic update — socket will also fire ORDER_STATUS_CHANGED
        setOrders((prev) =>
          prev
            .map((o) => o._id === orderId ? { ...o, status } : o)
            .filter((o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status))
        );
      } else toast.error(d.message);
    } catch { toast.error("Update failed"); }
    finally { setUpdating(null); }
  };

  if (loading) return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => <div key={i} className="h-64 bg-background/8 rounded-3xl animate-pulse" />)}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-white">Live Kitchen View</h2>
          <p className="text-white/40 mt-1 flex flex-wrap items-center gap-2">
            <span>{orders.length} active orders requiring attention</span>
            {socketConnected
              ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><Wifi className="w-3 h-3" /> Live</span>
              : <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><WifiOff className="w-3 h-3" /> Reconnecting…</span>
            }
          </p>
        </div>
        <button onClick={fetchOrders} className="p-2.5 sm:p-3 bg-background rounded-xl shadow-sm hover:bg-background text-white/60 transition-colors shrink-0 ml-3" title="Manual refresh">
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 bg-background rounded-3xl border border-white/8 shadow-sm">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-50" />
          <h3 className="text-xl font-black text-white/90">Kitchen is clear!</h3>
          <p className="text-white/40">Waiting for new orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {orders.map((o) => (
              <motion.div key={o._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-background rounded-3xl overflow-hidden border shadow-sm flex flex-col ${o.status === "PENDING" ? "border-amber-300 shadow-amber-100" : "border-white/8"}`}>

                {/* Header */}
                <div className={`p-4 border-b ${o.status === "PENDING" ? "bg-amber-400/8 border-amber-400/15" : "bg-background border-white/8"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-black text-lg text-white">{o.orderId}</h3>
                      <p className="text-xs font-bold text-white/40">{(o.customerId as any)?.name || "Guest"} • {(o.customerId as any)?.phone || "No phone"}</p>
                    </div>
                    <span className="text-xs font-black bg-[#080d15] text-white px-2 py-1 rounded-lg">
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-white/40">Status: <span className="text-primary">{o.status}</span></div>
                </div>

                {/* Items */}
                <div className="p-4 flex-1 overflow-y-auto">
                  <div className="space-y-3 mb-4">
                    {o.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <span className="font-black text-white">{item.quantity}×</span>
                          <div>
                            <p className="text-sm font-bold text-white/90 flex items-center gap-1">
                              {item.productId?.name || "Item"}
                              {item.productId?.isVegetarian && <span className="w-2 h-2 rounded-full bg-green-500" />}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {o.specialInstructions && (
                    <div className="bg-rose-400/8 p-3 rounded-xl border border-rose-400/20 flex gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-rose-400">{o.specialInstructions}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-background border-t border-white/8 grid grid-cols-2 gap-2">
                  {ACTION_MAP[o.status]?.map(action => (
                    <button key={action}
                      onClick={() => updateStatus(o._id, action)}
                      disabled={updating === o._id}
                      className={`py-3 rounded-xl text-xs font-black text-white uppercase transition-transform active:scale-95 ${COLOR_MAP[action] || "bg-background/10"} ${ACTION_MAP[o.status].length === 1 ? "col-span-2" : ""}`}>
                      {updating === o._id ? "..." : action}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
