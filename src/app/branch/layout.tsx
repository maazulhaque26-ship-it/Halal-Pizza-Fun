"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ShoppingBag, Package, LogOut, Bell, ChevronRight, Menu, X } from "lucide-react";
import { ROLES, ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";
import { OrderPopup } from "@/components/admin/OrderPopup";
import { PwaManager } from "@/components/pwa/PwaManager";

const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.BRANCH.DASHBOARD, icon: LayoutDashboard },
  { label: "Live Orders", href: ROUTES.BRANCH.ORDERS, icon: ShoppingBag },
  { label: "Inventory", href: ROUTES.BRANCH.INVENTORY, icon: Package },
];

export default function BranchLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (status === "unauthenticated") router.push(ROUTES.AUTH.LOGIN);
    if (status === "authenticated" &&
      session.user.role !== ROLES.BRANCH_MANAGER &&
      session.user.role !== ROLES.MANAGER &&
      session.user.role !== ROLES.SUPER_ADMIN) {
      router.push(ROUTES.AUTH.LOGIN + "?reason=unauthorized");
    }
  }, [status, session, router]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Realtime popup — always mounted, listens for NEW_ORDER events */}
      <OrderPopup />
      {/* PWA install banner + push notification prompt */}
      <PwaManager />
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-[#080d15]/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "w-60 bg-background border-r border-white/10 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5 border-b border-white/8">
          <Link href={ROUTES.HOME} className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="text-lg font-black text-white italic">HPF.</span>
          </Link>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase">
            Branch Manager
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all",
                  isActive ? "bg-primary text-black" : "text-white/40 hover:bg-background hover:text-white/90"
                )}>
                <item.icon className="w-4 h-4" /> {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/8">
          <div className="px-2 mb-3">
            <p className="text-sm font-bold text-white/90 truncate">{session.user.name}</p>
            <p className="text-xs text-white/50 truncate">{session.user.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: ROUTES.HOME })}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="lg:ml-60 flex-1 flex flex-col min-w-0">
        <header className="bg-background border-b border-white/8 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-white/60 hover:bg-background/5 rounded-xl lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-black text-white/90 text-lg hidden sm:block">Branch Dashboard</h1>
          </div>
          <button className="relative p-2 bg-background/5 rounded-xl hover:bg-background/8 transition-colors">
            <Bell className="w-5 h-5 text-white/60" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </header>
        <motion.main key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 p-6 md:p-8">
          {children}
        </motion.main>
      </div>
    </div>
  );
}
