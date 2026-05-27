"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Search, ArrowRight, Star, Flame, Award } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";

interface HeroStat {
  value: string;
  label: string;
}

interface HeroProps {
  title?: string;
  subtitle?: string;
  backgroundUrl?: string;
  stats?: HeroStat[];
  trendingTags?: string[];
}

const DEFAULT_TITLE = "Halal Pizza Fun";
const DEFAULT_SUBTITLE = "Authentic Halal Flavours, Crafted with Love & Delivered Fresh";

const DEFAULT_STATS: HeroStat[] = [
  { label: "Rating", value: "4.9★" },
  { label: "Orders Served", value: "50K+" },
  { label: "Years", value: "10+" },
];

const DEFAULT_TRENDING = ["Pizza", "Cheeza", "Burgers", "Wings", "Sides"];
const STAT_ICONS = [Star, Flame, Award];

export default function Hero({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  backgroundUrl,
  stats = DEFAULT_STATS,
  trendingTags = DEFAULT_TRENDING,
}: HeroProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`${ROUTES.MENU}?${params.toString()}`);
  };

  const bgStyle = backgroundUrl
    ? { backgroundImage: `url(${backgroundUrl})` }
    : { backgroundImage: 'url("/hero-bg.png"), linear-gradient(135deg, #0a0a1a 0%, #1a0a00 100%)' };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-svh flex items-center justify-center overflow-hidden"
    >
      {/* ── Parallax Background ── */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: bgY, ...bgStyle, backgroundSize: "cover", backgroundPosition: "center" }}
      />

      {/* ── Multi-layer overlays for depth ── */}
      <div className="absolute inset-0 z-1 bg-linear-to-b from-black/70 via-black/40 to-black/90" />
      <div className="absolute inset-0 z-2 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

      {/* ── Animated background orbs ── */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[100px] z-2"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-orange-500/10 blur-[120px] z-2"
      />

      {/* ── Content ── */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-5xl w-full px-6 text-center pt-28 pb-16 md:pt-32 md:pb-20"
      >
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-playfair font-black text-white mb-6 tracking-normal leading-[1.1]"
          style={{ fontSize: "clamp(2.4rem, 6.5vw, 5.25rem)" }}
        >
          {title === DEFAULT_TITLE ? (
            <>
              Halal{" "}
              <em className="text-gradient not-italic">Pizza</em>{" "}
              Fun
            </>
          ) : (
            title.split(" ").map((word, i, arr) => {
              const accentIdx = arr.length > 2 ? 1 : 0;
              return (
                <span key={i}>
                  {i > 0 && " "}
                  {i === accentIdx ? (
                    <em className="text-gradient not-italic">{word}</em>
                  ) : (
                    word
                  )}
                </span>
              );
            })
          )}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-base md:text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed tracking-wide font-light"
        >
          {subtitle}
        </motion.p>

        {/* Search Bar */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative max-w-2xl mx-auto mb-10"
        >
          <div className="glass-card rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-white/8 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-3 flex-1 w-full">
              <Search className="text-primary/70 w-5 h-5 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pizzas, burgers, sides..."
                className="bg-transparent border-none focus:outline-none text-base w-full font-medium text-white placeholder:text-white/30"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto bg-primary hover:bg-accent text-black px-8 py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30"
            >
              <span>Find Food</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.form>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-6 md:gap-12"
        >
          {stats.map(({ label, value }, i) => {
            const Icon = STAT_ICONS[i % STAT_ICONS.length];
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-black text-white">{value}</span>
                </div>
                <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">{label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trending Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-10 flex flex-wrap justify-center gap-3 text-white/60"
        >
          <span className="text-sm uppercase tracking-widest font-bold text-white/30">
            Trending:
          </span>
          {trendingTags.map((item) => (
            <Link
              key={item}
              href={`${ROUTES.MENU}?q=${item}`}
              className="text-sm font-semibold hover:text-primary transition-colors border-b border-white/10 hover:border-primary pb-0.5"
            >
              {item}
            </Link>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Bottom gradient fade ── */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-linear-to-t from-background to-transparent z-10" />

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </motion.div>
      </motion.div>
    </div>
  );
}
