"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useSession } from "next-auth/react";
import { ROUTES, ROLES } from "@/config/constants";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCartStore();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on admin/branch routes or desktop
  const isHiddenRoute = pathname.startsWith("/admin") || pathname.startsWith("/branch") || pathname.startsWith("/delivery");
  if (isHiddenRoute) return null;

  const cartCount = mounted && items ? items.reduce((sum, item) => sum + (item?.quantity || 1), 0) : 0;

  const getProfileRoute = () => {
    if (!session) return ROUTES.AUTH.LOGIN;
    if (session.user.role === ROLES.SUPER_ADMIN) return ROUTES.ADMIN.DASHBOARD;
    if (session.user.role === ROLES.BRANCH_MANAGER || session.user.role === ROLES.MANAGER) return ROUTES.BRANCH.DASHBOARD;
    if (session.user.role === ROLES.DELIVERY_STAFF) return "/delivery";
    return "/profile";
  };

  const navItems = [
    { label: "Home", icon: Home, href: ROUTES.HOME },
    { label: "Menu", icon: Search, href: ROUTES.MENU },
    { label: "Cart", icon: ShoppingBag, href: ROUTES.CHECKOUT, badge: cartCount },
    { label: "Profile", icon: User, href: getProfileRoute() },
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the absolute nav */}
      <div className="h-20 md:hidden" />
      
      <nav className="md:hidden fixed bottom-0 inset-x-0 backdrop-blur-xl border-t z-50 pb-safe" style={{ background: "rgba(5,13,26,0.95)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-around px-2 h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full h-full space-y-1 group"
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-colors duration-300 relative",
                  isActive ? "text-primary" : "text-white/40 group-hover:text-white/80"
                )}>
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  
                  {(item.badge ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-in zoom-in">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-bold transition-colors duration-300",
                  isActive ? "text-primary" : "text-white/40 group-hover:text-white/80"
                )}>
                  {item.label}
                </span>

                {isActive && (
                  <div className="absolute top-0 inset-x-4 h-0.5 bg-primary rounded-b-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
