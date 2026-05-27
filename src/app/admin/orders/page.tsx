"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, RefreshCw, Search, Copy, Check, X, ChevronDown,
  MapPin, Phone, User, Store, Package, CreditCard, Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/lib/socket";
import { toast } from "@/components/ui/Toast";
import { API, ORDER_STATUS } from "@/config/constants";

const STATUS_OPTIONS = ["ALL", ...Object.values(ORDER_STATUS)];

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  PENDING:          { color: "text-amber-400",   bg: "bg-amber-400/10" },
  ACCEPTED:         { color: "text-blue-400",    bg: "bg-blue-400/10" },
  PREPARING:        { color: "text-violet-400",  bg: "bg-violet-400/10" },
  READY:            { color: "text-green-400",   bg: "bg-green-400/10" },
  OUT_FOR_DELIVERY: { color: "text-cyan-400",    bg: "bg-cyan-400/10" },
  DELIVERED:        { color: "text-emerald-400", bg: "bg-emerald-400/10" },
  CANCELLED:        { color: "text-red-400",     bg: "bg-red-400/10" },
  REJECTED:         { color: "text-red-400",     bg: "bg-red-400/10" },
  TRANSFERRED:      { color: "text-purple-400",  bg: "bg-purple-400/10" },
  REFUNDED:         { color: "text-rose-400",    bg: "bg-rose-400/10" },
};

interface DeliveryAddress {
  fullName?: string;
  phone?: string;
  alternatePhone?: string;
  houseNumber?: string;
  floor?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  deliveryInstructions?: string;
  // Legacy fields
  zip?: string;
}

interface Order {
  _id: string;
  orderId: string;
  status: string;
  total: number;
  subTotal?: number;
  tax?: number;
  deliveryFee?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  specialInstructions?: string;
  customerId?: { name: string; email: string; phone?: string };
  branchId?: { name: string };
  deliveryAddress?: DeliveryAddress;
  items: { productId?: { name: string }; quantity: number; price: number; selectedAddons?: { name: string; price: number }[] }[];
}

