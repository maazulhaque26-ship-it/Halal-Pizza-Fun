"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Star, Loader2, Send, MessageSquare, ThumbsUp } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API } from "@/config/constants";

interface Review {
  _id: string;
  user?: { name: string; image?: string };
  guestName?: string;
  guestAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: string;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`transition-transform ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= (hovered || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-white/20"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });

  useEffect(() => {
    fetch(API.SETTINGS, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setSettings(d.data); })
      .catch(console.error);
  }, []);

  const fetchReviews = () => {
    setLoading(true);
    fetch(API.SETTINGS.replace("settings", "reviews"), { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setReviews(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.comment.trim()) { toast.error("Please write a comment."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: form.name || "Anonymous Foodie",
          rating: form.rating,
          comment: form.comment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Thank you for your review!");
        setForm({ name: "", rating: 5, comment: "" });
        setShowForm(false);
        fetchReviews();
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <main className="min-h-screen bg-background text-white font-sans selection:bg-yellow-400/30">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(212,175,55,0.15),transparent)]">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <span className="text-yellow-400 font-black tracking-widest text-xs uppercase px-3 py-1 bg-yellow-400/10 rounded-full border border-yellow-400/20">
            {settings?.reviewsPage?.heroTag || "CUSTOMER REVIEWS"}
          </span>
          <h1 className="text-5xl md:text-7xl font-black mt-6 mb-6 tracking-tight leading-none text-white">
            {settings?.reviewsPage?.heroTitle || "What Our Customers Say"}
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto mb-8">
            {settings?.reviewsPage?.heroSubtitle || "Real reviews from real customers — unfiltered, unedited, and straight from the heart."}
          </p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-yellow-400/20 text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            {showForm ? "Cancel" : "Write a Review"}
          </button>
        </div>
      </section>

      {/* Submit Form */}
      {showForm && (
        <section className="max-w-2xl mx-auto px-6 pb-12">
          <div className="relative backdrop-blur-xl rounded-3xl p-8 shadow-2xl" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="absolute inset-0 bg-yellow-400/5 blur-3xl rounded-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-yellow-400" /> Share Your Experience
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Your Name (optional)</label>
                  <input
                    type="text"
                    placeholder="Anonymous Foodie"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 transition-colors text-sm placeholder:text-white/25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Rating *</label>
                  <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Your Review *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your experience..."
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 transition-colors text-sm resize-none placeholder:text-white/25"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-xl transition-all disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      {reviews.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <div className="rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Average */}
            <div className="text-center md:text-left">
              <p className="text-7xl font-black text-yellow-400">{avgRating}</p>
              <StarRating value={Math.round(Number(avgRating))} />
              <p className="text-white/50 text-sm mt-2">{reviews.length} customer review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
            {/* Breakdown */}
            <div className="space-y-2.5">
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white/50 w-3">{star}</span>
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                  <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-700"
                      style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs text-white/30 w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <ThumbsUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">No reviews yet</p>
            <p className="text-sm mt-1">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => {
              const name = review.user?.name || review.guestName || "Anonymous Foodie";
              const avatar = review.user?.image || review.guestAvatar;
              const initial = name.charAt(0).toUpperCase();
              const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              });
              return (
                <div
                  key={review._id}
                  className="group relative rounded-3xl p-6 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(234,179,8,0.3)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-yellow-400/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/15"}`} />
                    ))}
                  </div>
                  {/* Comment */}
                  <p className="text-white/80 italic text-sm leading-relaxed mb-5">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-black text-sm">
                        {initial}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-bold text-sm">{name}</p>
                      <p className="text-white/30 text-xs">{date}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
