"use client";

import { useState, useEffect } from "react";
import { Globe, Camera, MessageCircle, Link2, Smartphone, ArrowRight, Mail, Phone, MapPin, Crown } from "lucide-react";
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
  { label: "Explore Menu",  href: ROUTES.MENU },
  { label: "About Us",      href: "/about-us" },
  { label: "Franchise Page",  href: "/franchise" },
  { label: "Offers",        href: "/offers" },
  { label: "My Orders",     href: "/orders" },
  { label: "Track Order",   href: "/track-order" },
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
        .then((d) => { if (d.success) setFetchedSettings(d.data); })
        .catch(console.error);
    }
  }, [footerLogoUrl, contactHours, privacyPolicyUrl]);

  const displaySiteName = siteName !== "HPF" ? siteName : fetchedSettings?.siteName || "HPF";
  const displayEmail = contactEmail !== "hello@hpf.com" ? contactEmail : fetchedSettings?.contactEmail || "hello@hpf.com";
  const displayPhone = contactPhone !== "+91 8800155198" ? contactPhone : fetchedSettings?.contactPhone || "+91 8800155198";
  const displayHours = contactHours || fetchedSettings?.contactHours || "Mon – Sun: 10:00 AM – 11:00 PM";
  const displaySocials = mounted
    ? Object.keys(socialLinks).length
      ? socialLinks
      : fetchedSettings?.socialLinks || {}
    : {};
  const currentFooterLogoUrl = footerLogoUrl || fetchedSettings?.footerLogoUrl;
  const displayPrivacyUrl = privacyPolicyUrl || fetchedSettings?.legalLinks?.privacyPolicyUrl || "";
  const displayTermsUrl = termsOfServiceUrl || fetchedSettings?.legalLinks?.termsOfServiceUrl || "";
  const displayCookieUrl = cookiePolicyUrl || fetchedSettings?.legalLinks?.cookiePolicyUrl || "";

  const activeSocials = Object.entries(displaySocials).filter(([, url]) => Boolean(url));

  return (
    <footer className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-[#050d1a] to-[#03080f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.04),transparent_60%)]" />
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[rgba(212,175,55,0.3)] to-transparent" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.8) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* PWA Install Banner */}
        {mounted && !isPwa && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mt-16 mb-12 rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(15,30,55,0.95) 0%, rgba(10,20,40,0.98) 100%)",
              border: "1px solid rgba(212,175,55,0.2)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(212,175,55,0.06),transparent_60%)]" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-10">
              <div className="flex items-center gap-5 text-center md:text-left">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)" }}
                >
                  <Smartphone className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-1">Get the {displaySiteName} App</h3>
                  <p className="text-white/50 text-sm max-w-sm">
                    Faster ordering, live tracking &amp; exclusive app-only deals — install as PWA, no download needed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => alert("Click the install icon in your browser's address bar, or tap 'Add to Home Screen' in your mobile browser.")}
                className="shrink-0 btn-premium px-7 py-3.5 rounded-xl text-sm font-black w-full md:w-auto"
              >
                Install App →
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Footer Grid */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-5">
            <Link href={ROUTES.HOME} className="inline-flex items-center gap-3 mb-6 group">
              {currentFooterLogoUrl ? (
                <img
                  src={currentFooterLogoUrl}
                  alt={displaySiteName}
                  className="h-10 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <>
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center gold-glow">
                    <Crown className="w-5 h-5 text-black" />
                  </div>
                  <span className="text-2xl font-black text-white italic tracking-tight">
                    {displaySiteName}.
                  </span>
                </>
              )}
            </Link>

            <p className="text-white/45 leading-relaxed max-w-sm mb-8 text-sm">
              A premium multi-branch halal food delivery platform. We bring restaurant-quality dining
              directly to your doorstep — crafted with passion, delivered with precision.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {activeSocials.length > 0
                ? activeSocials.map(([platform, url]) => {
                    const Icon = SOCIAL_ICONS[platform] || Globe;
                    return (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.15)";
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                      >
                        <Icon className="w-4 h-4 text-white/60 hover:text-primary transition-colors" />
                      </a>
                    );
                  })
                : ([Globe, Camera, MessageCircle, Link2] as const).map((Icon, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <Icon className="w-4 h-4 text-white/20" />
                    </div>
                  ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-6 h-px bg-primary inline-block" />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-white/45 hover:text-primary transition-all duration-200"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-6 h-px bg-primary inline-block" />
              Get in Touch
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href={`mailto:${displayEmail}`}
                  className="group flex items-start gap-3 hover:text-primary transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors group-hover:bg-primary/20"
                    style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">Email</span>
                    <span className="text-sm text-white/60 group-hover:text-primary transition-colors">{displayEmail}</span>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${displayPhone}`}
                  className="group flex items-start gap-3 hover:text-primary transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors group-hover:bg-primary/20"
                    style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}
                  >
                    <Phone className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">Phone</span>
                    <span className="text-sm text-white/60 group-hover:text-primary transition-colors">{displayPhone}</span>
                  </div>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}
                >
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <span className="block text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">Hours</span>
                  <span className="text-sm text-white/60">{displayHours}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />
          <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/25">
              © {year} <span className="text-white/50 font-semibold">{displaySiteName}</span>. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-white/25">
              {displayPrivacyUrl ? <a href={displayPrivacyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary/70 transition-colors">Privacy Policy</a> : <span className="opacity-40">Privacy Policy</span>}
              {displayTermsUrl ? <a href={displayTermsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary/70 transition-colors">Terms of Service</a> : <span className="opacity-40">Terms of Service</span>}
              {displayCookieUrl ? <a href={displayCookieUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary/70 transition-colors">Cookie Policy</a> : <span className="opacity-40">Cookie Policy</span>}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
