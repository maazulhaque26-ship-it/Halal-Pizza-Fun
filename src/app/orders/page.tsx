"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Receipt, Clock, ChevronRight, CheckCircle, Package, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ORDER_STATUS } from "@/config/constants";

interface OrderItem {
  productId?: { name: string; image?: string };
  quantity: number;
  price: number;
  selectedAddons?: { name: string; price: number }[];
}

interface Order {
  _id: string;
  orderId: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  branchId?: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  ACCEPTED: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  PREPARING: "bg-violet-400/10 text-violet-400 border-violet-400/20",
  READY: "bg-teal-400/10 text-teal-400 border-teal-400/20",
  OUT_FOR_DELIVERY: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  DELIVERED: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  CANCELLED: "bg-red-400/10 text-red-400 border-red-400/20",
  REJECTED: "bg-rose-400/10 text-rose-400 border-rose-400/20",
};

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?limit=50");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/auth/login?callbackUrl=/orders";
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session]);


  if (status === "loading" || (loading && status === "authenticated")) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" /> My Orders
          </h1>
          <p className="text-white/50 font-medium">
            View your order history and track active orders.
          </p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-12 text-center"
            style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="w-24 h-24 bg-background/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">No orders yet</h2>
            <p className="text-white/50 mb-8 max-w-sm mx-auto">
              Looks like you haven't placed any orders yet. Discover our delicious menu and place your first order!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-primary text-black px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Explore Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-3xl p-6 md:p-8 transition-all duration-300 group relative overflow-hidden"
                style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.25)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-background/5 group-hover:bg-primary transition-colors" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Order Header Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-black text-white text-lg">#{order.orderId}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${STATUS_COLORS[order.status] || STATUS_COLORS.PENDING}`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-white/40 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                      {order.branchId && (
                        <span className="hidden sm:inline-flex items-center gap-1">
                          • {order.branchId.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Total & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-0 border-white/8 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Total</p>
                      <p className="text-xl font-black text-primary">₹{order.total.toFixed(2)}</p>
                    </div>
                    
                    <Link
                      href={`/orders/${order.orderId}`}
                      className="flex items-center justify-center w-12 h-12 rounded-2xl bg-background/5 text-white/50 hover:bg-primary hover:text-black transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <p className="text-sm font-medium text-white/50 truncate">
                    {order.items.map(item => `${item.quantity}x ${item.productId?.name || 'Item'}`).join(', ')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
