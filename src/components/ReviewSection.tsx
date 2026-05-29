"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Upload, Loader2, CheckCircle2, UserPlus, Send, Quote } from "lucide-react";
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
  const [showForm, setShowForm] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestAvatar, setGuestAvatar] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data && data.data.length > 0 ? data.data : FALLBACK_REVIEWS);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
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
        toast.success("Thank you! Your review is now live.");
        setReviews((prev) => [data.data, ...prev]);
        setGuestName("");
        setGuestAvatar("");
        setRating(5);
        setComment("");
        setShowForm(false);
        setTimeout(() => fetchReviews(), 1500);
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
    <section className="relative overflow-hidden bg-[#fff4e4] px-4 py-18 sm:px-6 md:py-24">
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.82fr_1fr] lg:items-end">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a7471b]">
              Guest notes
            </span>
            <h2 className="mt-3 font-playfair text-4xl font-black leading-tight text-[#2b160c] sm:text-5xl">
              Reviews that feel written at the table.
            </h2>
          </div>
          <div className="lg:pl-10">
            <p className="max-w-2xl text-sm font-medium leading-7 text-[#6c4d39] sm:text-base">
              Little notes from people who came hungry, ordered their favorites, and remembered the first bite.
            </p>
            <button
              onClick={() => setShowForm(!showForm)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2b160c] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#fff8ee] shadow-sm transition hover:-translate-y-0.5"
            >
              <UserPlus className="h-4 w-4 text-[#ffb44a]" />
              {showForm ? "Close Guestbook" : "Leave a Review"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -12 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="mb-10 overflow-hidden"
            >
              <form onSubmit={handleSubmitReview} className="rounded-[28px] border border-[#ead8c1] bg-[#fffaf2] p-5 shadow-[0_20px_60px_rgba(73,40,18,0.1)] sm:p-7">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#a7471b]">Your Name</span>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full rounded-2xl border border-[#ead8c1] bg-white px-4 py-3 text-sm font-semibold text-[#2b160c] outline-none transition focus:border-[#ef5a24]/55"
                    />
                  </label>

                  <div>
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#a7471b]">Rating</span>
                    <div className="flex h-[46px] items-center justify-between rounded-2xl border border-[#ead8c1] bg-white px-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setRating(star)} className="p-0.5">
                            <Star className={`h-5 w-5 ${star <= rating ? "fill-[#ffb44a] text-[#ffb44a]" : "text-[#d6c5ae]"}`} />
                          </button>
                        ))}
                      </div>
                      <span className="text-sm font-black text-[#2b160c]">{rating}.0</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#ead8c1] bg-white p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#fff0dd]">
                      {guestAvatar ? (
                        <Image src={guestAvatar} alt="Avatar" width={56} height={56} className="h-full w-full object-cover" />
                      ) : (
                        <Upload className="h-5 w-5 text-[#a7471b]" />
                      )}
                    </div>
                    <div>
                      <input id="guest-avatar-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <label htmlFor="guest-avatar-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#ef5a24]/25 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#c94618]">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploading ? "Uploading" : "Choose Photo"}
                      </label>
                    </div>
                  </div>
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#a7471b]">Your Review</span>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the taste, delivery speed, and your overall experience..."
                    className="w-full resize-none rounded-2xl border border-[#ead8c1] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2b160c] outline-none transition focus:border-[#ef5a24]/55"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ef5a24] px-5 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_6px_0_#9b3214] transition hover:translate-y-[2px] hover:bg-[#dc4818] hover:shadow-[0_3px_0_#9b3214] disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? "Publishing" : "Publish Review"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {reviews.map((rev, index) => {
            const authorName = rev.guestName || rev.user?.name || "Anonymous Foodie";
            const authorAvatar = rev.guestAvatar || rev.user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200";
            const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Just now";
            const tilt = index % 3 === 0 ? "-rotate-1" : index % 3 === 1 ? "rotate-1" : "";

            return (
              <motion.article
                key={rev._id || index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className={`group relative flex min-h-[300px] flex-col rounded-[28px] border border-[#ead8c1] bg-[#fffaf2] p-6 shadow-[0_18px_46px_rgba(73,40,18,0.08)] transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:border-[#ef5a24]/35 ${tilt}`}
              >
                <Quote className="absolute right-5 top-5 h-12 w-12 text-[#ef5a24]/10" />
                <div className="mb-5 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-4 w-4 ${star <= rev.rating ? "fill-[#ffb44a] text-[#ffb44a]" : "text-[#d6c5ae]"}`} />
                  ))}
                </div>
                <p className="relative z-10 flex-1 font-playfair text-xl font-semibold leading-8 text-[#3a2114]">
                  "{rev.comment}"
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-[#ead8c1] pt-4">
                  <img src={authorAvatar} alt={authorName} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-black text-[#2b160c]">{authorName}</h4>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#8f6b52]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16724f]" />
                      Verified Guest | {dateStr}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
