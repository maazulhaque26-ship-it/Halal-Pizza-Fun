"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { UtensilsCrossed, ArrowRight } from "lucide-react";
import { ROUTES } from "@/config/constants";
import { useState } from "react";

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
  pizza: "/pizza.png",
  cheeza: "/pizza.png",
  burgers: "/hero-bg.png",
  burger: "/hero-bg.png",
  wings: "/hero-bg.png",
  sides: "/pizza.png",
  drinks: "/hero-bg.png",
  desserts: "/pizza.png",
  dessert: "/pizza.png",
  italian: "/hero-bg.png",
  vegan: "/hero-bg.png",
  salad: "/hero-bg.png",
  sushi: "/hero-bg.png",
  asian: "/hero-bg.png",
  chinese: "/hero-bg.png",
  indian: "/hero-bg.png",
  mexican: "/hero-bg.png",
};

const FALLBACK_CATEGORIES: Category[] = [
  { _id: "1", name: "Pizza", image: IMAGE_MAP.pizza },
  { _id: "2", name: "Cheeza", image: IMAGE_MAP.cheeza },
  { _id: "3", name: "Burgers", image: IMAGE_MAP.burgers },
  { _id: "4", name: "Wings", image: IMAGE_MAP.wings },
  { _id: "5", name: "Sides", image: IMAGE_MAP.sides },
  { _id: "6", name: "Drinks", image: IMAGE_MAP.drinks },
  { _id: "7", name: "Desserts", image: IMAGE_MAP.desserts },
  { _id: "8", name: "Italian", image: IMAGE_MAP.italian },
];

function getCategoryImage(cat: Category): string | null {
  if (cat.image && cat.image.trim() !== "") return cat.image;
  return IMAGE_MAP[cat.name.toLowerCase()] || null;
}

function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const imageUrl = getCategoryImage(cat);
  const [imgFailed, setImgFailed] = useState(false);
  const featured = index % 5 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={featured ? "sm:col-span-2" : ""}
    >
      <Link
        href={`${ROUTES.MENU}?category=${cat._id}`}
        className={`group relative block h-full overflow-hidden rounded-[22px] border border-[#2a160d]/10 bg-[#fffaf2] shadow-[0_14px_38px_rgba(63,31,14,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#ef5a24]/35 hover:shadow-[0_24px_54px_rgba(63,31,14,0.14)] ${
          featured ? "min-h-[220px]" : "min-h-[168px]"
        }`}
      >
        <div className="absolute inset-0">
          {imageUrl && !imgFailed ? (
            <img
              src={imageUrl}
              alt={cat.name}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f1dfc8]">
              <UtensilsCrossed className="h-8 w-8 text-[#7c4a2b]" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_18%,rgba(25,13,8,0.82)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="mb-2 inline-flex rounded-full bg-[#fff8ee]/92 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#ef5a24]">
            Menu shelf
          </span>
          <h3 className="font-playfair text-2xl font-black leading-none text-white">{cat.name}</h3>
          {cat.description && featured && (
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-white/74">{cat.description}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function CategorySection({ categories }: CategorySectionProps) {
  const displayCategories = categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <section className="relative overflow-hidden bg-[#fff4e4] px-4 py-18 sm:px-6 md:py-24">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0f1117] to-transparent opacity-70" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 grid gap-6 md:grid-cols-[0.82fr_1fr] md:items-end">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a7471b]">
              Curated cravings
            </span>
            <h2 className="mt-3 font-playfair text-4xl font-black leading-tight text-[#2b160c] sm:text-5xl">
              Start with what smells right.
            </h2>
          </div>
          <div className="md:pl-10">
            <p className="max-w-xl text-sm font-medium leading-7 text-[#6c4d39] sm:text-base">
              Browse by mood, not by a perfect grid. From cheesy classics to late-night sides, every shelf has its own little pull.
            </p>
            <Link
              href={ROUTES.MENU}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ef5a24]/25 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#c94618] shadow-sm transition hover:-translate-y-0.5 hover:border-[#ef5a24]/50"
            >
              Explore Full Menu
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {displayCategories.map((cat, index) => (
            <CategoryCard key={cat._id} cat={cat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
