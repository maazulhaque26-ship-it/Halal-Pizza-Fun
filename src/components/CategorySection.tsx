"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { UtensilsCrossed, ArrowRight, Sparkles } from "lucide-react";
import { ROUTES } from "@/config/constants";
import { useState, useCallback, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Category {
  _id: string;
  name: string;
  image?: string;
  description?: string;
}

interface CategorySectionProps {
  categories?: Category[];
}

const IMAGE_MAP: Record<string, string> = {
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300",
  cheeza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300",
  burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300",
  wings: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=300",
  sides: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=300",
  drinks: "https://images.unsplash.com/photo-1536935338998-842996e0165d?auto=format&fit=crop&q=80&w=300",
  desserts: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=300",
  dessert: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=300",
  italian: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=300",
  vegan: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=300",
  asian: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=300",
  chinese: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=300",
  indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=300",
  mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=300",
};

const FALLBACK_CATEGORIES: Category[] = [
  { _id: "1", name: "Pizza",    image: IMAGE_MAP.pizza },
  { _id: "2", name: "Cheeza",   image: IMAGE_MAP.cheeza },
  { _id: "3", name: "Burgers",  image: IMAGE_MAP.burgers },
  { _id: "4", name: "Wings",    image: IMAGE_MAP.wings },
  { _id: "5", name: "Sides",    image: IMAGE_MAP.sides },
  { _id: "6", name: "Drinks",   image: IMAGE_MAP.drinks },
  { _id: "7", name: "Desserts", image: IMAGE_MAP.desserts },
  { _id: "8", name: "Italian",  image: IMAGE_MAP.italian },
];

function getCategoryImage(cat: Category): string | null {
  if (cat.image && cat.image.trim() !== "") return cat.image;
  return IMAGE_MAP[cat.name.toLowerCase()] || null;
}

function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const imageUrl = getCategoryImage(cat);
  const [imgFailed, setImgFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        href={`${ROUTES.MENU}?category=${cat._id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-500 text-center cursor-pointer select-none"
        style={{
          background: isHovered
            ? "linear-gradient(145deg, rgba(20, 40, 70, 0.9), rgba(15, 28, 55, 0.95))"
            : "linear-gradient(145deg, rgba(13, 24, 41, 0.7), rgba(10, 18, 35, 0.8))",
          border: isHovered
            ? "1px solid rgba(212, 175, 55, 0.4)"
            : "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: isHovered
            ? "0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(212,175,55,0.12)"
            : "0 4px 20px rgba(0,0,0,0.2)",
          transform: isHovered ? "translateY(-6px)" : "translateY(0)",
        }}
      >
        {/* Glow orb behind image */}
        <div
          className="absolute inset-0 rounded-2xl transition-opacity duration-500"
          style={{
            background: "radial-gradient(ellipse at top, rgba(212,175,55,0.08) 0%, transparent 70%)",
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Image Container */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 z-10">
          {/* Shine effect */}
          <div
            className="absolute inset-0 z-20 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
              opacity: isHovered ? 1 : 0,
            }}
          />

          {imageUrl && !imgFailed ? (
            <img
              src={imageUrl}
              alt={cat.name}
              className="w-full h-full object-cover transition-transform duration-700"
              style={{ transform: isHovered ? "scale(1.15)" : "scale(1)" }}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <UtensilsCrossed className="w-7 h-7 text-primary/70" />
            </div>
          )}

          {/* Gold ring on hover */}
          <div
            className="absolute inset-0 rounded-xl border-2 transition-all duration-300"
            style={{
              borderColor: isHovered ? "rgba(212,175,55,0.5)" : "transparent",
            }}
          />
        </div>

        {/* Category Name */}
        <span
          className="text-xs font-bold leading-tight transition-colors duration-300 z-10"
          style={{ color: isHovered ? "#D4AF37" : "rgba(255,255,255,0.75)" }}
        >
          {cat.name}
        </span>

        {/* Bottom indicator */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-500 bg-primary"
          style={{ width: isHovered ? "50%" : "0%" }}
        />
      </Link>
    </motion.div>
  );
}

export default function CategorySection({ categories }: CategorySectionProps) {
  const displayCategories = categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      gsap.from(".cat-heading-line", {
        scaleX: 0,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-background via-[#070f20] to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04),transparent_70%)]" />

      {/* Decorative grid lines */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div ref={headingRef} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <span className="section-tag">
              <Sparkles className="w-3 h-3" />
              Browse by Category
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight"
          >
            What are you{" "}
            <em className="text-gradient not-italic">craving?</em>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/40 text-base max-w-md mx-auto"
          >
            Explore {displayCategories.length} premium categories crafted to satisfy every taste
          </motion.p>

          {/* Animated underline */}
          <div className="mt-6 flex justify-center">
            <div className="relative h-px w-24 overflow-hidden">
              <div className="cat-heading-line absolute inset-0 bg-linear-to-r from-transparent via-primary to-transparent" />
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
          {displayCategories.map((cat, index) => (
            <CategoryCard key={cat._id} cat={cat} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <Link
            href={ROUTES.MENU}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-300 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05))",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#D4AF37",
            }}
          >
            <span className="relative z-10">Explore Full Menu</span>
            <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08))" }}
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
