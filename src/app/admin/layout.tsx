"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Store, Package, Users, Settings,
  ShoppingBag, Tag, LogOut, ChevronRight, Bell, FileText,
  TrendingUp, Ticket, Menu, X, Crown, Shield, Zap, UserCircle,
  MessageSquareQuote,
} from "lucide-react";
import { ROLES, ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";
import { OrderPopup } from "@/components/admin/OrderPopup";
import { PwaManager } from "@/components/pwa/PwaManager";

const NAV_ITEMS = [
  { label: "Dashboard",    href: ROUTES.ADMIN.DASHBOARD,  icon: LayoutDashboard, badge: null },
  { label: "Orders",       href: ROUTES.ADMIN.ORDERS,     icon: ShoppingBag,     badge: "live" },
  { label: "Menu Items",   href: ROUTES.ADMIN.PRODUCTS,   icon: Package,         badge: null },
  { label: "Categories",   href: ROUTES.ADMIN.CATEGORIES, icon: Tag,             badge: null },
  { label: "Branches",     href: ROUTES.ADMIN.BRANCHES,   icon: Store,           badge: null },
  { label: "Coupons",      href: ROUTES.ADMIN.COUPONS,    icon: Ticket,          badge: null },
  { label: "Users",        href: ROUTES.ADMIN.USERS,      icon: Users,           badge: null },
  { label: "Reviews",      href: "/admin/reviews",         icon: MessageSquareQuote, badge: null },
  { label: "About Page",   href: "/admin/about",           icon: FileText,        badge: null },
  { label: "Franchise Page", href: "/admin/franchise",       icon: TrendingUp,      badge: null },
  { label: "My Profile",   href: "/admin/profile",         icon: UserCircle,      badge: null },
  { label: "Settings",     href: ROUTES.ADMIN.SETTINGS,   icon: Settings,        badge: null },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === "loading") return; // Wait — don't redirect during loading
    if (status === "unauthenticated") {
      router.push(`${ROUTES.AUTH.LOGIN}?from=${encodeURIComponent(pathname)}`);
    }
    if (status === "authenticated" && session.user.role !== ROLES.SUPER_ADMIN) {
      router.push(ROUTES.AUTH.LOGIN + "?reason=unauthorized");
    }
  }, [status, session, router, pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== ROLES.SUPER_ADMIN) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Realtime popup */}
      <OrderPopup />
      <PwaManager />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "w-64 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0",
          "bg-[#0d1117] border-r border-white/7",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo & Brand */}
        <div className="p-6 border-b border-white/7">
          <Link href={ROUTES.HOME} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 gold-glow">
              <Crown className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="text-xl font-black text-white italic">HPF.</span>
              <span className="block text-[10px] text-primary/70 font-bold uppercase tracking-widest">Admin Panel</span>
            </div>
          </Link>

          {/* Role Badge */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-xl border border-primary/15">
            <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-black text-primary uppercase tracking-widest">Super Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-gray-500 hover:bg-white/4 hover:text-gray-200"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge === "live" && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                )}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div className="p-4 border-t border-white/7">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name || "Admin"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-black text-sm">
                  {session.user.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{session.user.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: ROUTES.HOME })}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="bg-[#0d1117] border-b border-white/7 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl lg:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-white font-black text-lg hidden sm:block">
                Admin Panel
              </h1>
              <p className="text-white/30 text-xs hidden sm:flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary" />
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {currentTime && ` · ${currentTime}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button className="relative p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-white/50" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Link
              href={ROUTES.HOME}
              className="text-sm text-primary font-bold hover:text-accent transition-colors border border-primary/20 px-3 py-1.5 rounded-lg"
            >
              View Site →
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-5 md:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
