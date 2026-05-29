"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Clock, Leaf, ChevronDown, Plus, Check, ArrowRight } from "lucide-react";
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

const FALLBACK_PRODUCTS: Product[] = [
  {
    _id: "f1",
    name: "The Golden Truffle Pizza",
    description: "Premium truffle oil, wild mushrooms, and aged mozzarella on a crispy base.",
    price: 320,
    image: "/pizza.png",
    isVegetarian: true,
    preparationTimeMin: 25,
  },
  {
    _id: "f2",
    name: "Wagyu Craft Burger",
    description: "Double wagyu patty, caramelized onions, special sauce on artisan brioche.",
    price: 240,
    image: "/hero-bg.png",
    isVegetarian: false,
    preparationTimeMin: 15,
  },
  {
    _id: "f3",
    name: "Sushi Zen Platter",
    description: "Assorted premium nigiri and sashimi crafted by our master chef.",
    price: 450,
    image: "/hero-bg.png",
    isVegetarian: false,
    preparationTimeMin: 20,
  },
  {
    _id: "f4",
    name: "Mediterranean Bowl",
    description: "Falafel, hummus, tabbouleh, and fresh veggies over saffron rice.",
    price: 180,
    image: "/pizza.png",
    isVegetarian: true,
    preparationTimeMin: 12,
  },
];

const VARIANT_CATEGORY_SLUGS = ["pizza", "cheeza", "cheezas"];

function isCategoryVariantEnabled(categoryId: Product["categoryId"]): boolean {
  if (!categoryId) return false;
  if (typeof categoryId === "string") return false;
  const name = (categoryId.name || "").toLowerCase();
  const slug = (categoryId.slug || "").toLowerCase();
  return VARIANT_CATEGORY_SLUGS.some((s) => name.includes(s) || slug.includes(s));
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCartStore();
  const { selectedBranch } = useBranchStore();
  const [added, setAdded] = useState(false);
  const [variants, setVariants] = useState<Variant[]>(product.variants || []);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [variantOpen, setVariantOpen] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const showVariants = isCategoryVariantEnabled(product.categoryId);
  const prominent = index % 7 === 0;

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
      ? `${product.name} - ${selectedVariant.variantName}`
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
    toast.success(`${itemLabel} added to cart!`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, delay: index * 0.05 }}
      className={prominent ? "lg:col-span-2" : ""}
    >
      <div className="group relative h-full overflow-hidden rounded-[26px] border border-[#ead8c1] bg-[#fffaf2] shadow-[0_18px_42px_rgba(73,40,18,0.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#ef5a24]/40 hover:shadow-[0_28px_70px_rgba(73,40,18,0.16)]">
        <div className={`relative overflow-hidden ${prominent ? "h-80" : "h-60"}`}>
          <img
            src={product.image || ASSETS.FALLBACK_FOOD_IMAGE}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            onError={(e) => {
              const t = e.currentTarget;
              if (t.src !== ASSETS.FALLBACK_FOOD_IMAGE) t.src = ASSETS.FALLBACK_FOOD_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_35%,rgba(0,0,0,0.55)_100%)]" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {(() => {
              const foodType = product.foodType || (product.isVegetarian ? "veg" : "nonveg");
              if (foodType === "veg") {
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#16724f] shadow-sm">
                    <Leaf className="h-3 w-3" /> Veg
                  </span>
                );
              }
              if (foodType === "nonveg") {
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#b22924] shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-[#b22924]" /> Non-Veg
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <button
            onClick={handleAddToCart}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white text-[#31170d] shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:scale-105 hover:bg-[#ffb44a]"
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
            <div className="flex items-center gap-1 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-md">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-3.5 w-3.5 ${s <= 4 ? "fill-[#ffbf3f] text-[#ffbf3f]" : "fill-white/20 text-white/20"}`} />
              ))}
            </div>
            {product.preparationTimeMin && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-black text-[#3b2418]">
                <Clock className="h-3.5 w-3.5 text-[#ef5a24]" />
                {product.preparationTimeMin} min
              </div>
            )}
          </div>
        </div>

        <div className="flex h-[calc(100%-15rem)] flex-col p-5 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h3 className="line-clamp-2 font-playfair text-2xl font-black leading-tight text-[#2b160c]">
              {product.name}
            </h3>
            <span className="shrink-0 rounded-full bg-[#2b160c] px-3 py-1.5 text-sm font-black text-[#fff6e8]">
              Rs. {currentPrice}
            </span>
          </div>

          <p className="mb-5 line-clamp-2 text-sm font-medium leading-6 text-[#6d5342]">
            {product.description}
          </p>

          {showVariants && (
            <div className="relative mb-4">
              {loadingVariants ? (
                <div className="h-11 w-full animate-pulse rounded-2xl bg-[#ead8c1]" />
              ) : hasVariantData ? (
                <>
                  <button
                    onClick={() => setVariantOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#ead8c1] bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.13em] text-[#4a2614] transition hover:border-[#ef5a24]/40"
                  >
                    <span className="truncate">{selectedVariant ? selectedVariant.variantName : "Choose Size"}</span>
                    <ChevronDown className={`ml-2 h-4 w-4 transition ${variantOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {variantOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-[#ead8c1] bg-white shadow-xl"
                      >
                        {variants.map((v) => (
                          <button
                            key={v._id}
                            onClick={() => {
                              setSelectedVariant(v);
                              setVariantOpen(false);
                            }}
                            disabled={!v.isAvailable}
                            className={`flex w-full items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
                              selectedVariant?._id === v._id ? "bg-[#fff0dd] text-[#c94618]" : "text-[#4a2614] hover:bg-[#fff7ec]"
                            } ${!v.isAvailable ? "cursor-not-allowed opacity-35" : ""}`}
                          >
                            <span>{v.variantName}</span>
                            <span>Rs. {v.price}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : null}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={showVariants && !selectedVariant && hasVariantData}
            className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ef5a24] px-5 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_7px_0_#9b3214] transition hover:translate-y-[2px] hover:bg-[#dc4818] hover:shadow-[0_4px_0_#9b3214] active:translate-y-[6px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {added ? "Added" : "Order Now"}
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function RestaurantGrid({ products }: RestaurantGridProps) {
  const displayProducts = products && products.length > 0 ? products : FALLBACK_PRODUCTS;

  return (
    <section className="relative overflow-hidden bg-[#fff4e4] px-4 py-18 sm:px-6 md:py-24">
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-11 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a7471b]">
              Signature dishes
            </span>
            <h2 className="mt-3 font-playfair text-4xl font-black leading-tight text-[#2b160c] sm:text-5xl">
              Real food, photographed like it matters.
            </h2>
            <p className="mt-4 text-sm font-medium leading-7 text-[#6c4d39] sm:text-base">
              Golden crusts, smoky edges, fresh toppings, and clear prices up front. Pick the plate that looks like tonight.
            </p>
          </div>
          <Link
            href={ROUTES.MENU}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ef5a24]/25 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#c94618] shadow-sm transition hover:-translate-y-0.5 hover:border-[#ef5a24]/50"
          >
            Explore Menu
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {displayProducts.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
