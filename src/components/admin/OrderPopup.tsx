"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle, XCircle, Utensils, MapPin, DollarSign } from "lucide-react";
import { useOrderPopupStore } from "@/store/useOrderPopupStore";
import { getSocket, connectSocket } from "@/lib/socket";

export function OrderPopup() {
  const { data: session } = useSession();
  const { activeOrder, setActiveOrder, isProcessing, setIsProcessing } = useOrderPopupStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stable callback — does not close over stale state
  const handleNewOrder = useCallback((data: any) => {
    const order = data.order || { orderId: data.orderId, branchId: data.branchId, total: data.total };
    console.log("[OrderPopup] 🔔 NEW_ORDER received:", order);

    setActiveOrder(order);

    // ── Sound ──────────────────────────────────────────────────────────────
    const isUrgent = (order.total ?? 0) > 150;
    const audioUrl = isUrgent ? "/sounds/urgent.mp3" : "/sounds/new-order.mp3";
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().catch((err) => console.warn("[OrderPopup] Audio blocked:", err));

    // ── Vibration ──────────────────────────────────────────────────────────
    if ("vibrate" in navigator) {
      navigator.vibrate(isUrgent ? [300, 100, 300, 100, 300] : [200, 100, 200]);
    }
  }, [setActiveOrder]);

  // Extract primitives — using the session *object* as a dep causes the effect
  // to re-run (and call connectSocket() again) on every NextAuth internal update
  // even when the user's id/role hasn't changed.
  const userId   = session?.user?.id;
  const userRole = session?.user?.role;
  const branchId = (session?.user as any)?.branchId;

  useEffect(() => {
    if (!userId) return;
    if (userRole !== "BRANCH_MANAGER" && userRole !== "SUPER_ADMIN") return;

    const socket = getSocket();

    if (!socket.connected) {
      console.log("[OrderPopup] Connecting socket...");
      connectSocket();
    }

    const joinRooms = () => {
      if (userRole === "BRANCH_MANAGER" && branchId) {
        console.log(`[OrderPopup] 🏢 Emitting join_branch for ${branchId}`);
        socket.emit("join_branch", branchId);
      } else if (userRole === "SUPER_ADMIN") {
        console.log("[OrderPopup] 👑 Emitting join_admin");
        socket.emit("join_admin");
      }
    };

    if (socket.connected) joinRooms();
    else socket.once("connect", joinRooms);

    socket.on("NEW_ORDER", handleNewOrder);

    return () => {
      socket.off("NEW_ORDER", handleNewOrder);
      socket.off("connect", joinRooms);
    };
  }, [userId, userRole, branchId, handleNewOrder]);

  const handleAction = async (status: "ACCEPTED" | "REJECTED") => {
    if (!activeOrder) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: activeOrder._id || activeOrder.orderId, status }),
      });
      const d = await res.json();
      if (d.success) {
        setActiveOrder(null);
      } else {
        console.error("[OrderPopup] Action failed:", d.message);
      }
    } catch (err) {
      console.error("[OrderPopup] Failed to update order status:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!activeOrder) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#080d15] border-2 border-amber-500/50 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/20 rounded-2xl">
              <Utensils className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <span className="bg-background text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                New Order Received
              </span>
              <h3 className="text-xl font-black tracking-tight mt-0.5">
                {activeOrder.orderId}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-black/70 font-semibold block">Total Amount</span>
            <span className="text-2xl font-black flex items-center justify-end">
              <DollarSign className="w-5 h-5 -mr-1" />
              {activeOrder.total ?? "N/A"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/8">
            <div>
              <span className="text-xs text-white/50 block mb-1 font-medium">Customer</span>
              <p className="font-bold text-white text-sm truncate">
                {activeOrder.deliveryAddress?.street || "Guest Customer"}
              </p>
            </div>
            <div>
              <span className="text-xs text-white/50 block mb-1 font-medium">Delivery Area</span>
              <p className="font-bold text-white text-sm truncate flex items-center gap-1">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                {activeOrder.deliveryAddress?.city || "Local"}
              </p>
            </div>
          </div>

          {/* Items List */}
          {activeOrder.items?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                Order Items ({activeOrder.items.length})
              </h4>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {activeOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white/4 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-amber-500/10 text-amber-400 font-bold text-xs rounded-lg flex items-center justify-center border border-amber-500/20 shrink-0">
                        {item.quantity}x
                      </span>
                      <div>
                        <p className="font-bold text-white/90 text-sm">{item.name || item.productId?.name || "Menu Item"}</p>
                        {item.selectedAddons?.length > 0 && (
                          <p className="text-xs text-white/50 truncate">
                            + {item.selectedAddons.map((a: any) => a.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-white/90 text-sm">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-black/30 border-t border-white/8 flex items-center gap-4">
          <button
            disabled={isProcessing}
            onClick={() => handleAction("REJECTED")}
            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            <XCircle className="w-5 h-5" /> Reject
          </button>
          <button
            disabled={isProcessing}
            onClick={() => handleAction("ACCEPTED")}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" /> Accept Order
          </button>
        </div>
      </div>
    </div>
  );
}
