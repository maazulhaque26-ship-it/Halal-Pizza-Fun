"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Menu, X, ShoppingCart, User, ChevronDown, Check, Loader2, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ROUTES, ASSETS, ROLES, API } from "@/config/constants";
import { useCartStore } from "@/store/useCartStore";
import { useBranchStore, BranchInfo, AreaInfo } from "@/store/useBranchStore";
import { toast } from "@/components/ui/Toast";

interface NavbarProps {
  siteName?: string;
  logoUrl?: string;
  mobileLogoUrl?: string;
  darkModeLogoUrl?: string;
}

export default function Navbar({ siteName = "Halal Pizza Fun", logoUrl, mobileLogoUrl, darkModeLogoUrl }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: session } = useSession();
  const { items } = useCartStore();

  // Location selector state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { selectedBranch, selectedCity, selectedArea, setSelectedBranch, setSelectedCity, setSelectedArea } = useBranchStore();
  const [branches, setBranches] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingLocationData, setLoadingLocationData] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted && items ? items.reduce((sum, item) => sum + (item?.quantity || 1), 0) : 0;
  const [fetchedSettings, setFetchedSettings] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch settings natively if not provided
  useEffect(() => {
    if (!logoUrl) {
      fetch(API.SETTINGS)
        .then(res => res.json())
        .then(data => {
          if (data.success) setFetchedSettings(data.data);
        })
        .catch(console.error);
    }
  }, [logoUrl]);

  // Load location data (branches and areas)
  useEffect(() => {
    if (isLocationModalOpen && (!branches || branches.length === 0)) {
      setLoadingLocationData(true);
      Promise.all([
        fetch(API.BRANCHES).then(r => r.json()),
        fetch("/api/areas").then(r => r.json())
      ])
        .then(([branchesRes, areasRes]) => {
          if (branchesRes.success) {
            const activeBranches = branchesRes.data.filter((b: any) => b.isActive && !b.isDeleted);
            setBranches(activeBranches);
            // Extract unique cities
            const uniqueCities = Array.from(new Set(activeBranches.map((b: any) => b.address?.city).filter(Boolean))) as string[];
            setCities(uniqueCities);
          }
          if (areasRes.success) {
            setAreas(areasRes.data);
          }
        })
        .catch(() => toast.error("Failed to load location selection data"))
        .finally(() => setLoadingLocationData(false));
    }
  }, [isLocationModalOpen, branches.length]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = () => setShowUserMenu(false);
    if (showUserMenu) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showUserMenu]);

  const pathname = usePathname();
  const isLightPage = pathname !== ROUTES.HOME && !pathname.startsWith("/admin") && !pathname.startsWith("/branch");

  const getDashboardRoute = () => {
    if (!session) return ROUTES.AUTH.LOGIN;
    if (session.user.role === ROLES.SUPER_ADMIN) return ROUTES.ADMIN.DASHBOARD;
    if (session.user.role === ROLES.BRANCH_MANAGER) return ROUTES.BRANCH.DASHBOARD;
    return ROUTES.HOME;
  };

  const currentLogoUrl = logoUrl || fetchedSettings?.logoUrl || ASSETS.LOGO;
  const currentMobileLogoUrl = mobileLogoUrl || fetchedSettings?.mobileLogoUrl || currentLogoUrl;
  const displaySiteName = siteName || fetchedSettings?.siteName || "Halal Pizza Fun";

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    // Clear area and branch selections since they don't match the new city
    setSelectedArea(null);
    setSelectedBranch(null);
  };

  const handleSelectArea = (area: any) => {
    setSelectedArea({
      _id: area._id,
      name: area.name,
      assignedBranchId: area.assignedBranchId,
      landmarks: area.landmarks
    });

    // Find and set the corresponding branch
    const branchIdStr = typeof area.assignedBranchId === "object" ? area.assignedBranchId?._id : area.assignedBranchId;
    const matchedBranch = branches.find(b => b._id === branchIdStr);
    if (matchedBranch) {
      setSelectedBranch({
        _id: matchedBranch._id,
        name: matchedBranch.name,
        slug: matchedBranch.slug,
        logo: matchedBranch.logo,
        contactNumber: matchedBranch.contactNumber,
        whatsappNumber: matchedBranch.whatsappNumber,
        deliveryCharge: matchedBranch.deliveryCharge,
        estimatedDeliveryTime: matchedBranch.estimatedDeliveryTime,
        address: matchedBranch.address,
        operatingHours: matchedBranch.operatingHours
      });
      setSelectedCity(matchedBranch.address?.city);
    }
    setIsLocationModalOpen(false);
    toast.success(`Selected area: ${area.name}`);
  };

  const handleSelectBranchDirectly = (branch: any) => {
    setSelectedBranch({
      _id: branch._id,
      name: branch.name,
      slug: branch.slug,
      logo: branch.logo,
      contactNumber: branch.contactNumber,
      whatsappNumber: branch.whatsappNumber,
      deliveryCharge: branch.deliveryCharge,
      estimatedDeliveryTime: branch.estimatedDeliveryTime,
      address: branch.address,
      operatingHours: branch.operatingHours
    });
    setSelectedCity(branch.address?.city);
    setSelectedArea(null); // Direct branch selection resets area
    setIsLocationModalOpen(false);
    toast.success(`Selected branch: ${branch.name}`);
  };

  // Filter areas based on selected city
  const filteredAreas = areas.filter(area => {
    if (!selectedCity) return true;
    const branchIdStr = typeof area.assignedBranchId === "object" ? area.assignedBranchId?._id : area.assignedBranchId;
    const b = branches.find(branch => branch._id === branchIdStr);
    return b?.address?.city === selectedCity;
  });

  // Filter branches based on selected city
  const filteredBranches = (branches || []).filter(b => !selectedCity || b.address?.city === selectedCity);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
          isScrolled 
            ? isLightPage 
              ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-white/8 py-3" 
              : "glass-card shadow-xl shadow-black/50 py-3 border-b border-white/5" 
            : isLightPage 
              ? "bg-background/90 backdrop-blur-sm border-b border-white/5" 
              : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* ── Logo & Location Picker ── */}
          <div className="flex items-center gap-5">
            <Link href={ROUTES.HOME} className="flex items-center gap-3 shrink-0">
              {currentLogoUrl !== ASSETS.LOGO || fetchedSettings?.logoUrl ? (
                <picture className="h-10 w-auto flex items-center">
                   <source media="(max-width: 768px)" srcSet={currentMobileLogoUrl} />
                   <img src={currentLogoUrl} alt={displaySiteName} className="h-10 w-auto object-contain" />
                </picture>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 gold-glow">
                    <span className="text-black font-black text-lg">
                      {displaySiteName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-2xl font-black tracking-tight italic hidden sm:block",
                      "text-white"
                    )}
                  >
                    {displaySiteName}.
                  </span>
                </motion.div>
              )}
            </Link>


          </div>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href={ROUTES.MENU}
              className={cn("text-sm font-semibold transition-colors hover:text-primary", "text-white/90")}
            >
              Explore Menu
            </Link>
            <Link
              href="/about-us"
              className={cn("text-sm font-semibold transition-colors hover:text-primary", "text-white/90")}
            >
              About Us
            </Link>
            <Link
              href="/franchise"
              className={cn("text-sm font-semibold transition-colors hover:text-primary", "text-white/90")}
            >
              Franchise Page
            </Link>
            <Link
              href="/offers"
              className={cn("text-sm font-semibold transition-colors hover:text-primary", "text-white/90")}
            >
              Offers
            </Link>
            {session && (
              <Link
                href="/orders"
                className={cn("text-sm font-semibold transition-colors hover:text-primary", "text-white/90")}
              >
                My Orders
              </Link>
            )}

            <div className="flex items-center gap-3 border-l border-white/20 pl-6">
              {/* Cart */}
              <Link
                href={ROUTES.CHECKOUT}
                className={cn("relative p-2 rounded-full transition-colors", "text-white hover:bg-white/10")}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[10px] font-black rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {session ? (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu((v) => !v);
                    }}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all backdrop-blur-md", "bg-white/10 text-white hover:bg-white/20 border border-white/5")}
                  >
                    <User className="w-4 h-4" />
                    <span className="max-w-[80px] truncate">{session.user.name}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-52 glass-card rounded-2xl shadow-xl border border-white/10 overflow-hidden z-50 animate-fade-in"
                      >
                        <div className="p-3 border-b border-white/10">
                          <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                          <p className="text-sm font-bold text-white truncate">{session.user.email}</p>
                        </div>
                        <div className="p-2 text-white">
                          <Link
                            href={getDashboardRoute()}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10 hover:text-primary rounded-xl transition-colors"
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/orders"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10 hover:text-primary rounded-xl transition-colors"
                          >
                            My Orders
                          </Link>
                          <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                          >
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all bg-primary text-black shadow-lg shadow-primary/25 hover:bg-accent"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* ── Mobile Toggle ── */}
          <div className="md:hidden flex items-center gap-3">
            <Link
              href={ROUTES.CHECKOUT}
              className={cn("relative p-2", "text-white")}
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className={cn("p-2 rounded-lg", "text-white")}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-card border-t border-white/10 overflow-hidden mt-4 rounded-2xl shadow-2xl"
            >
              <div className="p-6 flex flex-col gap-3">
                <Link
                  href={ROUTES.MENU}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 text-lg font-bold text-white border-b border-white/10"
                >
                  Explore Menu
                </Link>
                <Link
                  href="/about-us"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 text-lg font-bold text-white border-b border-white/10"
                >
                  About Us
                </Link>
                <Link
                  href="/franchise"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 text-lg font-bold text-white border-b border-white/10"
                >
                  Franchise Page
                </Link>
                <Link
                  href="/offers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 text-lg font-bold text-white border-b border-white/10"
                >
                  Offers
                </Link>
                {session ? (
                  <>
                    <Link
                      href={getDashboardRoute()}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-3 text-lg font-bold text-white border-b border-white/10"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-3 text-lg font-bold text-white border-b border-white/10"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="py-3 text-lg font-bold text-red-400 text-left w-full"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href={ROUTES.AUTH.LOGIN}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full bg-primary text-black py-4 rounded-xl font-bold text-center mt-2 hover:bg-accent transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Location Selector Modal ── */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setIsLocationModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full h-full sm:h-auto sm:max-w-xl sm:max-h-[85vh] flex flex-col overflow-hidden sm:rounded-3xl rounded-none shadow-2xl"
              style={{ background: "linear-gradient(145deg, rgba(10,18,35,0.98), rgba(5,13,26,0.99))", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/8 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Select Your Delivery Locality
                  </h3>
                  <p className="text-xs text-white/40 mt-1">Manual city & area selection for accurate delivery routing</p>
                </div>
                <button onClick={() => setIsLocationModalOpen(false)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {loadingLocationData ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm font-semibold text-white/40">Loading delivery zones...</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Step 1: Select City */}
                  <div>
                    <label className="block text-xs font-black text-white/40 uppercase tracking-wide mb-3">1. Choose City</label>
                    {cities.length === 0 ? (
                      <p className="text-sm text-white/50">No active cities configured.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {cities.map(city => (
                          <button
                            key={city}
                            onClick={() => handleSelectCity(city)}
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-sm font-bold border transition-all",
                              selectedCity === city
                                ? "bg-primary text-black border-primary shadow-md shadow-primary/20"
                                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                            )}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Select Area / Branch */}
                  {selectedCity && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/8">
                      {/* Areas Column */}
                      <div>
                        <label className="block text-xs font-black text-white/40 uppercase tracking-wide mb-3">
                          2. Select Area / Locality ({selectedCity})
                        </label>
                        {filteredAreas.length === 0 ? (
                          <p className="text-sm text-white/40 bg-white/5 p-4 rounded-2xl">No delivery areas listed for this city.</p>
                        ) : (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {filteredAreas.map(area => (
                              <button
                                key={area._id}
                                onClick={() => handleSelectArea(area)}
                                className={cn(
                                  "w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all",
                                  selectedArea?._id === area._id
                                    ? "border-primary bg-primary/5"
                                    : "border-white/8 hover:border-white/15 hover:bg-white/5"
                                )}
                              >
                                <div>
                                  <p className="font-bold text-white text-sm">{area.name}</p>
                                  {area.description && <p className="text-xs text-white/40 mt-0.5">{area.description}</p>}
                                </div>
                                {selectedArea?._id === area._id && <Check className="w-4 h-4 text-primary font-bold shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Direct Branch Column */}
                      <div>
                        <label className="block text-xs font-black text-white/40 uppercase tracking-wide mb-3">
                          Or Select Branch Directly
                        </label>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {filteredBranches.map(branch => (
                            <button
                              key={branch._id}
                              onClick={() => handleSelectBranchDirectly(branch)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                                selectedBranch?._id === branch._id
                                  ? "border-primary bg-primary/5"
                                  : "border-white/8 hover:border-white/15 hover:bg-white/5"
                              )}
                            >
                              <div className="p-2 bg-white/8 rounded-lg shrink-0">
                                <Store className="w-4 h-4 text-white/40" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-white text-sm truncate">{branch.name}</p>
                                <p className="text-xs text-white/40 truncate">{branch.address?.street}</p>
                              </div>
                              {selectedBranch?._id === branch._id && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
