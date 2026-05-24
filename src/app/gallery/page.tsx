"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Camera, Loader2, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { API } from "@/config/constants";

export default function GalleryPage() {
  const [images, setImages] = useState<string[]>([]);
  const [pageSettings, setPageSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ src: string; index: number } | null>(null);

  useEffect(() => {
    fetch(API.SETTINGS, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPageSettings(d.data);
          const aboutGallery: string[] = d.data?.aboutPage?.galleryImages ?? [];
          const pageGallery: string[] = d.data?.galleryPage?.images ?? [];
          const merged = pageGallery.length > 0 ? pageGallery : aboutGallery;
          setImages(merged);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Close lightbox on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight" && lightbox) {
        const next = (lightbox.index + 1) % images.length;
        setLightbox({ src: images[next], index: next });
      }
      if (e.key === "ArrowLeft" && lightbox) {
        const prev = (lightbox.index - 1 + images.length) % images.length;
        setLightbox({ src: images[prev], index: prev });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, images]);

  const navigate = (dir: "prev" | "next") => {
    if (!lightbox) return;
    const next = dir === "next"
      ? (lightbox.index + 1) % images.length
      : (lightbox.index - 1 + images.length) % images.length;
    setLightbox({ src: images[next], index: next });
  };

  return (
    <main className="min-h-screen bg-background text-white font-sans selection:bg-primary selection:text-black">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(212,175,55,0.15),transparent)]">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 text-primary font-black tracking-widest text-xs uppercase px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <Camera className="w-3.5 h-3.5" /> {pageSettings?.galleryPage?.heroTag || "CULINARY GALLERY"}
          </span>
          <h1 className="text-5xl md:text-7xl font-black mt-6 mb-6 tracking-tight leading-none text-white">
            {pageSettings?.galleryPage?.heroTitle || "Behind the Craft"}
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            {pageSettings?.galleryPage?.heroSubtitle || "A glimpse into our kitchens, our food, and the passion that drives every plate we deliver."}
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">Gallery coming soon</p>
            <p className="text-sm mt-1">The admin will upload beautiful photos here shortly.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightbox({ src, index: i })}
                className="relative group overflow-hidden rounded-2xl bg-white/5 cursor-zoom-in w-full block break-inside-avoid mb-4"
              >
                <img
                  src={src}
                  alt={`Gallery image ${i + 1}`}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300" />
                </div>
                {/* Gold border flash */}
                <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 rounded-2xl transition-all duration-300 pointer-events-none" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigate("prev"); }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate("next"); }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <img
            src={lightbox.src}
            alt="Gallery preview"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Close button */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white text-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/60 font-semibold">
            {lightbox.index + 1} / {images.length}
          </p>
        </div>
      )}

      <Footer />
    </main>
  );
}
