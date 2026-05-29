"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Leaf, Clock, Star, X, SlidersHorizontal,
  ShoppingBag, Check, Sparkles, Plus,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCartStore } from "@/store/useCartStore";
import { useBranchStore } from "@/store/useBranchStore";
import { toast } from "@/components/ui/Toast";
import { API, ASSETS } from "@/config/constants";

interface Category { _id: string; name: string; slug?: string; image?: string; }
interface Variant { _id: string; variantName: string; price: number; sizeLabel?: string; isAvailable: boolean; }
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVegetarian?: boolean;
  foodType?: "veg" | "nonveg" | "other";
  preparationTimeMin?: number;
  hasVariants?: boolean;
  // Category still populated for display purposes
  categoryId?: { _id: string; name: string; slug?: string } | string;
}

// ── Premium Product Card ─────────────────────────────────────────────────────
const COLOR_THEMES = [
  {
    bg: "bg-[#fff7f0]", // warm orange/beige tint
    border: "border-[#ffdcc2]",
    btn: "bg-[#ff6813] hover:bg-[#e05408]",
    btnBorder: "border-[#d84e06]",
    shadow: "shadow-[0_4px_0_#a83600]",
    text: "text-[#3a200d]",
    desc: "text-[#6b5240]",
    badgeBg: "bg-[#ff6813]/10 text-[#ff6813]",
    cartBtnBg: "bg-white text-[#ff6813] border-[#ffdcc2] hover:bg-[#ff6813] hover:text-white",
  },
  {
    bg: "bg-[#f7f0ff]", // soft lavender tint
    border: "border-[#e0cfff]",
    btn: "bg-[#6c1cd4] hover:bg-[#5914b3]",
    btnBorder: "border-[#5211a8]",
    shadow: "shadow-[0_4px_0_#38077d]",
    text: "text-[#230d3d]",
    desc: "text-[#55406b]",
    badgeBg: "bg-[#6c1cd4]/10 text-[#6c1cd4]",
    cartBtnBg: "bg-white text-[#6c1cd4] border-[#e0cfff] hover:bg-[#6c1cd4] hover:text-white",
  },
  {
    bg: "bg-[#f0fffa]", // soft mint/teal tint
    border: "border-[#cfffef]",
    btn: "bg-[#119d77] hover:bg-[#0d8463]",
    btnBorder: "border-[#0a6f54]",
    shadow: "shadow-[0_4px_0_#054b38]",
    text: "text-[#0d362a]",
    desc: "text-[#40685e]",
    badgeBg: "bg-[#119d77]/10 text-[#119d77]",
    cartBtnBg: "bg-white text-[#119d77] border-[#cfffef] hover:bg-[#119d77] hover:text-white",
  },
  {
    bg: "bg-[#fff0f4]", // soft pink tint
    border: "border-[#ffcfdd]",
    btn: "bg-[#d3225a] hover:bg-[#b01646]",
    btnBorder: "border-[#a3113e]",
    shadow: "shadow-[0_4px_0_#750426]",
    text: "text-[#3d0d1b]",
    desc: "text-[#6b404d]",
    badgeBg: "bg-[#d3225a]/10 text-[#d3225a]",
    cartBtnBg: "bg-white text-[#d3225a] border-[#ffcfdd] hover:bg-[#d3225a] hover:text-white",
  }
];

function MenuProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCartStore();
  const { selectedBranch } = useBranchStore();
  const [added, setAdded] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [variantsLoaded, setVariantsLoaded] = useState(false);

  const showVariants = product.hasVariants === true;
  const theme = COLOR_THEMES[index % COLOR_THEMES.length];

  // Fetch variants as soon as we know this product uses them
  useEffect(() => {
    if (!showVariants || variantsLoaded) return;
    fetch(`/api/products/${product._id}/variants`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length > 0) {
          const available = (d.data as Variant[]).filter((v) => v.isAvailable);
          setVariants(d.data);
          // Pre-select the first available variant
          setSelectedVariant(available[0] ?? d.data[0]);
        }
        setVariantsLoaded(true);
      })
      .catch(() => setVariantsLoaded(true));
  }, [product._id, showVariants, variantsLoaded]);

  const hasLoadedVariants = showVariants && variantsLoaded && variants.length > 0;
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;

  const handleAdd = () => {
    if (showVariants && hasLoadedVariants && !selectedVariant) {
      toast.error("Please select a size first");
      return;
    }
    const label = selectedVariant
      ? `${product.name} — ${selectedVariant.variantName}`
      : product.name;

    addItem(
      {
        productId: product._id,
        name: label,
        price: currentPrice,
        quantity: 1,
        image: product.image || ASSETS.FALLBACK_FOOD_IMAGE,
        selectedAddons: [],
        variantId: selectedVariant?._id,
        variantLabel: selectedVariant?.variantName,
      },
      selectedBranch?._id || "default"
    );
    setAdded(true);
    toast.success(`${label} added! 🍕`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group relative"
    >
      <div
        className={`relative overflow-hidden rounded-[24px] border-2 ${theme.border} ${theme.bg} shadow-md transition-all duration-300 h-full flex flex-col`}
        style={{
          transform: "translateY(0px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.01)";
        }}
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden shrink-0">
          <img
            src={product.image || ASSETS.FALLBACK_FOOD_IMAGE}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const t = e.currentTarget;
              if (t.src !== ASSETS.FALLBACK_FOOD_IMAGE) t.src = ASSETS.FALLBACK_FOOD_IMAGE;
            }}
          />

          {/* Veg / Non-veg badge */}
          <div className="absolute top-3 left-3 z-10">
            {(() => {
              const foodType = product.foodType || (product.isVegetarian ? "veg" : "nonveg");
              if (foodType === "veg") {
                return (
                  <span className="flex items-center gap-1 bg-[#119d77] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                    <Leaf className="w-2.5 h-2.5" /> Veg
                  </span>
                );
              } else if (foodType === "nonveg") {
                return (
                  <span className="flex items-center gap-1 bg-[#d3225a] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" /> Non-Veg
                  </span>
                );
              }
              return null;
            })()}
          </div>

          {/* Quick Plus Basket Button */}
          <button
            onClick={handleAdd}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-300 ${theme.cartBtnBg} z-10`}
          >
            {added ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className={`font-sans font-black text-sm ${theme.text} leading-tight line-clamp-1`}>
              {product.name}
            </h3>
            <span className={`font-sans font-black text-sm ${theme.text} shrink-0`}>
              ₹{currentPrice}
            </span>
          </div>

          <p className={`text-xs ${theme.desc} line-clamp-2 mb-4 leading-relaxed flex-1`}>
            {product.description}
          </p>

          {/* Rating + Time */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${s <= 4 ? "fill-amber-400 text-amber-400" : "fill-[#d2c2b4] text-[#d2c2b4]"}`}
                />
              ))}
            </div>
            {product.preparationTimeMin && (
              <div className={`flex items-center gap-1 text-[10px] font-bold ${theme.desc} opacity-80`}>
                <Clock className="w-3 h-3" />
                <span>{product.preparationTimeMin} mins</span>
              </div>
            )}
          </div>

          {/* ── Variant Selector ── */}
          {showVariants && (
            <div className="mb-4">
              {!variantsLoaded ? (
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-7 w-16 bg-black/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : hasLoadedVariants ? (
                <div className="flex flex-wrap gap-1.5">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?._id === v._id;
                    return (
                      <button
                        key={v._id}
                        onClick={() => v.isAvailable && setSelectedVariant(v)}
                        disabled={!v.isAvailable}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 border ${
                          isSelected
                            ? `bg-black/5 ${theme.text} border-black/20`
                            : `bg-white/50 ${theme.desc} border-black/5 hover:border-black/20`
                        }`}
                      >
                        {v.variantName}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}

          {/* Retro 3D Add to Cart CTA */}
          <button
            onClick={handleAdd}
            disabled={showVariants && hasLoadedVariants && !selectedVariant}
            className={`w-full py-3 rounded-xl font-sans font-black text-xs uppercase tracking-wider text-white border-2 ${theme.btnBorder} ${theme.btn} ${theme.shadow} flex items-center justify-center gap-2 hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(0,0,0,0.15)] active:translate-y-[4px] active:shadow-none transition-all duration-150`}
          >
            <span>{added ? "Added!" : "Order Now"}</span>
            <span className="text-sm">🍳</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Menu Content ─────────────────────────────────────────────────────────────
function MenuContent() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, prodsRes, settingsRes] = await Promise.all([
          fetch(API.CATEGORIES),
          fetch(API.PRODUCTS),
          fetch(API.SETTINGS),
        ]);
        const catsData = await catsRes.json();
        const prodsData = await prodsRes.json();
        const settingsData = await settingsRes.json();
        if (catsData.success) setCategories(catsData.data);
        if (prodsData.success) {
          setProducts(prodsData.data);
          setFiltered(prodsData.data);
        }
        if (settingsData.success) setSettings(settingsData.data);
      } catch {
        toast.error("Failed to load menu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam) setSelectedCat(catParam);
  }, [searchParams]);

  useEffect(() => {
    let result = [...products];
    if (selectedCat !== "all") {
      result = result.filter((p) =>
        typeof p.categoryId === "object"
          ? p.categoryId?._id === selectedCat
          : p.categoryId === selectedCat
      );
    }
    if (vegOnly) {
      result = result.filter((p) => {
        const ft = p.foodType || (p.isVegetarian ? "veg" : "nonveg");
        return ft === "veg";
      });
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [products, selectedCat, vegOnly, query]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        siteName={settings?.siteName}
        logoUrl={settings?.logoUrl}
        mobileLogoUrl={settings?.mobileLogoUrl}
        darkModeLogoUrl={settings?.darkModeLogoUrl}
      />

      {/* ── Premium Header ── */}
      <div className="relative pt-28 pb-14 md:pt-32 md:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-[#070f20] to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />
        <motion.div
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full"
        />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Menu</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-6xl font-black text-white mb-3 tracking-tight"
          >
            Explore{" "}
            <span className="text-gradient italic">Everything</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-lg"
          >
            {filtered.length} dishes available · Crafted with passion
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative mt-6 max-w-xl"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for dishes, cuisines..."
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 focus:border-primary/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-white placeholder:text-white/30 font-medium transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Filters & Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 items-center scrollbar-none">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedCat === "all"
                ? "bg-primary text-black shadow-lg shadow-primary/25"
                : "bg-white/5 text-white/70 border border-white/10 hover:border-primary/30"
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCat(cat._id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCat === cat._id
                  ? "bg-primary text-black shadow-lg shadow-primary/25"
                  : "bg-white/5 text-white/70 border border-white/10 hover:border-primary/30"
              }`}
            >
              {cat.name}
            </button>
          ))}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`ml-auto shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition-all ${
              showFilters || vegOnly
                ? "bg-primary text-black border-primary"
                : "bg-white/5 text-white/60 border-white/10"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4 flex-wrap">
                <button
                  onClick={() => setVegOnly((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                    vegOnly ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" : "border-white/10 text-white/60"
                  }`}
                >
                  <Leaf className="w-4 h-4" />
                  Vegetarian Only
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-bold text-white/70 mb-2">No dishes found</h3>
            <p className="text-white/40">Try adjusting your search or filters</p>
            <button
              onClick={() => { setQuery(""); setSelectedCat("all"); setVegOnly(false); }}
              className="mt-6 px-6 py-3 bg-primary text-black rounded-xl font-bold hover:bg-accent transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filtered.map((product, i) => (
                <MenuProductCard key={product._id} product={product} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Footer
        siteName={settings?.siteName}
        contactEmail={settings?.contactEmail}
        contactPhone={settings?.contactPhone}
        socialLinks={settings?.socialLinks}
        footerLogoUrl={settings?.footerLogoUrl}
      />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
