"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/Toast";
import { Copy, ArrowRight, Percent, Tag, Loader2, AlertCircle } from "lucide-react";
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
    Promise.all([fetch(API.SETTINGS).then((r) => r.json()), fetch(API.COUPONS).then((r) => r.json())])
      .then(([settingsData, couponsData]) => {
        if (settingsData.success) setSettings(settingsData.data);
        if (couponsData.success) {
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
  const heroSubtitle = getVal(
    "offersPage.heroSubtitle",
    "Discover curated promotions, luxury discounts, and premium coupon codes handcrafted to elevate your culinary journey."
  );
  const deliveryBannerTitle = getVal("offersPage.deliveryBannerTitle", "Complimentary Premium Delivery");
  const deliveryBannerDesc = getVal(
    "offersPage.deliveryBannerDesc",
    "We reward fine culinary taste. When your cart value exceeds Rs. 500 (after coupon discount), our premium temperature-controlled delivery is automatically applied completely free of charge."
  );

  return (
    <main className="min-h-screen bg-[#fff4e4] text-[#2b160c]">
      <Navbar />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#ef5a24]" />
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden bg-[#140d09] px-4 pb-16 pt-28 sm:px-6 md:pb-22 md:pt-36">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#140d09_0%,#2a1309_54%,#0f1117_100%)]" />
            <div className="relative mx-auto max-w-6xl text-center">
              <span className="inline-flex rounded-full border border-[#ffb44a]/25 bg-[#ffb44a]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb44a]">
                Signature savings
              </span>
              <h1 className="mt-7 font-playfair text-4xl font-black leading-none text-[#fff8ee] sm:text-6xl md:text-7xl">
                {heroTitle}
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#f8ead7]/72 sm:text-lg">
                {heroSubtitle}
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
            {coupons.length === 0 ? (
              <div className="rounded-[26px] border border-[#ead8c1] bg-[#fffaf2] py-20 text-center shadow-[0_18px_46px_rgba(73,40,18,0.08)]">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#b89273]" />
                <p className="text-lg font-black text-[#2b160c]">No active offers right now</p>
                <p className="mt-1 text-sm font-semibold text-[#8f6b52]">Check back soon, new deals are on the way.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {coupons.map((coupon) => {
                  const isPercent = coupon.discountType === "PERCENTAGE";
                  const badge = isPercent ? `${coupon.discountValue}% discount` : `Rs. ${coupon.discountValue} savings`;
                  const expiry = new Date(coupon.expiresAt);
                  const expiryStr = expiry.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const title = coupon.title || (isPercent ? `${coupon.discountValue}% Off Your Order` : `Flat Rs. ${coupon.discountValue} Off`);
                  const description =
                    coupon.description ||
                    (isPercent
                      ? `Enjoy ${coupon.discountValue}% off on orders above Rs. ${coupon.minOrderValue}.`
                      : `Get flat Rs. ${coupon.discountValue} off on orders above Rs. ${coupon.minOrderValue}.`);
                  const usesLeft = coupon.maxUses - coupon.usedCount;
                  const isCopied = copiedCode === coupon.code;

                  return (
                    <article
                      key={coupon._id}
                      className="group rounded-[28px] border border-[#ead8c1] bg-[#fffaf2] p-6 shadow-[0_18px_46px_rgba(73,40,18,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#ef5a24]/35 hover:shadow-[0_24px_60px_rgba(73,40,18,0.13)]"
                    >
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#c94618]">{badge}</span>
                          <h3 className="mt-2 font-playfair text-3xl font-black leading-tight text-[#2b160c]">{title}</h3>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0dd] text-[#ef5a24]">
                          {isPercent ? <Percent className="h-6 w-6" /> : <Tag className="h-6 w-6" />}
                        </div>
                      </div>

                      <p className="text-sm font-medium leading-7 text-[#6d5342]">{description}</p>

                      <div className="mt-6 border-t border-[#ead8c1] pt-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a7471b]">Promo code</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded-xl border border-[#ef5a24]/20 bg-[#fff0dd] px-3 py-1.5 font-mono text-lg font-black tracking-widest text-[#c94618]">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(coupon.code)}
                            className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition ${
                              isCopied
                                ? "bg-[#16724f] text-white"
                                : "border border-[#ead8c1] bg-white text-[#6d5342] hover:border-[#ef5a24]/30 hover:text-[#c94618]"
                            }`}
                            title="Copy code"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Copy className="h-3.5 w-3.5" />
                              {isCopied ? "Copied" : "Copy"}
                            </span>
                          </button>
                        </div>
                        <div className="mt-4 grid gap-1 text-xs font-semibold text-[#8f6b52]">
                          <p>Min. order: Rs. {coupon.minOrderValue}</p>
                          <p>Expires: {expiryStr}</p>
                          {usesLeft < 20 && usesLeft > 0 && <p className="font-black text-[#c94618]">Only {usesLeft} uses left</p>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-14 rounded-[30px] border border-[#2b160c]/10 bg-[#fff8ee] p-6 shadow-[0_20px_64px_rgba(73,40,18,0.1)] md:flex md:items-center md:justify-between md:gap-8 md:p-8">
              <div className="max-w-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a7471b]">Always active</span>
                <h3 className="mt-3 font-playfair text-3xl font-black text-[#2b160c]">{deliveryBannerTitle}</h3>
                <p className="mt-2 text-sm leading-7 text-[#6d5342] md:text-base">{deliveryBannerDesc}</p>
              </div>
              <div className="mt-6 md:mt-0">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#ef5a24] px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_0_#9b3214] transition hover:translate-y-[2px] hover:bg-[#dc4818] hover:shadow-[0_3px_0_#9b3214]"
                >
                  Order Gourmet Menu
                  <ArrowRight className="h-4 w-4" />
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
