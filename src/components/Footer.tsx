"use client";

import { useState, useEffect } from "react";
import { Globe, Camera, MessageCircle, Link2, Mail, Phone, MapPin, Crown, Download, X, Smartphone, ArrowRight } from "lucide-react";
import { usePwaStore } from "@/store/pwaStore";
import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES, API } from "@/config/constants";

interface FooterProps {
  siteName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactHours?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  footerLogoUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  cookiePolicyUrl?: string;
}

const QUICK_LINKS = [
  { label: "Explore Menu", href: ROUTES.MENU },
  { label: "About Us", href: "/about-us" },
  { label: "Franchise Page", href: "/franchise" },
  { label: "Offers", href: "/offers" },
  { label: "My Orders", href: "/orders" },
  { label: "Track Order", href: "/track-order" },
];

const SOCIAL_ICONS: Record<string, typeof Globe> = {
  facebook: Globe,
  instagram: Camera,
  twitter: MessageCircle,
  youtube: Link2,
};

export default function Footer({
  siteName = "HPF",
  contactEmail = "hello@hpf.com",
  contactPhone = "+91 8800155198",
  contactHours,
  socialLinks = {},
  footerLogoUrl,
  privacyPolicyUrl,
  termsOfServiceUrl,
  cookiePolicyUrl,
}: FooterProps) {
  const [year, setYear] = useState(2026);
  const [fetchedSettings, setFetchedSettings] = useState<any>(null);
  const [isPwa, setIsPwa] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const { deferredPrompt, clearDeferredPrompt, isInstalled } = usePwaStore();

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") clearDeferredPrompt();
    } else {
      setShowInstallGuide(true);
    }
  };

  useEffect(() => {
    setMounted(true);
    setYear(new Date().getFullYear());
    const checkPwa = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone ||
        document.referrer.includes("android-app://");
      setIsPwa(!!isStandalone);
    };
    checkPwa();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", checkPwa);
    return () => mq.removeEventListener("change", checkPwa);
  }, []);

  useEffect(() => {
    const needsFetch = !footerLogoUrl || !contactHours || !privacyPolicyUrl;
    if (needsFetch) {
      fetch(API.SETTINGS)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setFetchedSettings(d.data);
        })
        .catch(console.error);
    }
  }, [footerLogoUrl, contactHours, privacyPolicyUrl]);

  const displaySiteName = siteName !== "HPF" ? siteName : fetchedSettings?.siteName || "HPF";
  const displayEmail = contactEmail !== "hello@hpf.com" ? contactEmail : fetchedSettings?.contactEmail || "hello@hpf.com";
  const displayPhone = contactPhone !== "+91 8800155198" ? contactPhone : fetchedSettings?.contactPhone || "+91 8800155198";
  const displayHours = contactHours || fetchedSettings?.contactHours || "Mon - Sun: 10:00 AM - 11:00 PM";
  const displaySocials = mounted ? (Object.keys(socialLinks).length ? socialLinks : fetchedSettings?.socialLinks || {}) : {};
  const currentFooterLogoUrl = footerLogoUrl || fetchedSettings?.footerLogoUrl;
  const displayPrivacyUrl = privacyPolicyUrl || fetchedSettings?.legalLinks?.privacyPolicyUrl || "";
  const displayTermsUrl = termsOfServiceUrl || fetchedSettings?.legalLinks?.termsOfServiceUrl || "";
  const displayCookieUrl = cookiePolicyUrl || fetchedSettings?.legalLinks?.cookiePolicyUrl || "";
  const activeSocials = Object.entries(displaySocials).filter(([, url]) => Boolean(url));

  return (
    <footer className="relative overflow-hidden bg-[#140d09] text-[#fff8ee]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#140d09_0%,#271108_54%,#0f1117_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb44a]/45 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {mounted && !isPwa && !isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-14"
          >
            <div className="grid gap-6 overflow-hidden rounded-[30px] border border-[#ffb44a]/20 bg-[#fff8ee] p-5 text-[#2b160c] shadow-[0_28px_80px_rgba(0,0,0,0.24)] md:grid-cols-[1fr_auto] md:items-center md:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#2b160c] text-[#ffb44a]">
                  <Smartphone className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-playfair text-2xl font-black leading-tight">Install {displaySiteName}</h3>
                  <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-[#6d5342]">
                    Keep your favorite kitchen close for quicker ordering and live dinner updates.
                  </p>
                </div>
              </div>
              <button
                onClick={handleInstallApp}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ef5a24] px-6 py-3.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_0_#9b3214] transition hover:translate-y-[2px] hover:shadow-[0_3px_0_#9b3214]"
              >
                <Download className="h-4 w-4" />
                {deferredPrompt ? "Install App" : "How to Install"}
              </button>
            </div>
          </motion.div>
        )}

        {showInstallGuide && (
          <div className="fixed inset-0 z-999 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setShowInstallGuide(false)}>
            <div className="w-full max-w-sm rounded-[28px] bg-[#fff8ee] p-6 text-[#2b160c] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2b160c] text-[#ffb44a]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <h3 className="font-black">Install the App</h3>
                </div>
                <button onClick={() => setShowInstallGuide(false)} className="rounded-full p-1 text-[#6d5342] hover:bg-[#fff0dd]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {[
                ["Android Chrome", ["Open this page in Chrome", "Tap the three-dot menu", "Tap Add to Home Screen", "Confirm Add"]],
                ["iPhone Safari", ["Open this page in Safari", "Tap the Share button", "Tap Add to Home Screen", "Confirm Add"]],
              ].map(([title, steps]) => (
                <div key={title as string} className="mb-5">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#a7471b]">{title as string}</p>
                  <ol className="space-y-2">
                    {(steps as string[]).map((step, i) => (
                      <li key={step} className="flex items-start gap-3 text-sm font-semibold text-[#6d5342]">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff0dd] text-xs font-black text-[#a7471b]">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <button onClick={() => setShowInstallGuide(false)} className="w-full rounded-2xl bg-[#2b160c] py-3 text-sm font-black text-[#fff8ee]">
                Got it
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-10 py-16 md:grid-cols-2 md:py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href={ROUTES.HOME} className="inline-flex items-center gap-3">
              {currentFooterLogoUrl ? (
                <img src={currentFooterLogoUrl} alt={displaySiteName} className="h-12 w-auto object-contain" />
              ) : (
                <>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffb44a] text-[#2b160c]">
                    <Crown className="h-6 w-6" />
                  </span>
                  <span className="font-playfair text-3xl font-black italic">{displaySiteName}</span>
                </>
              )}
            </Link>
            <p className="mt-6 max-w-md text-sm font-medium leading-7 text-[#f8ead7]/62">
              Premium halal comfort food from real neighborhood kitchens. Crafted hot, packed carefully, and sent out with care.
            </p>
            <div className="mt-7 flex gap-3">
              {activeSocials.length > 0
                ? activeSocials.map(([platform, url]) => {
                    const Icon = SOCIAL_ICONS[platform] || Globe;
                    return (
                      <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ffb44a]/20 bg-white/[0.06] text-[#fff8ee]/70 transition hover:-translate-y-1 hover:bg-[#ffb44a] hover:text-[#2b160c]">
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })
                : ([Globe, Camera, MessageCircle, Link2] as const).map((Icon, i) => (
                    <span key={i} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/30">
                      <Icon className="h-4 w-4" />
                    </span>
                  ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-5 text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb44a]">Explore</h4>
            <ul className="grid gap-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="group inline-flex items-center gap-2 text-sm font-bold text-[#f8ead7]/62 transition hover:text-[#ffb44a]">
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="mb-5 text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb44a]">Kitchen Desk</h4>
            <ul className="grid gap-4">
              <li>
                <a href={`mailto:${displayEmail}`} className="flex items-start gap-3 text-sm font-semibold text-[#f8ead7]/64 transition hover:text-[#ffb44a]">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#ffb44a]" />
                  <span className="break-all">{displayEmail}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${displayPhone}`} className="flex items-start gap-3 text-sm font-semibold text-[#f8ead7]/64 transition hover:text-[#ffb44a]">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#ffb44a]" />
                  {displayPhone}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold text-[#f8ead7]/64">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#ffb44a]" />
                {displayHours}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#ffb44a]/12 py-7">
          <div className="flex flex-col gap-4 text-xs font-bold text-[#f8ead7]/42 sm:flex-row sm:items-center sm:justify-between">
            <p>
              (c) {year} <span className="text-[#f8ead7]/72">{displaySiteName}</span>. Crafted with care.
            </p>
            <div className="flex flex-wrap gap-5">
              {displayPrivacyUrl ? <a href={displayPrivacyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#ffb44a]">Privacy Policy</a> : <span className="opacity-45">Privacy Policy</span>}
              {displayTermsUrl ? <a href={displayTermsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#ffb44a]">Terms of Service</a> : <span className="opacity-45">Terms of Service</span>}
              {displayCookieUrl ? <a href={displayCookieUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#ffb44a]">Cookie Policy</a> : <span className="opacity-45">Cookie Policy</span>}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
