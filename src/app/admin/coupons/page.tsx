"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Tag, Trash2, ToggleLeft, ToggleRight,
  Pencil, Check, X, Copy, AlertCircle, Ticket
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API } from "@/config/constants";

interface Coupon {
  _id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

const EMPTY_FORM = {
  code: "",
  discountType: "PERCENTAGE" as const,
  discountValue: 10,
  minOrderValue: 0,
  maxUses: 100,
  expiresAt: "",
};

const inputCls = "w-full px-4 py-3 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 transition-all text-sm";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCoupons = () => {
    setLoading(true);
    fetch(`${API.COUPONS}?all=true`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCoupons(d.data); })
      .catch(() => toast.error("Failed to load coupons"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.expiresAt) {
      toast.error("Code and expiry date are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(API.COUPONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code: form.code.toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Coupon created!");
        setForm({ ...EMPTY_FORM });
        setShowForm(false);
        fetchCoupons();
      } else {
        toast.error(data.message || "Failed to create coupon");
      }
    } catch {
      toast.error("Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon._id);
    try {
      const res = await fetch(`${API.COUPONS}/${coupon._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${data.data.isActive ? "activated" : "deactivated"}`);
        fetchCoupons();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update coupon");
    } finally {
      setTogglingId(null);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon permanently?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API.COUPONS}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Coupon deleted");
        fetchCoupons();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Coupon Codes</h2>
          <p className="text-gray-400 mt-1 text-sm">Manage discount codes that appear on the Offers page</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-primary text-black px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Coupon"}
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-3xl overflow-hidden mb-6" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8 bg-[#0f172a]">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <Ticket className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-black text-white">Create New Coupon</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Coupon Code *</label>
                <input
                  className={inputCls}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Discount Type *</label>
                <select
                  className={inputCls}
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Discount Value {form.discountType === "PERCENTAGE" ? "(%)" : "(₹)"} *
                </label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Min. Order Value (₹)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Max Uses</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Expiry Date *</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary text-black px-7 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? "Creating…" : "Create Coupon"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupons List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-24 text-white/50">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No coupons yet</p>
          <p className="text-sm mt-1">Create your first coupon above — it will appear on the public Offers page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const expired = isExpired(coupon.expiresAt);
            const expiryDate = new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            });
            const usedPct = coupon.maxUses > 0 ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100) : 0;

            return (
              <motion.div
                key={coupon._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all"
                style={{
                  background: expired ? "rgba(239,68,68,0.04)" : "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))",
                  border: expired ? "1px solid rgba(239,68,68,0.2)" : coupon.isActive ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Code + Type */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-mono font-black text-lg text-white bg-white/5 px-3 py-1 rounded-lg tracking-widest cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => copyCode(coupon.code)}
                      title="Click to copy"
                    >
                      {coupon.code}
                    </span>
                    <button onClick={() => copyCode(coupon.code)} className="text-white/50 hover:text-primary transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {expired && (
                      <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full uppercase">Expired</span>
                    )}
                    {!coupon.isActive && !expired && (
                      <span className="text-[10px] font-black text-white/40 bg-white/8 px-2 py-0.5 rounded-full uppercase">Inactive</span>
                    )}
                    {coupon.isActive && !expired && (
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                    <span className="font-semibold text-gray-300">
                      {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} off
                    </span>
                    <span>Min. ₹{coupon.minOrderValue}</span>
                    <span>Expires: {expiryDate}</span>
                  </div>
                  {/* Usage bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">
                      {coupon.usedCount} / {coupon.maxUses} used
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(coupon)}
                    disabled={togglingId === coupon._id || expired}
                    title={coupon.isActive ? "Deactivate" : "Activate"}
                    className={`p-2 rounded-xl border transition-colors disabled:opacity-50 ${
                      coupon.isActive
                        ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-400 hover:bg-emerald-400/15"
                        : "border-white/10 bg-background text-white/50 hover:bg-white/5"
                    }`}
                  >
                    {togglingId === coupon._id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : coupon.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteCoupon(coupon._id)}
                    disabled={deletingId === coupon._id}
                    title="Delete coupon"
                    className="p-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {deletingId === coupon._id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
