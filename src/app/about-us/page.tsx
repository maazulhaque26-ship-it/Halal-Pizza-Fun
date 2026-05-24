"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Loader2, Quote, Camera, Play, Pause, Volume2, VolumeX, Sparkles, Star, Clock, Award } from "lucide-react";
import { API } from "@/config/constants";

const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
];

function VideoSection({ videoUrl, videoTitle, videoSubtitle }: { videoUrl: string; videoTitle: string; videoSubtitle: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section ref={sectionRef} className="relative h-[70vh] min-h-125 overflow-hidden">
      {/* Parallax video background */}
      <motion.div className="absolute inset-0 z-0" style={{ scale }}>
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 z-1 bg-linear-to-b from-background/80 via-black/50 to-background/90" />
      <div className="absolute inset-0 z-2 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

      {/* Letterbox bars */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-linear-to-b from-background to-transparent z-3" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-background to-transparent z-3" />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="section-tag mb-6 inline-flex">
            <Play className="w-3 h-3" />
            Our Story in Motion
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
            {videoTitle}
          </h2>
          <p className="text-lg text-white/60 max-w-xl mx-auto font-light">
            {videoSubtitle}
          </p>
        </motion.div>
      </div>

      {/* Video controls */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}
        >
          {isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
        </button>
        <button
          onClick={toggleMute}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-primary" /> : <Volume2 className="w-4 h-4 text-primary" />}
        </button>
      </div>
    </section>
  );
}

export default function AboutUsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    fetch(API.SETTINGS, { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const getVal = (path: string, fallback: string) => {
    if (!settings) return fallback;
    const keys = path.split(".");
    let cur: any = settings;
    for (const key of keys) {
      if (cur == null || typeof cur !== "object") return fallback;
      cur = cur[key];
    }
    return cur || fallback;
  };

  const heroTitle      = getVal("aboutPage.heroTitle",      "Redefining Premium Gastronomy at Home");
  const heroSubtitle   = getVal("aboutPage.heroSubtitle",   "Founded with a passion for exceptional culinary experiences, HPF redefines premium food delivery.");
  const heroTag        = getVal("aboutPage.heroTag",        "OUR STORY & VISION");
  const visionTag      = getVal("aboutPage.visionTag",      "THE VISION");
  const visionTitle    = getVal("aboutPage.visionTitle",    "Elevating Every Meal");
  const visionDesc1    = getVal("aboutPage.visionDesc1",    "Our vision is to break the barrier between high-end restaurant dining and the comfort of your home. We believe ordering food should never compromise on quality or freshness.");
  const visionDesc2    = getVal("aboutPage.visionDesc2",    "By combining state-of-the-art kitchen facilities with custom-engineered thermal delivery suites, we preserve the exact temperature and texture intended by our chefs.");
  const missionTitle   = getVal("aboutPage.missionTitle",   "Our Core Mission");
  const missionDesc    = getVal("aboutPage.missionDesc",    "To create a seamless, end-to-end premium dining standard through rigorous ingredient sourcing, master craftsmanship, and white-glove delivery precision.");
  const value1Title    = getVal("aboutPage.value1Title",    "Uncompromised Quality");
  const value1Desc     = getVal("aboutPage.value1Desc",     "We source the finest ingredients and follow rigorous standard operating procedures for culinary hygiene and premium preparation.");
  const value2Title    = getVal("aboutPage.value2Title",    "Route Optimization");
  const value2Desc     = getVal("aboutPage.value2Desc",     "Every branch operates within hyperlocal zones using real-time dispatch systems to ensure your order takes the shortest path to your door.");
  const value3Title    = getVal("aboutPage.value3Title",    "Premium Experience");
  const value3Desc     = getVal("aboutPage.value3Desc",     "Our packaging is an experience in itself — environmentally responsible, structurally sound, and beautifully presented to mirror white-tablecloth hospitality.");
  const founderName    = getVal("aboutPage.founderName",    "Chef Harpreet Sidhu");
  const founderTitle_  = getVal("aboutPage.founderTitle",   "Founder & Executive Chef");
  const founderStory   = getVal("aboutPage.founderStory",   "Born from a lifelong obsession with culinary perfection, HPF was founded in 2019 with a single kitchen and an audacious dream — to make five-star dining accessible from the comfort of home.");
  const founderImageUrl = getVal("aboutPage.founderImageUrl", "");
  const founderTag      = getVal("aboutPage.founderTag",     "MEET THE FOUNDER");
  const founderStat1Value = getVal("aboutPage.founderStat1Value", "2019");
  const founderStat1Label = getVal("aboutPage.founderStat1Label", "Founded");
  const founderStat2Value = getVal("aboutPage.founderStat2Value", "15+");
  const founderStat2Label = getVal("aboutPage.founderStat2Label", "Branches");
  const founderStat3Value = getVal("aboutPage.founderStat3Value", "20yr");
  const founderStat3Label = getVal("aboutPage.founderStat3Label", "Experience");
  const valuesTag       = getVal("aboutPage.valuesTag",      "OUR VALUES");
  const valuesSubtitle  = getVal("aboutPage.valuesSubtitle", "The Standards We Live By");
  const stat1Value      = getVal("aboutPage.stat1Value",     "100%");
  const stat1Label      = getVal("aboutPage.stat1Label",     "Gourmet");
  const stat2Value      = getVal("aboutPage.stat2Value",     "20 min");
  const stat2Label      = getVal("aboutPage.stat2Label",     "Avg Delivery");
  const stat3Value      = getVal("aboutPage.stat3Value",     "15+");
  const stat3Label      = getVal("aboutPage.stat3Label",     "Branches");
  const videoUrl        = getVal("aboutPage.videoUrl",       "");
  const videoTitle      = getVal("aboutPage.videoTitle",     "Experience Premium Dining");
  const videoSubtitle   = getVal("aboutPage.videoSubtitle",  "Watch how we craft every dish with passion and precision");

  const rawGallery: string[] = settings?.aboutPage?.galleryImages ?? [];
  const galleryImages = rawGallery.length > 0 ? rawGallery : FALLBACK_GALLERY;

  const VALUES = [
    { icon: <Star className="w-5 h-5 text-primary" />, title: value1Title, desc: value1Desc },
    { icon: <Clock className="w-5 h-5 text-primary" />, title: value2Title, desc: value2Desc },
    { icon: <Award className="w-5 h-5 text-primary" />, title: value3Title, desc: value3Desc },
  ];

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* ── Hero ── */}
          <section className="relative pt-36 pb-24 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(212,175,55,0.12),transparent)]" />
            <div
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: "linear-gradient(rgba(212,175,55,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.8) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
            <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <span className="section-tag">
                  <Sparkles className="w-3 h-3" />
                  {heroTag}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-5xl md:text-7xl font-black mt-4 mb-6 tracking-tight leading-[1.05]"
              >
                <span className="text-white">{heroTitle.split(" ").slice(0, -2).join(" ")}</span>{" "}
                <em className="text-gradient not-italic">{heroTitle.split(" ").slice(-2).join(" ")}</em>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light"
              >
                {heroSubtitle}
              </motion.p>

              {/* Floating stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-14 flex flex-wrap justify-center gap-8 md:gap-16"
              >
                {[
                  { value: stat1Value, label: stat1Label },
                  { value: stat2Value, label: stat2Label },
                  { value: stat3Value, label: stat3Label },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl font-black text-gradient-static">{stat.value}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 mt-1">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ── Promo Video Section ── */}
          {videoUrl && (
            <VideoSection videoUrl={videoUrl} videoTitle={videoTitle} videoSubtitle={videoSubtitle} />
          )}

          {/* ── Founder Section ── */}
          <section className="relative py-28 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(212,175,55,0.04),transparent_60%)]" />
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Founder Image */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative flex justify-center lg:justify-start"
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-80 h-80 rounded-full border border-primary/8 animate-[spin_25s_linear_infinite]" />
                    <div className="absolute w-64 h-64 rounded-full border border-primary/15" />
                  </div>

                  <div
                    className="relative w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden shrink-0"
                    style={{
                      border: "3px solid rgba(212,175,55,0.3)",
                      boxShadow: "0 0 80px rgba(212,175,55,0.15), 0 20px 60px rgba(0,0,0,0.5)",
                    }}
                  >
                    {founderImageUrl ? (
                      <img src={founderImageUrl} alt={founderName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-card flex flex-col items-center justify-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="text-4xl font-black text-primary/70">{founderName.charAt(0)}</span>
                        </div>
                        <span className="text-xs font-bold tracking-widest uppercase text-white/20">Founder Photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
                  </div>

                  <div
                    className="absolute bottom-2 right-4 md:bottom-6 md:right-0 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-2xl"
                    style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(212,175,55,0.25)" }}
                  >
                    <p className="text-primary font-black text-sm">{founderName}</p>
                    <p className="text-white/40 text-xs mt-0.5">{founderTitle_}</p>
                  </div>
                </motion.div>

                {/* Founder Story */}
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  <span className="section-tag mb-4 inline-flex">{founderTag}</span>
                  <h2 className="text-3xl md:text-4xl font-black mt-4 mb-1 leading-tight">{founderName}</h2>
                  <p className="text-primary/60 font-semibold text-sm mb-8 tracking-wide">{founderTitle_}</p>

                  <div
                    className="relative pl-6 mb-8"
                    style={{ borderLeft: "2px solid rgba(212,175,55,0.35)" }}
                  >
                    <Quote className="absolute -left-3.5 -top-1 w-6 h-6 text-primary/50 fill-primary/10" />
                    <p className="text-white/55 leading-relaxed text-base font-light italic">{founderStory}</p>
                  </div>

                  <div className="flex flex-wrap gap-8">
                    {[
                      { val: founderStat1Value, label: founderStat1Label },
                      { val: founderStat2Value, label: founderStat2Label },
                      { val: founderStat3Value, label: founderStat3Label },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-2xl font-black text-gradient-static">{s.val}</p>
                        <p className="text-white/30 text-xs font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── Vision & Mission ── */}
          <section className="relative py-24 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(10,18,35,0.8) 0%, rgba(5,13,26,0.9) 100%)" }}
            />
            <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <span className="section-tag mb-4 inline-flex">{visionTag}</span>
                <h2 className="text-3xl md:text-4xl font-black mt-4 mb-6 leading-tight">{visionTitle}</h2>
                <p className="text-white/50 leading-relaxed mb-5 text-sm md:text-base">{visionDesc1}</p>
                <p className="text-white/50 leading-relaxed text-sm md:text-base">{visionDesc2}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
                <div
                  className="relative rounded-3xl p-8 backdrop-blur-sm"
                  style={{
                    background: "linear-gradient(145deg, rgba(13,24,41,0.95), rgba(10,18,35,0.98))",
                    border: "1px solid rgba(212,175,55,0.2)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,175,55,0.08)",
                  }}
                >
                  <h3 className="text-primary font-black text-lg mb-4">{missionTitle}</h3>
                  <p className="text-white/55 leading-relaxed text-sm">{missionDesc}</p>
                  <div className="mt-8 pt-6 grid grid-cols-3 gap-4 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {[
                      { val: stat1Value, label: stat1Label },
                      { val: stat2Value, label: stat2Label },
                      { val: stat3Value, label: stat3Label },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-primary text-2xl font-black">{s.val}</p>
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ── Core Values ── */}
          <section className="py-24 max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="section-tag mb-4 inline-flex">{valuesTag}</span>
              <h2 className="text-3xl md:text-5xl font-black mt-4">{valuesSubtitle}</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {VALUES.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  className="group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 card-hover"
                  style={{
                    background: "linear-gradient(145deg, rgba(13,24,41,0.8), rgba(10,18,35,0.9))",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.3)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.05),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}
                  >
                    {v.icon}
                  </div>
                  <h3 className="font-black text-xl mb-3 text-white group-hover:text-primary transition-colors duration-300">{v.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Gallery ── */}
          <section className="py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="max-w-6xl mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-14"
              >
                <span className="section-tag mb-4 inline-flex">
                  <Camera className="w-3 h-3" />
                  Culinary Gallery
                </span>
                <h2 className="text-3xl md:text-5xl font-black mt-4">Behind the Craft</h2>
                <p className="text-white/40 mt-4 max-w-xl mx-auto text-sm">
                  A glimpse into our kitchens, our food, and the passion that drives every plate we deliver.
                </p>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {galleryImages.map((src, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    onClick={() => setLightbox(src)}
                    className={`relative group overflow-hidden rounded-2xl cursor-zoom-in ${
                      i === 0 ? "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto md:h-120" : "aspect-square"
                    }`}
                    style={{ background: "rgba(10,22,40,0.6)" }}
                  >
                    <img
                      src={src}
                      alt={`Gallery ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-xs font-bold bg-primary/80 px-3 py-1 rounded-full">View</span>
                    </div>
                    <div
                      className="absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ borderColor: "rgba(212,175,55,0.4)" }}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Lightbox ── */}
          {lightbox && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
              onClick={() => setLightbox(null)}
            >
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={lightbox}
                alt="Gallery preview"
                className="max-w-full max-h-[88vh] rounded-2xl shadow-2xl object-contain"
                onClick={e => e.stopPropagation()}
              />
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg transition-all hover:scale-110"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── CTA ── */}
          <section className="relative py-24 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_60%)]" />
            <div className="relative max-w-4xl mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <h2 className="text-3xl md:text-5xl font-black mb-6">
                  Experience <em className="text-gradient not-italic">Premium</em> Culinary Luxury
                </h2>
                <p className="text-white/40 mb-10 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                  Browse our carefully curated menu and taste the difference of master craftsmanship combined with precision kitchen operations.
                </p>
                <Link
                  href="/menu"
                  className="btn-premium inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base"
                >
                  Order Premium Menu <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </main>
  );
}