// ── Copy to Clipboard utility ──────────────────────────────────────────────
function buildAddressText(order: Order): string {
  const addr = order.deliveryAddress;
  if (!addr) return "";
  const lines = [
    addr.fullName && `Name: ${addr.fullName}`,
    addr.phone && `Phone: ${addr.phone}${addr.alternatePhone ? ` / ${addr.alternatePhone}` : ""}`,
    addr.houseNumber && `Address: ${addr.houseNumber}${addr.floor ? `, Floor ${addr.floor}` : ""}, ${addr.street || ""}`,
    addr.landmark && `Landmark: ${addr.landmark}`,
    `${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || addr.zip || ""}`,
    addr.deliveryInstructions && `Note: ${addr.deliveryInstructions}`,
    `Order: ${order.orderId} | ₹${order.total?.toFixed(2)} (${order.paymentMethod || ""})`,
  ].filter(Boolean);
  return lines.join("\n");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy address & info"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/60 hover:text-white transition-all text-xs font-bold"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function AdminOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const params = statusFilter !== "ALL" ? `?status=${statusFilter}&limit=100` : "?limit=100";
      const res = await fetch(`${API.ORDERS}${params}`);
      const d = await res.json();
      if (d.success) setOrders(d.data);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Real-time socket listener
  useEffect(() => {
    if (!session?.user) return;
    const socket = getSocket();

    const onNewOrder = () => { toast.info("🔔 A new order just arrived!"); fetchOrders(); };
    const onStatusChanged = () => { fetchOrders(); };

    if (!socket.connected) socket.connect();
    if ((session.user as any).role === "SUPER_ADMIN") socket.emit("join_admin");

    socket.on("NEW_ORDER", onNewOrder);
    socket.on("ORDER_STATUS_CHANGED", onStatusChanged);
    return () => {
      socket.off("NEW_ORDER", onNewOrder);
      socket.off("ORDER_STATUS_CHANGED", onStatusChanged);
    };
  }, [session, fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(API.ORDERS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Status updated → ${newStatus}`);
        setSelected(null);
        fetchOrders();
      } else toast.error(d.message);
    } catch { toast.error("Update failed"); }
    finally { setUpdating(false); }
  };

  const filtered = orders.filter(o =>
    !search ||
    o.orderId.toLowerCase().includes(search.toLowerCase()) ||
    (o.customerId as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (o.deliveryAddress?.phone || "").includes(search) ||
    (o.deliveryAddress?.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Orders</h2>
          <p className="text-gray-400 mt-1 text-sm">{filtered.length} orders shown</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white/70 hover:bg-white/10 transition-colors self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID, customer name or phone..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-white/25"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
                statusFilter === s ? "bg-primary text-black shadow-lg shadow-primary/25" : "bg-white/5 border border-white/10 text-white/60 hover:border-primary/40"
              }`}>
              {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/50">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-bold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            return (
              <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(order)}
                className="rounded-2xl p-5 cursor-pointer transition-all"
                style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(244,196,48,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-black text-white text-sm">{order.orderId}</p>
                      <p className="text-xs text-gray-500">{(order.customerId as any)?.name || order.deliveryAddress?.fullName || "Guest"}</p>
                      {order.deliveryAddress?.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {order.deliveryAddress.phone}
                        </p>
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-400">{(order.branchId as any)?.name || "—"}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${cfg.bg} ${cfg.color}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <span className="font-black text-white">₹{order.total?.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Order Detail Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelected(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full h-full sm:h-auto sm:rounded-3xl rounded-none shadow-2xl sm:max-w-lg max-h-full sm:max-h-[92vh] overflow-y-auto"
              style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/8 sticky top-0 z-10 rounded-t-3xl" style={{ background: "#0f172a" }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-black text-white">{selected.orderId}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_CONFIG[selected.status]?.bg} ${STATUS_CONFIG[selected.status]?.color}`}>
                      {selected.status.replace(/_/g, " ")}
                    </span>
                    <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Customer & Branch */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Customer</p>
                    </div>
                    <p className="font-bold text-gray-100 text-sm">{(selected.customerId as any)?.name || "Guest"}</p>
                    <p className="text-xs text-gray-500 truncate">{(selected.customerId as any)?.email}</p>
                    {(selected.customerId as any)?.phone && (
                      <p className="text-xs text-gray-500 mt-1">📞 {(selected.customerId as any).phone}</p>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Store className="w-3.5 h-3.5 text-gray-500" />
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Branch</p>
                    </div>
                    <p className="font-bold text-gray-100 text-sm">{(selected.branchId as any)?.name || "—"}</p>
                    <p className="text-xs text-gray-500 mt-1">{selected.paymentMethod || "—"} · {selected.paymentStatus || "—"}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                {selected.deliveryAddress && (
                  <div className="bg-blue-400/8 border border-blue-400/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <p className="text-xs text-blue-400 font-black uppercase tracking-wide">Delivery Address</p>
                      </div>
                      <CopyButton text={buildAddressText(selected)} />
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {selected.deliveryAddress.fullName && (
                        <p className="font-bold text-gray-100">
                          {selected.deliveryAddress.fullName}
                          {selected.deliveryAddress.phone && (
                            <span className="font-normal text-gray-500 ml-2">
                              <Phone className="w-3 h-3 inline mr-1" />
                              {selected.deliveryAddress.phone}
                              {selected.deliveryAddress.alternatePhone && ` / ${selected.deliveryAddress.alternatePhone}`}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-gray-300">
                        {[
                          selected.deliveryAddress.houseNumber,
                          selected.deliveryAddress.floor ? `Floor ${selected.deliveryAddress.floor}` : null,
                          selected.deliveryAddress.street,
                        ].filter(Boolean).join(", ")}
                      </p>
                      {selected.deliveryAddress.landmark && (
                        <p className="text-gray-500 text-xs">Landmark: {selected.deliveryAddress.landmark}</p>
                      )}
                      <p className="text-gray-300 font-semibold">
                        {selected.deliveryAddress.city}, {selected.deliveryAddress.state} — {selected.deliveryAddress.pincode || selected.deliveryAddress.zip}
                      </p>
                      {selected.deliveryAddress.deliveryInstructions && (
                        <p className="text-xs text-amber-400 bg-amber-400/8 rounded-lg px-3 py-2 mt-2 border border-amber-400/20">
                          📝 {selected.deliveryAddress.deliveryInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                {selected.specialInstructions && (
                  <div className="bg-amber-400/8 border border-amber-400/20 rounded-2xl p-4 text-sm text-amber-400">
                    <p className="font-black text-xs uppercase tracking-wide mb-1 text-amber-400">Special Instructions</p>
                    {selected.specialInstructions}
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-sm font-black text-gray-400 mb-3 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Items
                  </p>
                  <div className="space-y-2 bg-white/5 rounded-2xl p-4">
                    {selected.items?.map((item: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-sm text-gray-300 font-semibold">{item.productId?.name || "Item"} × {item.quantity}</span>
                          <span className="font-bold text-gray-100">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.selectedAddons?.length > 0 && (
                          <p className="text-xs text-gray-500 pl-2">+ {item.selectedAddons.map((a: any) => a.name).join(", ")}</p>
                        )}
                      </div>
                    ))}
                    <div className="border-t border-white/8 pt-3 mt-2 space-y-1">
                      {selected.subTotal != null && (
                        <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>₹{selected.subTotal?.toFixed(2)}</span></div>
                      )}
                      {selected.deliveryFee != null && (
                        <div className="flex justify-between text-xs text-gray-500"><span>Delivery Fee</span><span>{selected.deliveryFee === 0 ? "FREE" : `₹${selected.deliveryFee?.toFixed(2)}`}</span></div>
                      )}
                      {selected.tax != null && (
                        <div className="flex justify-between text-xs text-gray-500"><span>Tax</span><span>₹{selected.tax?.toFixed(2)}</span></div>
                      )}
                      <div className="flex justify-between font-black text-white text-base border-t border-white/8 pt-2 mt-1 border-white/8">
                        <span>Total</span>
                        <span className="text-primary">₹{selected.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Update Buttons */}
                <div>
                  <p className="text-sm font-black text-gray-400 mb-3">Update Status</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY,
                      ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED,
                    ].map(s => (
                      <button key={s} onClick={() => handleStatusUpdate(selected._id, s)}
                        disabled={updating || selected.status === s}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all disabled:opacity-40 ${
                          selected.status === s
                            ? "bg-primary text-black"
                            : "bg-white/8 text-gray-400 hover:bg-white/15"
                        }`}>
                        {updating && selected.status !== s ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : s.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
