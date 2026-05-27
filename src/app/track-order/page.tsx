"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/Toast";

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = orderId.trim();
    if (!cleaned) {
      toast.error("Please enter an order ID");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      if (data.success && data.data?._id) {
        router.push(`/orders/${data.data._id}`);
      } else if (res.status === 401) {
        toast.error("Please sign in to track your order");
        router.push(`/auth/login?from=/orders/${encodeURIComponent(cleaned)}`);
      } else {
        toast.error(data.message || "Order not found. Check the ID and try again.");
      }
    } catch {
      toast.error("Could not check that order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Track Your Order
        </h1>
        <p className="text-white/40 mb-8">
          Enter your order ID (e.g. <code className="text-primary">ORD-1734567890-a1b2</code>) to see live updates.
        </p>

        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ORD-…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full pl-11 pr-4 py-3 bg-background border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-black font-bold px-8 py-3 rounded-xl hover:bg-accent transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
          </button>
        </form>

        <p className="text-xs text-white/30 mt-6">
          Lost your order ID? Visit{" "}
          <a href="/orders" className="text-primary font-bold hover:text-accent">
            My Orders
          </a>{" "}
          to see all your past orders.
        </p>
      </div>
      <Footer />
    </main>
  );
}
