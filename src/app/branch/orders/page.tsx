"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Search, Copy, Check, X, MapPin, Phone,
  Package, Loader2, ArrowRightLeft, Store, AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getSocket, connectSocket } from "@/lib/socket";
import { toast } from "@/components/ui/Toast";
import { API, ORDER_STATUS, ROUTES } from "@/config/constants";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  PENDING:          { color: "text-amber-400",   bg: "bg-amber-400/10" },
  ACCEPTED:         { color: "text-blue-400",    bg: "bg-blue-400/10" },
  PREPARING:        { color: "text-violet-400",  bg: "bg-violet-400/10" },
  READY:            { color: "text-green-400",   bg: "bg-green-400/10" },
  OUT_FOR_DELIVERY: { color: "text-cyan-400",    bg: "bg-cyan-400/10" },
  DELIVERED:        { color: "text-emerald-400", bg: "bg-emerald-400/10" },
  CANCELLED:        { color: "text-red-400",     bg: "bg-red-400/10" },
  TRANSFERRED:      { color: "text-purple-400",  bg: "bg-purple-400/10" },
  REFUNDED:         { color: "text-rose-400",    bg: "bg-rose-400/10" },
};

const ACTIONABLE_STATUSES = [
  ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY, ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED,
];

interface DeliveryAddress {
  fullName?: string; phone?: string; alternatePhone?: string;
  houseNumber?: string; floor?: string; street?: string;
  landmark?: string; city?: string; state?: string;
  pincode?: string; zip?: string; deliveryInstructions?: string;
}
interface Order {
  _id: string; orderId: string; status: string; total: number;
  subTotal?: number; tax?: number; deliveryFee?: number;
  paymentMethod?: string; paymentStatus?: string; createdAt: string;
  specialInstructions?: string; currentTransferCount?: number; transferCount?: number;
  customerId?: { name: string; email: string; phone?: string };
  branchId?: { _id: string; name: string };
  deliveryAddress?: DeliveryAddress;
  items: { productId?: { name: string }; quantity: number; price: number; selectedAddons?: { name: string; price: number }[] }[];
}

