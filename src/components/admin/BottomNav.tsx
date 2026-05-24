"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LayoutDashboard, ShoppingBag, Package, Settings } from "lucide-react";
import clsx from "clsx";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session?.user) return null;

  const isAdmin = session.user.role === "SUPER_ADMIN";
  const basePath = isAdmin ? "/admin" : "/branch";

  const navItems = [
    { name: "Dashboard", href: `${basePath}/dashboard`, icon: LayoutDashboard },
    { name: "Orders", href: `${basePath}/orders`, icon: ShoppingBag },
    { name: "Inventory", href: isAdmin ? "/admin/products" : "/branch/inventory", icon: Package },
    { name: "Settings", href: `${basePath}/settings`, icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/8/95 backdrop-blur-md border-t border-white/8 z-40 md:hidden px-4 py-2 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all font-medium text-xs",
              isActive
                ? "text-amber-400 bg-amber-500/10 scale-105 font-bold"
                : "text-white/50 hover:text-white/8"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
