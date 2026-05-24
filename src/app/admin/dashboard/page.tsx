"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  ShoppingBag, Store, Users, TrendingUp, Clock,
  CheckCircle, XCircle, AlertCircle, ArrowUpRight, RefreshCw,
  Activity, Zap, Package,
} from "lucide-react";
import Link from "next/link";
import { ROUTES, ORDER_STATUS, API } from "@/config/constants";

interface DashStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeBranches: number;
  totalCustomers: number;
  todayOrders: number;
}

interface RecentOrder {
  _id: string;
  orderId: string;
  status: string;
  total: number;
  createdAt: string;
  customerId?: { name: string; email: string };
  branchId?: { name: string };
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
  PENDING:          { color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20",   icon: Clock },
  ACCEPTED:         { color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20",    icon: CheckCircle },
  PREPARING:        { color: "text-violet-400",  bg: "bg-violet-400/10",  border: "border-violet-400/20",  icon: RefreshCw },
  PACKED:           { color: "text-indigo-400",  bg: "bg-indigo-400/10",  border: "border-indigo-400/20",  icon: Package },
  DELIVERED:        { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: CheckCircle },
  CANCELLED:        { color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20",     icon: XCircle },
  REJECTED:         { color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20",     icon: XCircle },
  OUT_FOR_DELIVERY: { color: "text-cyan-400",    bg: "bg-cyan-400/10",    border: "border-cyan-400/20",    icon: TrendingUp },
  READY:            { color: "text-green-400",   bg: "bg-green-400/10",   border: "border-green-400/20",   icon: AlertCircle },
};

// Animated counter component
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    });

    const unsubscribe = rounded.on("change", (v) => {
      setDisplay(v.toLocaleString());
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionValue, rounded]);

  return (
    <span>
      {prefix}{display}{suffix}
    </span>
  );
}

// Stat Card
function StatCard({
  label, value, icon: Icon, color, bg, border, trend, prefix, suffix, delay,
}: {
  label: string;
  value: number;
  icon: typeof ShoppingBag;
  color: string;
  bg: string;
  border: string;
  trend?: string | null;
  prefix?: string;
  suffix?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative overflow-hidden rounded-2xl border ${border} p-6 group hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300`}
      style={{ background: "#111827" }}
    >
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${bg} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity -translate-y-8 translate-x-8`} />

      <div className="relative z-10">
        <div className={`${bg} ${color} w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${border}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">{label}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-3xl font-black text-gray-100">
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          </h3>
          {trend && (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3" /> {trend}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashStats>({
    totalOrders: 0, pendingOrders: 0, totalRevenue: 0,
    activeBranches: 0, totalCustomers: 0, todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [ordersRes, branchesRes, usersRes] = await Promise.all([
          fetch(`${API.ORDERS}?limit=5`),
          fetch(API.BRANCHES),
          fetch(API.USERS),
        ]);

        const ordersData = await ordersRes.json();
        const branchesData = await branchesRes.json();
        const usersData = await usersRes.json();

        if (ordersData.success) {
          setRecentOrders(ordersData.data || []);
          const orders = ordersData.allData || ordersData.data || [];
          const today = new Date().toDateString();
          setStats((prev) => ({
            ...prev,
            totalOrders: ordersData.total || orders.length,
            pendingOrders: orders.filter((o: any) => o.status === ORDER_STATUS.PENDING).length,
            totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
            todayOrders: orders.filter((o: any) => new Date(o.createdAt).toDateString() === today).length,
          }));
        }
        if (branchesData.success) {
          setStats((prev) => ({ ...prev, activeBranches: branchesData.data?.filter((b: any) => b.isActive).length || 0 }));
        }
        if (usersData.success) {
          setStats((prev) => ({ ...prev, totalCustomers: usersData.total || 0 }));
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = [
    { label: "Total Orders",    value: stats.totalOrders,   icon: ShoppingBag, color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/15",    trend: "+12%",  prefix: "",  suffix: "", delay: 0 },
    { label: "Pending Orders",  value: stats.pendingOrders, icon: Clock,       color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/15",   trend: null,    prefix: "",  suffix: "", delay: 0.05 },
    { label: "Active Branches", value: stats.activeBranches,icon: Store,       color: "text-violet-400",  bg: "bg-violet-400/10",  border: "border-violet-400/15",  trend: null,    prefix: "",  suffix: "", delay: 0.1 },
    { label: "Monthly Revenue", value: stats.totalRevenue,  icon: TrendingUp,  color: "text-primary",     bg: "bg-primary/10",     border: "border-primary/15",     trend: "+8%",   prefix: "₹", suffix: "", delay: 0.15 },
    { label: "Total Customers", value: stats.totalCustomers,icon: Users,       color: "text-cyan-400",    bg: "bg-cyan-400/10",    border: "border-cyan-400/15",    trend: "+24%",  prefix: "",  suffix: "", delay: 0.2 },
    { label: "Today's Orders",  value: stats.todayOrders,   icon: Activity,    color: "text-rose-400",    bg: "bg-rose-400/10",    border: "border-rose-400/15",    trend: null,    prefix: "",  suffix: "", delay: 0.25 },
  ];

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-56 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-10 w-36 bg-white/5 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Dashboard Overview
          </h2>
          <p className="text-gray-400 mt-1 text-sm">Real-time platform metrics</p>
        </div>
        <Link
          href={ROUTES.ADMIN.ORDERS}
          className="flex items-center justify-center gap-2 bg-primary text-black px-5 py-3 md:py-2.5 rounded-xl font-bold text-sm hover:bg-accent transition-colors shadow-lg shadow-primary/20"
        >
          <ShoppingBag className="w-4 h-4" />
          View All Orders
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Recent Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/7">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-gray-200 tracking-wide">Recent Orders</h3>
          </div>
          <Link href={ROUTES.ADMIN.ORDERS} className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-16 text-center text-white/20">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  {["Order ID", "Customer", "Branch", "Status", "Amount", "Time"].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                  const Icon = cfg.icon;
                  return (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="border-b border-white/6 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-200 text-sm">{order.orderId}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-200">
                          {(order.customerId as any)?.name || "Guest"}
                        </p>
                        <p className="text-xs text-gray-500">{(order.customerId as any)?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                        {(order.branchId as any)?.name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                        >
                          <Icon className="w-3 h-3" />
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary text-sm">₹{order.total?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
