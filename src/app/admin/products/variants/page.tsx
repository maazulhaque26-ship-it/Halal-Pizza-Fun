"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, Loader2, Save, X, ChevronDown, Package,
  ArrowLeft, Check, AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import Link from "next/link";
import { ROUTES } from "@/config/constants";

interface Variant {
  _id: string;
  variantName: string;
  price: number;
  sizeLabel?: string;
  isAvailable: boolean;
  sortOrder: number;
}

interface Product {
  _id: string;
  name: string;
  categoryId?: { name: string };
}

function VariantModal({
  mode,
  productId,
  variant,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  productId: string;
  variant?: Variant;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    variantName: variant?.variantName || "",
    price: variant?.price?.toString() || "",
    sizeLabel: variant?.sizeLabel || "",
    isAvailable: variant?.isAvailable ?? true,
    sortOrder: variant?.sortOrder?.toString() || "0",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.variantName.trim() || !form.price) {
      toast.error("Variant name and price are required");
      return;
    }
    setSaving(true);
    try {
      const url =
        mode === "edit"
          ? `/api/products/${productId}/variants/${variant!._id}`
          : `/api/products/${productId}/variants`;

      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantName: form.variantName,
          price: parseFloat(form.price),
          sizeLabel: form.sizeLabel || undefined,
          isAvailable: form.isAvailable,
          sortOrder: parseInt(form.sortOrder) || 0,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(mode === "edit" ? "Variant updated!" : "Variant created!");
        onSave();
        onClose();
      } else {
        toast.error(d.message || "Failed");
      }
    } catch {
      toast.error("Failed to save variant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <h3 className="font-black text-white text-lg">
            {mode === "edit" ? "Edit Variant" : "Add Variant"}
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Variant Name *
            </label>
            <input
              value={form.variantName}
              onChange={(e) => setForm((f) => ({ ...f, variantName: e.target.value }))}
              placeholder="e.g. 4 pcs, Medium, Large"
              className="w-full px-4 py-2.5 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 text-sm transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="250"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 text-sm transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Size Label (optional)
            </label>
            <input
              value={form.sizeLabel}
              onChange={(e) => setForm((f) => ({ ...f, sizeLabel: e.target.value }))}
              placeholder="e.g. Small, Family Pack"
              className="w-full px-4 py-2.5 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isAvailable ? "bg-primary" : "bg-white/10"}`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${form.isAvailable ? "translate-x-6" : ""}`}
              />
            </button>
            <span className="text-sm text-gray-400 font-semibold">
              {form.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-xl font-semibold text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-black rounded-xl font-bold text-sm hover:bg-accent transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : mode === "edit" ? "Update" : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VariantsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; variant?: Variant } | null>(null);

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProducts(d.data || []);
      })
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, []);

  const loadVariants = async (product: Product) => {
    setSelectedProduct(product);
    setLoadingVariants(true);
    try {
      const res = await fetch(`/api/products/${product._id}/variants`);
      const d = await res.json();
      if (d.success) setVariants(d.data || []);
    } catch {
      toast.error("Failed to load variants");
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleDelete = async (variantId: string) => {
    if (!selectedProduct) return;
    if (!confirm("Delete this variant?")) return;
    try {
      const res = await fetch(
        `/api/products/${selectedProduct._id}/variants/${variantId}`,
        { method: "DELETE" }
      );
      const d = await res.json();
      if (d.success) {
        setVariants((prev) => prev.filter((v) => v._id !== variantId));
        toast.success("Variant deleted");
      } else {
        toast.error(d.message);
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const refreshVariants = () => {
    if (selectedProduct) loadVariants(selectedProduct);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href={ROUTES.ADMIN.PRODUCTS}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="text-2xl font-black text-white">Variant Management</h2>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Manage size/piece variants for pizza & cheeza products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="p-4 border-b border-white/7">
              <h3 className="font-black text-white text-sm uppercase tracking-widest">
                Select Product
              </h3>
            </div>
            {loadingProducts ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="p-2 max-h-[600px] overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => loadVariants(product)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                      selectedProduct?._id === product._id
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <p className="truncate">{product.name}</p>
                    {product.categoryId && (
                      <p className="text-xs opacity-50 mt-0.5">{product.categoryId.name}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Variants Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between p-4 border-b border-white/7">
              <h3 className="font-black text-white text-sm">
                {selectedProduct ? `${selectedProduct.name} — Variants` : "Select a product"}
              </h3>
              {selectedProduct && (
                <button
                  onClick={() => setModal({ mode: "create" })}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-bold text-xs hover:bg-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variant
                </button>
              )}
            </div>

            {!selectedProduct ? (
              <div className="py-20 text-center text-white/20">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">Select a product to manage its variants</p>
                <p className="text-xs mt-1">Variants apply to Pizza and Cheeza categories</p>
              </div>
            ) : loadingVariants ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : variants.length === 0 ? (
              <div className="py-16 text-center text-white/20">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No variants yet</p>
                <p className="text-xs mt-1">Click "Add Variant" to create size options</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {variants.map((v, i) => (
                  <motion.div
                    key={v._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 bg-white/3 border border-white/7 rounded-xl hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${v.isAvailable ? "bg-emerald-400" : "bg-red-400"}`} />
                      <div>
                        <p className="font-bold text-white text-sm">{v.variantName}</p>
                        {v.sizeLabel && <p className="text-xs text-gray-500">{v.sizeLabel}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-primary text-lg">₹{v.price}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal({ mode: "edit", variant: v })}
                          className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v._id)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="mt-4 bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-primary">Variant rules:</strong> Variants only appear on product cards for{" "}
              <strong className="text-white/70">Pizza</strong> and{" "}
              <strong className="text-white/70">Cheeza</strong> categories. Other products display a direct price.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && selectedProduct && (
          <VariantModal
            mode={modal.mode}
            productId={selectedProduct._id}
            variant={modal.variant}
            onClose={() => setModal(null)}
            onSave={refreshVariants}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
