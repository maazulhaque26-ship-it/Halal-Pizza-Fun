"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Check, X, Trash2, Loader2, MessageSquareQuote } from "lucide-react";
import { toast } from "@/components/ui/Toast";

interface Review {
  _id: string;
  guestName?: string;
  guestAvatar?: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews?all=true");
      const data = await res.json();
      if (data.success) setReviews(data.data || []);
      else toast.error("Failed to load reviews");
    } catch { toast.error("Failed to load reviews"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setActionId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Review ${status}`);
        setReviews(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      } else toast.error(data.error || "Update failed");
    } catch { toast.error("Update failed"); }
    finally { setActionId(null); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Review deleted");
        setReviews(prev => prev.filter(r => r._id !== id));
      } else toast.error(data.error || "Delete failed");
    } catch { toast.error("Delete failed"); }
    finally { setActionId(null); }
  };

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter);

  const counts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved").length,
    rejected: reviews.filter(r => r.status === "rejected").length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageSquareQuote className="w-6 h-6 text-primary" /> Reviews Management
          </h2>
          <p className="text-gray-400 mt-1 text-sm">{reviews.length} total reviews</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {(["all", "pending", "approved", "rejected"] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filter === tab
                ? "bg-primary text-black shadow-lg shadow-primary/25"
                : "bg-white/5 border border-white/10 text-white/60 hover:border-primary/30"
            }`}>
            {tab}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === tab ? "bg-black/20" : "bg-white/10"}`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <MessageSquareQuote className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-bold">No {filter === "all" ? "" : filter} reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rev, i) => (
            <motion.div key={rev._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-5 transition-all"
              style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 shrink-0">
                  {rev.guestAvatar ? (
                    <img src={rev.guestAvatar} alt={rev.guestName || "Guest"} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-black text-sm">{(rev.guestName || "A")[0].toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-white text-sm">{rev.guestName || "Anonymous Foodie"}</p>
                    <p className="text-xs text-gray-500">{new Date(rev.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? "fill-primary text-primary" : "text-white/20"}`} />
                    ))}
                    <span className="ml-1 text-xs font-bold text-primary">{rev.rating}.0</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed italic">"{rev.comment}"</p>
                </div>

                {/* Status + Actions */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                    rev.status === "approved" ? "bg-emerald-400/10 text-emerald-400" :
                    rev.status === "pending" ? "bg-amber-400/10 text-amber-400" :
                    "bg-red-400/10 text-red-400"
                  }`}>
                    {rev.status}
                  </span>
                  <div className="flex items-center gap-2">
                    {rev.status !== "approved" && (
                      <button onClick={() => updateStatus(rev._id, "approved")} disabled={actionId === rev._id}
                        title="Approve" className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors disabled:opacity-50">
                        {actionId === rev._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                    )}
                    {rev.status !== "rejected" && (
                      <button onClick={() => updateStatus(rev._id, "rejected")} disabled={actionId === rev._id}
                        title="Reject" className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl transition-colors disabled:opacity-50">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => deleteReview(rev._id)} disabled={actionId === rev._id}
                      title="Delete" className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