function buildAddressText(order: Order) {
  const a = order.deliveryAddress;
  if (!a) return "";
  return [
    a.fullName && `Name: ${a.fullName}`,
    a.phone && `Phone: ${a.phone}${a.alternatePhone ? ` / ${a.alternatePhone}` : ""}`,
    a.houseNumber && `Address: ${a.houseNumber}${a.floor ? `, Floor ${a.floor}` : ""}, ${a.street || ""}`,
    a.landmark && `Landmark: ${a.landmark}`,
    `${a.city || ""}, ${a.state || ""} - ${a.pincode || a.zip || ""}`,
    a.deliveryInstructions && `Note: ${a.deliveryInstructions}`,
    `Order: ${order.orderId} | ₹${order.total?.toFixed(2)} (${order.paymentMethod || ""})`,
  ].filter(Boolean).join("\n");
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-background border border-white/10 hover:bg-background text-xs font-bold text-white/60 transition-all">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function BranchOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [branches, setBranches] = useState<{ _id: string; name: string }[]>([]);
  const [transferBranchId, setTransferBranchId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferring, setTransferring] = useState(false);

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

  // Load other branches for transfer
  useEffect(() => {
    fetch(API.BRANCHES).then(r => r.json()).then(d => {
      if (d.success) {
        const myBranchId = (session?.user as any)?.branchId;
        setBranches(d.data.filter((b: any) => b._id !== myBranchId && b.isActive !== false));
      }
    }).catch(() => {});
  }, [session]);

  // Real-time socket
  useEffect(() => {
    if (!session?.user) return;
    const socket = getSocket();
    const branchId = (session.user as any).branchId;

    const refresh = () => fetchOrders();
    const onNew = () => { toast.info("🔔 New order received!"); fetchOrders(); };

    connectSocket(); // JWT-authenticated connect; server auto-joins branch room on connect

    socket.on("NEW_ORDER", onNew);
    socket.on("ORDER_STATUS_CHANGED", refresh);
    return () => { socket.off("NEW_ORDER", onNew); socket.off("ORDER_STATUS_CHANGED", refresh); };
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
      if (d.success) { toast.success(`Status → ${newStatus}`); setSelected(null); fetchOrders(); }
      else toast.error(d.message);
    } catch { toast.error("Update failed"); }
    finally { setUpdating(false); }
  };

  const handleTransfer = async () => {
    if (!selected || !transferBranchId || !transferReason.trim()) {
      toast.error("Please select a branch and enter a reason."); return;
    }
    setTransferring(true);
    try {
      const res = await fetch(`/api/orders/${selected._id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toBranchId: transferBranchId, reason: transferReason }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success("Order transferred successfully.");
        setShowTransfer(false); setSelected(null);
        setTransferBranchId(""); setTransferReason("");
        fetchOrders();
      } else toast.error(d.message || "Transfer failed.");
    } catch { toast.error("Transfer failed."); }
    finally { setTransferring(false); }
  };

  const STATUS_TABS = ["ALL", "PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

  const filtered = orders.filter(o =>
    (statusFilter === "ALL" || o.status === statusFilter) &&
    (!search ||
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      (o.deliveryAddress?.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.deliveryAddress?.phone || "").includes(search))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-white">Live Orders</h2>
          <p className="text-white/40 mt-0.5">{filtered.length} orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-background border border-white/10 rounded-xl text-sm font-bold text-white/70 hover:bg-background transition-colors shrink-0 ml-3">
          <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, name or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
                statusFilter === s ? "bg-primary text-black" : "bg-background border border-white/10 text-white/60 hover:border-primary/40"
              }`}>
              {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-background/8 rounded-2xl animate-pulse" />)}</div>
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
                className="bg-background rounded-2xl border border-white/8 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-white text-sm">{order.orderId}</p>
                    <p className="text-xs text-white/40 mt-0.5">{order.deliveryAddress?.fullName || (order.customerId as any)?.name || "Guest"}</p>
                    {order.deliveryAddress?.phone && (
                      <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {order.deliveryAddress.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${cfg.bg} ${cfg.color}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <p className="text-xs text-white/50 mt-1">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <p className="font-black text-white">₹{order.total?.toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      <AnimatePresence>
        {selected && !showTransfer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full h-full sm:h-auto bg-background sm:rounded-3xl rounded-none shadow-2xl sm:max-w-lg sm:max-h-[92vh] overflow-y-auto">

              {/* Header */}
              <div className="p-5 border-b border-white/8 sticky top-0 bg-background z-10 sm:rounded-t-3xl">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-black text-white">{selected.orderId}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_CONFIG[selected.status]?.bg} ${STATUS_CONFIG[selected.status]?.color}`}>
                      {selected.status.replace(/_/g, " ")}
                    </span>
                    <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-background/5"><X className="w-4 h-4 text-white/40" /></button>
                  </div>
                </div>
                <p className="text-xs text-white/40">{new Date(selected.createdAt).toLocaleString()} · {selected.paymentMethod} · {selected.paymentStatus}</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Delivery Address */}
                {selected.deliveryAddress && (
                  <div className="bg-blue-400/8 border border-blue-400/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <p className="text-xs font-black text-blue-400 uppercase tracking-wide">Delivery Address</p>
                      </div>
                      <CopyBtn text={buildAddressText(selected)} />
                    </div>
                    <div className="space-y-1 text-sm">
                      {selected.deliveryAddress.fullName && (
                        <p className="font-bold text-white/90">
                          {selected.deliveryAddress.fullName}
                          {selected.deliveryAddress.phone && (
                            <span className="font-normal text-white/40 ml-2">
                              📞 {selected.deliveryAddress.phone}
                              {selected.deliveryAddress.alternatePhone && ` / ${selected.deliveryAddress.alternatePhone}`}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-white/70">
                        {[selected.deliveryAddress.houseNumber, selected.deliveryAddress.floor ? `Floor ${selected.deliveryAddress.floor}` : null, selected.deliveryAddress.street].filter(Boolean).join(", ")}
                      </p>
                      {selected.deliveryAddress.landmark && <p className="text-xs text-white/40">📍 {selected.deliveryAddress.landmark}</p>}
                      <p className="font-semibold text-white/70">{selected.deliveryAddress.city}, {selected.deliveryAddress.state} — {selected.deliveryAddress.pincode || selected.deliveryAddress.zip}</p>
                      {selected.deliveryAddress.deliveryInstructions && (
                        <p className="text-xs text-amber-400 bg-amber-400/8 border border-amber-400/20 rounded-lg px-3 py-2 mt-1">📝 {selected.deliveryAddress.deliveryInstructions}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Special instructions */}
                {selected.specialInstructions && (
                  <div className="bg-amber-400/8 border border-amber-400/15 rounded-2xl p-3 text-sm text-amber-300">
                    <p className="text-xs font-black text-amber-600 uppercase mb-1">Special Instructions</p>
                    {selected.specialInstructions}
                  </div>
                )}

                {/* Items */}
                <div className="bg-background rounded-2xl p-4">
                  <p className="text-xs font-black text-white/40 uppercase tracking-wide mb-3">Items</p>
                  <div className="space-y-2">
                    {selected.items?.map((item: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-white/70">{item.productId?.name || "Item"} × {item.quantity}</span>
                          <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.selectedAddons?.length > 0 && (
                          <p className="text-xs text-white/50 mt-0.5">+ {item.selectedAddons.map((a: any) => a.name).join(", ")}</p>
                        )}
                      </div>
                    ))}
                    <div className="border-t border-white/10 pt-3 mt-2 space-y-1">
                      {selected.subTotal != null && <div className="flex justify-between text-xs text-white/40"><span>Subtotal</span><span>₹{selected.subTotal?.toFixed(2)}</span></div>}
                      {selected.deliveryFee != null && <div className="flex justify-between text-xs text-white/40"><span>Delivery</span><span>{selected.deliveryFee === 0 ? "FREE" : `₹${selected.deliveryFee?.toFixed(2)}`}</span></div>}
                      {selected.tax != null && <div className="flex justify-between text-xs text-white/40"><span>Tax</span><span>₹{selected.tax?.toFixed(2)}</span></div>}
                      <div className="flex justify-between font-black text-white text-base border-t border-white/8 pt-2">
                        <span>Total</span><span className="text-primary">₹{selected.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Buttons */}
                {!["DELIVERED", "CANCELLED", "TRANSFERRED", "REFUNDED"].includes(selected.status) && (
                  <div>
                    <p className="text-xs font-black text-white/40 uppercase tracking-wide mb-2">Update Status</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ACTIONABLE_STATUSES.map(s => (
                        <button key={s} onClick={() => handleStatusUpdate(selected._id, s)}
                          disabled={updating || selected.status === s}
                          className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase transition-all disabled:opacity-40 ${
                            selected.status === s ? "bg-primary text-black" : "bg-background/5 text-white/70 hover:bg-background/8"
                          }`}>
                          {updating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : s.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transfer Button */}
                {!["DELIVERED", "CANCELLED", "TRANSFERRED", "REFUNDED"].includes(selected.status) &&
                  (selected.currentTransferCount ?? 0) < (selected.transferCount ?? 2) && (
                  <button onClick={() => setShowTransfer(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-purple-400/40 text-purple-400 hover:bg-purple-400/10 font-bold text-sm transition-all">
                    <ArrowRightLeft className="w-4 h-4" /> Transfer Order to Another Branch
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Transfer Modal ── */}
      <AnimatePresence>
        {selected && showTransfer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowTransfer(false)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-md bg-background sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-white text-lg flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-purple-500" /> Transfer Order</h3>
                  <p className="text-xs text-white/40 mt-0.5">{selected.orderId}</p>
                </div>
                <button onClick={() => setShowTransfer(false)} className="p-2 rounded-xl hover:bg-background/5"><X className="w-4 h-4" /></button>
              </div>

              {(selected.currentTransferCount ?? 0) >= (selected.transferCount ?? 2) - 1 && (
                <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl p-3 mb-4 flex items-center gap-2 text-amber-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  This order is near its transfer limit ({selected.currentTransferCount ?? 0}/{selected.transferCount ?? 2}).
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-wide mb-2">Transfer To Branch</label>
                  {branches.length === 0 ? (
                    <p className="text-sm text-white/50 bg-background rounded-xl p-3">No other active branches available.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {branches.map(b => (
                        <button key={b._id} onClick={() => setTransferBranchId(b._id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            transferBranchId === b._id ? "border-purple-400/60 bg-purple-400/10" : "border-white/8 hover:border-white/10"
                          }`}>
                          <Store className={`w-4 h-4 ${transferBranchId === b._id ? "text-purple-500" : "text-white/50"}`} />
                          <span className="font-semibold text-sm text-white/90">{b.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-wide mb-2">Reason for Transfer</label>
                  <textarea
                    value={transferReason}
                    onChange={e => setTransferReason(e.target.value)}
                    rows={3}
                    placeholder="e.g., Branch is at full capacity, items unavailable..."
                    className="w-full px-4 py-3 bg-background border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 resize-none"
                  />
                </div>

                <button onClick={handleTransfer} disabled={transferring || !transferBranchId || !transferReason.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                  {transferring ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
