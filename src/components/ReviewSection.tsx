"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquareQuote, Upload, Loader2, CheckCircle2, UserPlus, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/Toast";

interface Review {
  _id: string;
  guestName?: string;
  guestAvatar?: string;
  user?: {
    name: string;
    image?: string;
  };
  rating: number;
  comment: string;
  createdAt?: string;
}

const FALLBACK_REVIEWS: Review[] = [
  {
    _id: "fb-1",
    guestName: "Sarah Jenkins",
    guestAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    comment: "Absolutely the best pizza and garlic bread in the city! The crust is perfectly crispy on the outside and incredibly fluffy inside. Quick delivery too!",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: "fb-2",
    guestName: "David Chen",
    guestAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    comment: "The gourmet burgers are a masterpiece. Fresh ingredients, juicy patties, and their secret sauce is out of this world. Highly recommended!",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    _id: "fb-3",
    guestName: "Elena Rostova",
    guestAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    comment: "Exquisite Italian pasta! Tastes exactly like the authentic trattorias in Rome. Will definitely be ordering for our family dinners every weekend.",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export default function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [guestName, setGuestName] = useState("");
  const [guestAvatar, setGuestAvatar] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setGuestAvatar(data.url);
        toast.success("Profile photo uploaded successfully!");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please enter a review comment");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim() || "Anonymous Foodie",
          guestAvatar,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Thank you for your review!");
        setReviews([data.data, ...reviews]);
        setGuestName("");
        setGuestAvatar("");
        setRating(5);
        setComment("");
        setShowForm(false);
      } else {
        throw new Error(data.error || "Failed to submit review");
      }
    } catch (err: any) {
      toast.error(err.message || "Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-[#070f20] via-background to-[#070f20]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04),transparent_55%)]" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-tag mb-4 inline-flex">
                <Sparkles className="w-3 h-3" />
                Guest Experiences
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight"
            >
              Loved by <em className="text-gradient not-italic">Our Guests</em>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white/45 text-base max-w-2xl"
            >
              Discover what our wonderful patrons say about our culinary dishes, hospitality, and swift delivery service.
            </motion.p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm self-start md:self-auto transition-all duration-300 shrink-0"
            style={{
              background: showForm ? "rgba(212,175,55,0.15)" : "linear-gradient(135deg, #D4AF37, #C5A028)",
              color: showForm ? "#D4AF37" : "#000",
              border: showForm ? "1px solid rgba(212,175,55,0.3)" : "none",
              boxShadow: "0 8px 20px rgba(212,175,55,0.25)",
            }}
          >
            <UserPlus className="w-4 h-4" />
            {showForm ? "Close Review Form" : "Write a Review"}
          </motion.button>
        </div>

        {/* Expandable Review Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="mb-16 overflow-hidden"
            >
              <form
                onSubmit={handleSubmitReview}
                className="relative max-w-3xl mx-auto rounded-3xl p-8 md:p-10 overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, rgba(13,24,41,0.95), rgba(10,18,35,0.98))",
                  border: "1px solid rgba(212,175,55,0.15)",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.06)",
                }}
              >
                {/* Top border glow */}
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px]" />

                <h3 className="text-2xl font-black text-white mb-6 relative z-10">
                  Share Your Experience
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-10">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Your Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/25 text-sm font-medium transition-all focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                  </div>

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Rating</label>
                    <div
                      className="flex items-center justify-between h-11.5 rounded-xl px-4"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            className="focus:outline-none p-0.5 transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star className={`w-5 h-5 ${star <= rating ? "fill-primary text-primary" : "text-white/20"}`} />
                          </button>
                        ))}
                      </div>
                      <span className="font-black text-white text-sm">{rating}.0 / 5.0</span>
                    </div>
                  </div>
                </div>

                {/* Profile Image Uploader */}
                <div className="mb-6 relative z-10">
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Profile Photo (Optional)</label>
                  <div
                    className="flex items-center gap-5 rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
                      style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}
                    >
                      {guestAvatar ? (
                        <Image src={guestAvatar} alt="Avatar" width={56} height={56} className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-5 h-5 text-primary/40" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        id="guest-avatar-upload"
                        className="hidden"
                      />
                      <label
                        htmlFor="guest-avatar-upload"
                        className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer px-4 py-2.5 rounded-xl transition-all"
                        style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37" }}
                      >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploading ? "Uploading..." : "Choose Photo"}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Comment Input */}
                <div className="mb-7 relative z-10">
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Your Review</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the taste of the food, delivery speed, and your overall experience..."
                    className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/25 text-sm font-medium transition-all focus:outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-60 relative z-10"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #C5A028)",
                    color: "#000",
                    boxShadow: "0 8px 24px rgba(212,175,55,0.35)",
                  }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? "Publishing Review..." : "Publish My Review"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((rev, index) => {
            const authorName = rev.guestName || rev.user?.name || "Anonymous Foodie";
            const authorAvatar = rev.guestAvatar || rev.user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200";
            const dateStr = rev.createdAt ? (() => {
              const date = new Date(rev.createdAt);
              return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            })() : "Just now";

            return (
              <motion.div
                key={rev._id || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
                className="group relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-500 overflow-hidden card-hover"
                style={{
                  background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.3)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 25px 50px rgba(0,0,0,0.4), 0 0 30px rgba(212,175,55,0.08)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                {/* Top border glow */}
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />

                {/* Decorative quote icon */}
                <MessageSquareQuote className="absolute top-5 right-5 w-20 h-20 text-white/2.5 -rotate-12 group-hover:scale-110 transition-transform duration-500" />

                <div className="relative z-10">
                  {/* Star rating badge */}
                  <div
                    className="flex items-center gap-1 mb-5 w-fit px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${star <= rev.rating ? "fill-primary text-primary" : "text-white/20"}`}
                      />
                    ))}
                    <span className="ml-1 text-xs font-black text-primary">{rev.rating}.0</span>
                  </div>

                  <p className="text-white/65 text-sm leading-relaxed mb-7 italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                <div
                  className="flex items-center gap-3 pt-5 relative z-10"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0"
                    style={{ border: "1px solid rgba(212,175,55,0.2)" }}
                  >
                    <Image src={authorAvatar} alt={authorName} width={44} height={44} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm leading-tight mb-0.5 group-hover:text-primary transition-colors truncate">
                      {authorName}
                    </h4>
                    <p className="text-[11px] text-white/35 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      Verified Guest &bull; {dateStr}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
