"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/Toast";
import { Copy, Gift, ArrowRight, Percent, Tag, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { API } from "@/config/constants";

interface DBCoupon {
  _id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  title?: string;
  description?: string;
}

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [coupons, setCoupons] = useState<DBCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(API.SETTINGS).then(r => r.json()),
      fetch(API.COUPONS).then(r => r.json()),
    ])
      .then(([settingsData, couponsData]) => {
        if (settingsData.success) setSettings(settingsData.data);
        if (couponsData.success) {
          // Only show active coupons that are not expired
          const now = new Date();
          const active = (couponsData.data as DBCoupon[]).filter(
            (c) => c.isActive && new Date(c.expiresAt) > now
          );
          setCoupons(active);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Safe helper to resolve settings values
  const getVal = (path: string, fallback: string) => {
    if (!settings) return fallback;
    const keys = path.split(".");
    let cur = settings;
    for (const key of keys) {
      if (cur == null || typeof cur !== "object") return fallback;
      cur = cur[key];
    }
    return cur || fallback;
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const heroTitle = getVal("offersPage.heroTitle", "Exclusive Gourmet Offers");
  const heroSubtitle = getVal("offersPage.heroSubtitle", "Discover curated promotions, luxury discounts, and premium coupon codes handcrafted to elevate your culinary journey.");
  const deliveryBannerTitle = getVal("offersPage.deliveryBannerTitle", "Complimentary Premium Delivery");
  const deliveryBannerDesc = getVal("offersPage.deliveryBannerDesc", "We reward fine culinary taste. When your cart value exceeds ₹500 (after coupon discount), our premium temperature-controlled delivery is automatically applied completely free of charge.");

  return (
    <main className="min-h-screen bg-background text-white font-sans selection:bg-primary selection:text-black">
      <Navbar />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Hero Header */}
          <section className="relative pt-36 pb-20 overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.15),rgba(255,255,255,0))]">
            <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
              <span className="text-primary font-black tracking-widest text-xs uppercase px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                SIGNATURE SAVINGS
              </span>
              <h1 className="text-5xl md:text-7xl font-black mt-6 mb-8 tracking-tight leading-none text-white">
                {heroTitle.split("Gourmet").map((part: string, idx: number, arr: string[]) => (
                  <span key={idx}>
                    {idx === arr.length - 1 ? (
                      <>{part}</>
                    ) : (
                      <>{part} <span className="text-primary font-serif italic font-normal">Gourmet</span> </>
                    )}
                  </span>
                ))}
              </h1>
              <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed font-medium">
                {heroSubtitle}
              </p>
            </div>
          </section>

          {/* Offers Grid */}
          <section className="py-12 max-w-6xl mx-auto px-6 pb-32">
            {coupons.length === 0 ? (
              <div className="text-center py-20 text-white/30">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold">No active offers right now</p>
                <p className="text-sm mt-1">Check back soon — new deals are on the way!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {coupons.map((coupon, idx) => {
                  const isPercent = coupon.discountType === "PERCENTAGE";
                  const badge = isPercent ? `${coupon.discountValue}% DISCOUNT` : `₹${coupon.discountValue} SAVINGS`;
                  const expiry = new Date(coupon.expiresAt);
                  const expiryStr = expiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                  const title = coupon.title || (isPercent ? `${coupon.discountValue}% Off Your Order` : `Flat ₹${coupon.discountValue} Off`);
                  const description = coupon.description || (isPercent
                    ? `Enjoy ${coupon.discountValue}% off on orders above ₹${coupon.minOrderValue}.`
                    : `Get flat ₹${coupon.discountValue} off on orders above ₹${coupon.minOrderValue}.`);
                  const usesLeft = coupon.maxUses - coupon.usedCount;

                  return (
                    <div
                      key={coupon._id}
                      className="relative overflow-hidden group rounded-3xl p-8 transition-all duration-300"
                      style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.3)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                    >
                      {/* Gold light burst */}
                      <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/10 blur-3xl rounded-full transition-all group-hover:scale-150 duration-500" />

                      <div className="flex justify-between items-start gap-4 mb-6">
                        <div>
                          <span className="text-primary font-bold text-xs uppercase tracking-widest">{badge}</span>
                          <h3 className="font-extrabold text-2xl text-white mt-1 group-hover:text-primary transition-colors">{title}</h3>
                        </div>
                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
                          {isPercent ? <Percent className="w-6 h-6 text-primary" /> : <Tag className="w-6 h-6 text-primary" />}
                        </div>
                      </div>

                      <p className="text-white/50 text-sm leading-relaxed mb-6">{description}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/8/80">
                        <div>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">PROMO CODE</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono font-black text-lg text-primary tracking-widest px-3 py-1.5 rounded-lg" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(coupon.code)}
                              className="p-2 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors"
                              title="Copy code"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">DETAILS</p>
                          <p className="text-xs text-white/70 font-semibold mt-1">Min. order: ₹{coupon.minOrderValue}</p>
                          <p className="text-[11px] text-white/30 font-medium mt-0.5">Expires: {expiryStr}</p>
                          {usesLeft < 20 && usesLeft > 0 && (
                            <p className="text-[11px] text-amber-400 font-bold mt-0.5">Only {usesLeft} uses left!</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Free Delivery Banner */}
            <div className="mt-16 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8" style={{ background: "linear-gradient(135deg, rgba(13,24,41,0.95), rgba(10,18,35,0.98))", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none"></div>
              
              <div className="relative z-10 max-w-xl">
                <span className="text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  ALWAYS ACTIVE
                </span>
                <h3 className="text-3xl font-black mt-4 mb-2">{deliveryBannerTitle}</h3>
                <p className="text-white/50 text-sm md:text-base leading-relaxed">
                  {deliveryBannerDesc}
                </p>
              </div>

              <div className="relative z-10 shrink-0">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-black font-black px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Order Gourmet Menu <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </main>
  );
}
