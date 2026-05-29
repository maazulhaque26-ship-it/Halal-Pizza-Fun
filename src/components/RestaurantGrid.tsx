"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Star, Clock, Leaf, ChevronDown, Plus, Check, Sparkles,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useBranchStore } from "@/store/useBranchStore";
import { ASSETS, ROUTES } from "@/config/constants";
import { toast } from "./ui/Toast";
import Link from "next/link";

interface Variant {
  _id: string;
  variantName: string;
  price: number;
  sizeLabel?: string;
  isAvailable: boolean;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVegetarian?: boolean;
  foodType?: "veg" | "nonveg" | "other";
  preparationTimeMin?: number;
  categoryId?: { _id: string; name: string; slug?: string } | string;
  hasVariants?: boolean;
  variants?: Variant[];
}

interface RestaurantGridProps {
  products?: Product[];
}

// Static fallback cards for when DB has no data yet
const FALLBACK_PRODUCTS: Product[] = [
  {
    _id: "f1",
    name: "The Golden Truffle Pizza",
    description: "Premium truffle oil, wild mushrooms, and aged mozzarella on a crispy base.",
    price: 320,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
    isVegetarian: true,
    preparationTimeMin: 25,
  },
  {
    _id: "f2",
    name: "Wagyu Craft Burger",
    description: "Double wagyu patty, caramelized onions, special sauce on artisan brioche.",
    price: 240,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    isVegetarian: false,
    preparationTimeMin: 15,
  },
  {
    _id: "f3",
    name: "Sushi Zen Platter",
    description: "Assorted premium nigiri and sashimi crafted by our master chef.",
    price: 450,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
    isVegetarian: false,
    preparationTimeMin: 20,
  },
  {
    _id: "f4",
    name: "Mediterranean Bowl",
    description: "Falafel, hummus, tabbouleh, and fresh veggies over saffron rice.",
    price: 180,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    isVegetarian: true,
    preparationTimeMin: 12,
  },
];

// Categories that support variant dropdown (by slug or name match)
const VARIANT_CATEGORY_SLUGS = ["pizza", "cheeza", "cheezas"];

function isCategoryVariantEnabled(categoryId: Product["categoryId"]): boolean {
  if (!categoryId) return false;
  if (typeof categoryId === "string") return false;
  const name = (categoryId.name || "").toLowerCase();
  const slug = (categoryId.slug || "").toLowerCase();
  return VARIANT_CATEGORY_SLUGS.some((s) => name.includes(s) || slug.includes(s));
}

