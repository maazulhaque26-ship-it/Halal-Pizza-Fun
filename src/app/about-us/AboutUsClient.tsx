"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  Quote,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Star,
  Clock,
  Award,
} from "lucide-react";
import { API } from "@/config/constants";

const FALLBACK_GALLERY = ["/hero-bg.png", "/pizza.png", "/hero-bg.png", "/pizza.png", "/hero-bg.png", "/pizza.png"];

function VideoSection({
  videoUrl,
  videoTitle,
  videoSubtitle,
}: {
  videoUrl: string;
  videoTitle: string;
  videoSubtitle: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 1.08]);

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
    <section ref={sectionRef} className="relative min-h-[560px] overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale }}>
        <video ref={videoRef} src={videoUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,13,9,0.3)_0%,rgba(20,13,9,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,13,9,0.86)_0%,rgba(20,13,9,0.48)_60%,rgba(20,13,9,0.84)_100%)]" />

      <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-center px-4 sm:px-6">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-[#ffb44a]/30 bg-[#ffb44a]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb44a]">
            Our story in motion
          </span>
          <h2 className="mt-6 font-playfair text-4xl font-black leading-tight text-[#fff8ee] sm:text-5xl md:text-6xl">{videoTitle}</h2>
          <p className="mt-4 max-w-xl text-sm leading-8 text-[#f8ead7]/72 sm:text-base">{videoSubtitle}</p>
        </div>
      </div>

      <div className="absolute bottom-7 right-7 flex items-center gap-3">
        <button onClick={togglePlay} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ffb44a]/35 bg-[#140d09]/68 text-[#ffb44a] backdrop-blur-md">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button onClick={toggleMute} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ffb44a]/35 bg-[#140d09]/68 text-[#ffb44a] backdrop-blur-md">
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSettings(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
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

  const heroTitle = getVal("aboutPage.heroTitle", "Redefining Premium Gastronomy at Home");
  const heroSubtitle = getVal(
    "aboutPage.heroSubtitle",
    "Founded with a passion for exceptional culinary experiences, HPF redefines premium food delivery."
  );
  const heroTag = getVal("aboutPage.heroTag", "Our Story & Vision");
  const visionTag = getVal("aboutPage.visionTag", "The Vision");
  const visionTitle = getVal("aboutPage.visionTitle", "Elevating Every Meal");
  const visionDesc1 = getVal(
    "aboutPage.visionDesc1",
    "Our vision is to break the barrier between high-end restaurant dining and the comfort of your home."
  );
  const visionDesc2 = getVal(
    "aboutPage.visionDesc2",
    "By combining state-of-the-art kitchen facilities with custom-engineered thermal delivery suites, we preserve the exact temperature and texture intended by our chefs."
  );
  const missionTitle = getVal("aboutPage.missionTitle", "Our Core Mission");
  const missionDesc = getVal(
    "aboutPage.missionDesc",
    "To create a seamless, end-to-end premium dining standard through rigorous ingredient sourcing, master craftsmanship, and white-glove delivery precision."
  );
  const value1Title = getVal("aboutPage.value1Title", "Uncompromised Quality");
  const value1Desc = getVal("aboutPage.value1Desc", "We source the finest ingredients and follow rigorous standard operating procedures.");
  const value2Title = getVal("aboutPage.value2Title", "Route Optimization");
  const value2Desc = getVal("aboutPage.value2Desc", "Every branch operates within hyperlocal zones using real-time dispatch systems.");
  const value3Title = getVal("aboutPage.value3Title", "Premium Experience");
  const value3Desc = getVal("aboutPage.value3Desc", "Packaging is an experience in itself, responsible, structured, and beautifully presented.");
  const founderName = getVal("aboutPage.founderName", "Chef Harpreet Sidhu");
  const founderTitle_ = getVal("aboutPage.founderTitle", "Founder & Executive Chef");
  const founderStory = getVal(
    "aboutPage.founderStory",
    "Born from a lifelong obsession with culinary perfection, HPF was founded in 2019 with a single kitchen and an audacious dream."
  );
  const founderImageUrl = getVal("aboutPage.founderImageUrl", "");
  const founderTag = getVal("aboutPage.founderTag", "Meet The Founder");
  const founderStat1Value = getVal("aboutPage.founderStat1Value", "2019");
  const founderStat1Label = getVal("aboutPage.founderStat1Label", "Founded");
  const founderStat2Value = getVal("aboutPage.founderStat2Value", "15+");
  const founderStat2Label = getVal("aboutPage.founderStat2Label", "Branches");
  const founderStat3Value = getVal("aboutPage.founderStat3Value", "20yr");
  const founderStat3Label = getVal("aboutPage.founderStat3Label", "Experience");
  const valuesTag = getVal("aboutPage.valuesTag", "Our Values");
  const valuesSubtitle = getVal("aboutPage.valuesSubtitle", "The Standards We Live By");
  const stat1Value = getVal("aboutPage.stat1Value", "100%");
  const stat1Label = getVal("aboutPage.stat1Label", "Gourmet");
  const stat2Value = getVal("aboutPage.stat2Value", "20 min");
  const stat2Label = getVal("aboutPage.stat2Label", "Avg Delivery");
  const stat3Value = getVal("aboutPage.stat3Value", "15+");
  const stat3Label = getVal("aboutPage.stat3Label", "Branches");
  const videoUrl = getVal("aboutPage.videoUrl", "");
  const videoTitle = getVal("aboutPage.videoTitle", "Experience Premium Dining");
  const videoSubtitle = getVal("aboutPage.videoSubtitle", "Watch how we craft every dish with passion and precision");

  const rawGallery: string[] = settings?.aboutPage?.galleryImages ?? [];
  const galleryImages = rawGallery.length > 0 ? rawGallery : FALLBACK_GALLERY;

  const VALUES = [
    { icon: <Star className="w-5 h-5 text-[#ef5a24]" />, title: value1Title, desc: value1Desc },
    { icon: <Clock className="w-5 h-5 text-[#ef5a24]" />, title: value2Title, desc: value2Desc },
    { icon: <Award className="w-5 h-5 text-[#ef5a24]" />, title: value3Title, desc: value3Desc },
  ];

  return (
    <main className="min-h-screen bg-[#fff4e4] text-[#2b160c]">
      <Navbar />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#ef5a24]" />
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden bg-[#140d09] px-4 pb-16 pt-28 sm:px-6 md:pb-24 md:pt-36">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#140d09_0%,#2a1309_54%,#0f1117_100%)]" />
            <div className="relative mx-auto max-w-6xl text-center">
              <span className="inline-flex rounded-full border border-[#ffb44a]/25 bg-[#ffb44a]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb44a]">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                {heroTag}
              </span>
              <h1 className="mt-7 font-playfair text-4xl font-black leading-none text-[#fff8ee] sm:text-6xl md:text-7xl">{heroTitle}</h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#f8ead7]/72 sm:text-lg">{heroSubtitle}</p>
              <div className="mt-10 flex flex-wrap justify-center gap-8">
                {[
                  { value: stat1Value, label: stat1Label },
                  { value: stat2Value, label: stat2Label },
                  { value: stat3Value, label: stat3Label },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-3xl font-black text-[#ffb44a]">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {videoUrl && <VideoSection videoUrl={videoUrl} videoTitle={videoTitle} videoSubtitle={videoSubtitle} />}

          <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 md:py-22">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="relative mx-auto w-fit lg:mx-0">
                <div className="h-80 w-80 overflow-hidden rounded-full border-4 border-[#ef5a24]/28 bg-[#fff8ee] shadow-[0_24px_70px_rgba(73,40,18,0.2)] md:h-88 md:w-88">
                  {founderImageUrl ? (
                    <img src={founderImageUrl} alt={founderName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-playfair text-7xl font-black text-[#ef5a24]/65">{founderName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-3 right-1 rounded-2xl border border-[#ead8c1] bg-[#fffaf2] px-4 py-2.5">
                  <p className="text-sm font-black text-[#2b160c]">{founderName}</p>
                  <p className="text-[11px] font-semibold text-[#8f6b52]">{founderTitle_}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a7471b]">{founderTag}</span>
              <h2 className="mt-3 font-playfair text-4xl font-black text-[#2b160c]">{founderName}</h2>
              <p className="mt-1 text-sm font-semibold text-[#8f6b52]">{founderTitle_}</p>
              <div className="relative mt-6 rounded-2xl border border-[#ead8c1] bg-[#fffaf2] p-5">
                <Quote className="absolute right-4 top-4 h-7 w-7 text-[#ef5a24]/20" />
                <p className="text-sm leading-8 text-[#6d5342]">{founderStory}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-7">
                {[
                  { val: founderStat1Value, label: founderStat1Label },
                  { val: founderStat2Value, label: founderStat2Label },
                  { val: founderStat3Value, label: founderStat3Label },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-black text-[#c94618]">{s.val}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8f6b52]">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="border-y border-[#ead8c1] bg-[#fff8ee] py-16">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-9 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a7471b]">{visionTag}</span>
                <h2 className="mt-3 font-playfair text-4xl font-black text-[#2b160c] md:text-5xl">{visionTitle}</h2>
                <p className="mt-5 text-sm leading-8 text-[#6d5342]">{visionDesc1}</p>
                <p className="mt-4 text-sm leading-8 text-[#6d5342]">{visionDesc2}</p>
              </div>
              <div className="rounded-3xl border border-[#ead8c1] bg-white p-7">
                <h3 className="font-playfair text-3xl font-black text-[#2b160c]">{missionTitle}</h3>
                <p className="mt-4 text-sm leading-8 text-[#6d5342]">{missionDesc}</p>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#ead8c1] pt-5 text-center">
                  {[
                    { val: stat1Value, label: stat1Label },
                    { val: stat2Value, label: stat2Label },
                    { val: stat3Value, label: stat3Label },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-2xl font-black text-[#c94618]">{s.val}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8f6b52]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-22">
            <div className="mb-10 text-center">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a7471b]">{valuesTag}</span>
              <h2 className="mt-3 font-playfair text-4xl font-black text-[#2b160c] sm:text-5xl">{valuesSubtitle}</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {VALUES.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="rounded-[26px] border border-[#ead8c1] bg-[#fffaf2] p-6 shadow-[0_18px_46px_rgba(73,40,18,0.08)]"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0dd]">{v.icon}</div>
                  <h3 className="text-xl font-black text-[#2b160c]">{v.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#6d5342]">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="border-t border-[#ead8c1] py-16 md:py-22">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-10 text-center">
                <span className="inline-flex rounded-full border border-[#ef5a24]/25 bg-[#ef5a24]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#c94618]">
                  <Camera className="mr-2 h-3.5 w-3.5" />
                  Culinary gallery
                </span>
                <h2 className="mt-5 font-playfair text-4xl font-black text-[#2b160c] md:text-5xl">Behind The Craft</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                {galleryImages.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox(src)}
                    className={`group relative overflow-hidden rounded-2xl border border-[#ead8c1] bg-[#fffaf2] ${
                      i === 0 ? "md:col-span-2 md:row-span-2 md:h-[420px]" : "aspect-square"
                    }`}
                  >
                    <img src={src} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(20,13,9,0.58)_100%)]" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {lightbox && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" onClick={() => setLightbox(null)}>
              <motion.img
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                src={lightbox}
                alt="Gallery preview"
                className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setLightbox(null)}
                className="absolute right-5 top-5 rounded-full border border-white/25 bg-white/12 px-3 py-2 text-sm font-black text-white"
              >
                Close
              </button>
            </div>
          )}

          <section className="relative overflow-hidden bg-[#140d09] px-4 py-18 text-center sm:px-6 md:py-24">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#140d09_0%,#2a1309_54%,#0f1117_100%)]" />
            <div className="relative mx-auto max-w-4xl">
              <h2 className="font-playfair text-4xl font-black text-[#fff8ee] md:text-5xl">
                Experience <span className="text-[#ffb44a]">Premium</span> Culinary Luxury
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#f8ead7]/65">
                Browse our carefully curated menu and taste the difference of master craftsmanship combined with precision kitchen operations.
              </p>
              <Link
                href="/menu"
                className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-[#ef5a24] px-8 py-4 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_0_#9b3214] transition hover:translate-y-[2px] hover:bg-[#dc4818] hover:shadow-[0_3px_0_#9b3214]"
              >
                Order Premium Menu
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </>
      )}

      <Footer />
    </main>
  );
}
