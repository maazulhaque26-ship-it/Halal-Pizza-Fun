"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Search, ArrowRight, Star, Flame, Award, MapPin } from "lucide-react";
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
  { label: "Rating", value: "4.9" },
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

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "24%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`${ROUTES.MENU}?${params.toString()}`);
  };

  const bgStyle = backgroundUrl
    ? { backgroundImage: `url(${backgroundUrl})` }
    : { backgroundImage: 'url("/hero-bg.png"), linear-gradient(135deg, #17110d 0%, #35170f 100%)' };

  return (
    <div ref={containerRef} className="relative min-h-svh overflow-hidden bg-[#17110d]">
      <motion.div
        className="absolute inset-0"
        style={{ y: bgY, ...bgStyle, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,17,13,0.96)_0%,rgba(23,17,13,0.82)_42%,rgba(23,17,13,0.34)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,17,13,0.24)_0%,rgba(23,17,13,0.08)_48%,#0f1117_100%)]" />

      <motion.div
        style={{ opacity }}
        className="relative z-10 mx-auto grid min-h-svh w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-24 pt-28 sm:px-6 md:grid-cols-[1.02fr_0.78fr] md:pb-20 md:pt-32 lg:gap-16"
      >
        <div className="max-w-3xl text-left">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#f5c35b]/25 bg-[#fff7ec]/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#f5c35b] shadow-[0_18px_48px_rgba(0,0,0,0.22)] backdrop-blur-md"
          >
            <span className="h-2 w-2 rounded-full bg-[#f05a28]" />
            Est. 2016 | Fired fresh daily
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-playfair text-5xl font-black leading-[0.96] tracking-normal text-[#fff8ee] sm:text-6xl md:text-7xl lg:text-8xl"
          >
            {title === DEFAULT_TITLE ? (
              <>
                Halal pizza,
                <span className="block text-[#ffb44a]">made with a pulse.</span>
              </>
            ) : (
              title
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.16 }}
            className="mt-7 max-w-xl text-base leading-8 text-[#f8ead7]/78 sm:text-lg"
          >
            {subtitle}
          </motion.p>

          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.28 }}
            className="mt-9 max-w-2xl"
          >
            <div className="flex flex-col gap-2 rounded-[24px] border border-[#f4c430]/20 bg-[#fffaf2] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:flex-row">
              <div className="flex min-h-14 flex-1 items-center gap-3 px-4">
                <Search className="h-5 w-5 shrink-0 text-[#a24a1c]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pizzas, burgers, sides..."
                  className="w-full border-none bg-transparent text-[15px] font-semibold text-[#2c1a10] placeholder:text-[#8c7968] focus:outline-none"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[18px] bg-[#ef5a24] px-7 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_10px_0_#8f2d10] transition-colors hover:bg-[#dc4818] sm:w-auto"
              >
                Find Food
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.44 }}
            className="mt-8 flex flex-wrap items-center gap-2.5"
          >
            <span className="mr-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#f5c35b]/70">
              Popular tonight
            </span>
            {trendingTags.map((item) => (
              <Link
                key={item}
                href={`${ROUTES.MENU}?q=${item}`}
                className="rounded-full border border-white/12 bg-white/[0.08] px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-white/75 transition hover:border-[#f5c35b]/45 hover:bg-[#f5c35b]/12 hover:text-[#f5c35b]"
              >
                {item}
              </Link>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden md:block"
        >
          <div className="relative ml-auto max-w-md rotate-[1.5deg] rounded-[34px] border border-white/12 bg-[#fff8ee] p-3 shadow-[0_34px_90px_rgba(0,0,0,0.36)]">
            <div className="relative h-[520px] overflow-hidden rounded-[26px]">
              <div className="absolute inset-0 bg-cover bg-center" style={bgStyle} />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_34%,rgba(0,0,0,0.84)_100%)]" />
              <div className="absolute left-5 top-5 rounded-full bg-[#fff8ee] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#442414]">
                Kitchen note
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-playfair text-3xl font-black leading-tight text-white">
                  Hot boxes leave the oven in small, careful batches.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {stats.map(({ label, value }, i) => {
                    const Icon = STAT_ICONS[i % STAT_ICONS.length];
                    return (
                      <div key={label} className="rounded-2xl bg-white/12 p-3 backdrop-blur-md">
                        <Icon className="mb-2 h-4 w-4 text-[#ffb44a]" />
                        <div className="text-lg font-black text-white">{value}</div>
                        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/55">{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-2 rounded-2xl border border-[#f5c35b]/24 bg-[#21150f]/92 px-5 py-4 text-[#fff8ee] shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur-md">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[#f05a28]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f5c35b]">Nearest kitchen</p>
                <p className="mt-1 text-sm font-semibold text-white/80">Fresh prep starts after branch selection.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 h-28 w-full bg-gradient-to-t from-[#0f1117] to-transparent" />
    </div>
  );
}