/** Single premium product card */
function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const { addItem } = useCartStore();
  const { selectedBranch } = useBranchStore();
  const [added, setAdded] = useState(false);
  const [variants, setVariants] = useState<Variant[]>(product.variants || []);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [variantOpen, setVariantOpen] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const showVariants = isCategoryVariantEnabled(product.categoryId);

  // Lazy-load variants when needed
  useEffect(() => {
    if (showVariants && variants.length === 0) {
      setLoadingVariants(true);
      fetch(`/api/products/${product._id}/variants`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data.length > 0) {
            setVariants(d.data);
            setSelectedVariant(d.data[0]);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingVariants(false));
    }
  }, [product._id, showVariants, variants.length]);

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const hasVariantData = showVariants && variants.length > 0;

  const handleAddToCart = () => {
    const itemLabel = selectedVariant
      ? `${product.name} — ${selectedVariant.variantName}`
      : product.name;

    addItem(
      {
        productId: product._id,
        name: itemLabel,
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
    toast.success(`${itemLabel} added to cart! 🍕`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="group relative"
    >
      <div
        className="relative overflow-hidden rounded-2xl transition-all duration-500"
        style={{
          background: "linear-gradient(145deg, rgba(13,24,41,0.95), rgba(10,18,35,0.98))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.25)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 60px rgba(0,0,0,0.5), 0 0 30px rgba(212,175,55,0.08)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(0,0,0,0.4)";
        }}
      >
        {/* ── Image ── */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={product.image || ASSETS.FALLBACK_FOOD_IMAGE}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e) => {
              const t = e.currentTarget;
              if (t.src !== ASSETS.FALLBACK_FOOD_IMAGE) t.src = ASSETS.FALLBACK_FOOD_IMAGE;
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-[#070f20] via-transparent to-transparent" />

          {/* Veg/Non-Veg Badge */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {(() => {
              const foodType = product.foodType || (product.isVegetarian ? "veg" : "nonveg");
              if (foodType === "veg") {
                return (
                  <span className="flex items-center gap-1 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-lg">
                    <Leaf className="w-2.5 h-2.5" /> Veg
                  </span>
                );
              } else if (foodType === "nonveg") {
                return (
                  <span className="flex items-center gap-1 bg-red-500/80 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-red-200 inline-block" /> Non-Veg
                  </span>
                );
              }
              return null;
            })()}
          </div>

          {/* Floating price badge */}
          <motion.div
            key={currentPrice}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-3 right-3 bg-primary text-black text-sm font-black px-3 py-1.5 rounded-xl shadow-lg shadow-primary/30"
          >
            ₹{currentPrice}
          </motion.div>
        </div>

        {/* ── Content ── */}
        <div className="p-5">
          <h3 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {product.name}
          </h3>
          <p className="text-sm text-white/50 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Rating + Time */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${s <= 4 ? "fill-primary text-primary" : "fill-white/10 text-white/20"}`}
                />
              ))}
              <span className="text-xs font-bold text-white/60 ml-1">4.8</span>
            </div>
            {product.preparationTimeMin && (
              <div className="flex items-center gap-1 text-white/40">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{product.preparationTimeMin} min</span>
              </div>
            )}
          </div>

          {/* ── Variant Dropdown ── */}
          {showVariants && (
            <div className="mb-4 relative">
              {loadingVariants ? (
                <div className="w-full h-10 bg-white/5 rounded-xl animate-pulse" />
              ) : hasVariantData ? (
                <div className="relative">
                  <button
                    onClick={() => setVariantOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl text-sm font-semibold text-white transition-all"
                  >
                    <span className="truncate">
                      {selectedVariant ? `${selectedVariant.variantName} — ₹${selectedVariant.price}` : "Select Size"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-white/50 ml-2 shrink-0 transition-transform duration-200 ${variantOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {variantOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                        style={{ transformOrigin: "top", background: "rgba(13,24,41,0.98)", border: "1px solid rgba(212,175,55,0.15)" }}
                        className="absolute top-full left-0 right-0 mt-1.5 z-20 rounded-xl overflow-hidden shadow-2xl shadow-black/60"
                      >
                        {variants.map((v) => (
                          <button
                            key={v._id}
                            onClick={() => {
                              setSelectedVariant(v);
                              setVariantOpen(false);
                            }}
                            disabled={!v.isAvailable}
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors ${
                              selectedVariant?._id === v._id
                                ? "bg-primary/15 text-primary"
                                : "text-white/80 hover:bg-white/5"
                            } ${!v.isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            <span>{v.variantName}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-primary">₹{v.price}</span>
                              {selectedVariant?._id === v._id && (
                                <Check className="w-3.5 h-3.5 text-primary" />
                              )}
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-xs text-white/30 text-center py-1">No size variants configured</p>
              )}
            </div>
          )}

          {/* ── Add to Cart ── */}
          <motion.button
            onClick={handleAddToCart}
            whileTap={{ scale: 0.96 }}
            disabled={showVariants && !selectedVariant && hasVariantData}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
              added
                ? "bg-emerald-500 text-white shadow-emerald-500/25"
                : "bg-primary hover:bg-accent text-black shadow-primary/25 hover:shadow-primary/40"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                Added!
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function RestaurantGrid({ products }: RestaurantGridProps) {
  const displayProducts =
    products && products.length > 0 ? products : FALLBACK_PRODUCTS;

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 gap-4"
        >
          <div>
            <span className="section-tag mb-4 inline-flex">
              <Sparkles className="w-3 h-3" />
              Our Specialties
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-tight">
              Recommended{" "}
              <em className="text-gradient not-italic">for You</em>
            </h2>
          </div>
          <Link
            href={ROUTES.MENU}
            className="flex items-center gap-2 text-primary font-bold hover:text-accent transition-colors border-b border-primary/30 pb-0.5"
          >
            View Full Menu →
          </Link>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {displayProducts.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
