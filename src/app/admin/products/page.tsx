"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, X, Save, Leaf, Package, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import Link from "next/link";
import { API } from "@/config/constants";

interface Category { _id: string; name: string; }
interface Product {
  _id: string; name: string; description: string; price: number;
  image: string; isVegetarian: boolean; isAvailable: boolean;
  preparationTimeMin: number; categoryId: { _id: string; name: string } | string;
  hasVariants?: boolean;
}

interface VariantRow {
  _id?: string;          // undefined = new, not yet persisted
  variantName: string;
  price: number | string;
  isAvailable: boolean;
  sortOrder: number;
}

const empty = {
  name: "", description: "", price: 0, image: "", isVegetarian: false,
  isAvailable: true, preparationTimeMin: 15, categoryId: "", hasVariants: false,
};

const inputCls = "w-full px-4 py-2.5 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 text-sm transition-all";
const smallInputCls = "w-full px-3 py-2 bg-[#0d1117] border border-white/12 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 text-gray-100 placeholder:text-gray-600 text-xs transition-all";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Variant management state
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${API.PRODUCTS}?all=true`),
        fetch(API.CATEGORIES),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pData.success) setProducts(pData.data);
      if (cData.success) setCategories(cData.data);
    } catch { toast.error("Could not load products. Please refresh the page."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const resetVariantState = () => {
    setVariants([]);
    setDeletedVariantIds([]);
  };

  const openNew = () => {
    setForm(empty);
    setEditing(null);
    resetVariantState();
    setShowModal(true);
  };

  const openEdit = async (p: Product) => {
    setForm({
      ...p,
      categoryId: p.categoryId && typeof p.categoryId === "object" ? (p.categoryId as any)._id : p.categoryId || "",
      hasVariants: p.hasVariants ?? false,
    });
    setEditing(p);
    resetVariantState();

    if (p.hasVariants) {
      setVariantsLoading(true);
      try {
        const res = await fetch(`/api/products/${p._id}/variants?all=true`);
        const data = await res.json();
        if (data.success) setVariants(data.data);
      } catch { toast.error("Failed to load variants"); }
      finally { setVariantsLoading(false); }
    }

    setShowModal(true);
  };

  // ── Variant row helpers ────────────────────────────────────────────────────
  const addVariantRow = () => {
    setVariants(v => [...v, { variantName: "", price: "", isAvailable: true, sortOrder: v.length }]);
  };

  const updateVariant = (idx: number, field: keyof VariantRow, value: any) => {
    setVariants(v => v.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const removeVariant = (idx: number) => {
    const row = variants[idx];
    if (row._id) setDeletedVariantIds(d => [...d, row._id!]);
    setVariants(v => v.filter((_, i) => i !== idx));
  };

  const validateVariants = (): boolean => {
    if (!form.hasVariants) return true;
    if (variants.length === 0) {
      toast.error("Add at least one variant when Has Variants is enabled"); return false;
    }
    for (const v of variants) {
      if (!v.variantName.trim()) { toast.error("All variants need a name"); return false; }
      if (!v.price || Number(v.price) <= 0) { toast.error("All variants need a price greater than 0"); return false; }
    }
    const names = variants.map(v => v.variantName.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      toast.error("Variant names must be unique within a product"); return false;
    }
    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "hpf_products");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35_000);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData, signal: controller.signal });
      const data = await res.json();
      if (data.success) {
        setForm((p: any) => ({ ...p, image: data.url }));
        toast.success("Image uploaded!");
      } else toast.error("Image could not be uploaded. You can still save the product without one.");
    } catch (err: any) {
      if (err?.name === "AbortError") toast.error("Upload timed out. You can still save without an image.");
      else toast.error("Image upload failed. You can still save the product without one.");
    } finally {
      clearTimeout(timeout);
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (uploadingImage) { toast.error("Please wait — image is still uploading"); return; }
    if (!form.name?.trim()) { toast.error("Product name is required"); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error("Please enter a valid price"); return; }
    if (!form.categoryId) { toast.error("Please select a category"); return; }
    if (!validateVariants()) return;

    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const body = editing ? { id: editing._id, ...form } : form;
      const res = await fetch(API.PRODUCTS, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(res.status === 401 || res.status === 403
          ? "You don't have permission to do this"
          : "Could not save product. Please try again.");
        return;
      }

      const productId = editing ? editing._id : data.data?._id;

      if (form.hasVariants && productId) {
        for (const vId of deletedVariantIds) {
          await fetch(`/api/products/${productId}/variants/${vId}`, { method: "DELETE" });
        }
        const newRows = variants.filter(v => !v._id);
        for (const row of newRows) {
          if (!row.variantName.trim() || !row.price) continue;
          await fetch(`/api/products/${productId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variantName: row.variantName.trim(),
              price: Number(row.price),
              isAvailable: row.isAvailable,
              sortOrder: row.sortOrder,
            }),
          });
        }
      }

      toast.success(editing ? "Product updated!" : "Product created!");
      setShowModal(false);
      fetchAll();
    } catch { toast.error("Something went wrong. Please check your connection and try again."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`${API.PRODUCTS}?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Product deleted"); fetchAll(); }
      else toast.error("Could not delete product. Please try again.");
    } catch { toast.error("Could not delete product. Please try again."); }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await fetch(API.PRODUCTS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product._id, isAvailable: !product.isAvailable }),
      });
      fetchAll();
    } catch { toast.error("Update failed"); }
  };

  const hasVariantsEnabled = Boolean(form.hasVariants);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Menu Items</h2>
          <p className="text-gray-400 mt-1 text-sm">{products.length} products total</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/products/variants"
            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-white/15 transition-colors shadow-lg">
            <Package className="w-4 h-4" /> <span className="hidden sm:inline">Manage </span>Variants
          </Link>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-primary text-black px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 bg-white/8 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl overflow-hidden group transition-all"
              style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(244,196,48,0.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <div className="relative h-44 overflow-hidden">
                <img src={p.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400"} alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  {p.isVegetarian && (
                    <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
                      <Leaf className="w-3 h-3" /> VEG
                    </span>
                  )}
                  {p.hasVariants && (
                    <span className="flex items-center gap-1 bg-violet-500/80 text-white text-[10px] font-black px-2 py-1 rounded-full">
                      <Package className="w-3 h-3" /> VARIANTS
                    </span>
                  )}
                </div>
                <div className="absolute bottom-3 right-3">
                  <button onClick={() => toggleAvailability(p)}
                    className={`text-[10px] font-black px-3 py-1 rounded-full uppercase transition-all ${p.isAvailable ? "bg-emerald-500 text-white" : "bg-white/8 text-white/60"}`}>
                    {p.isAvailable ? "Available" : "Unavailable"}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white truncate">{p.name}</h3>
                    <p className="text-xs text-gray-400">
                      {p.categoryId && typeof p.categoryId === "object" ? (p.categoryId as any).name : "—"}
                    </p>
                  </div>
                  <span className="text-lg font-black text-primary ml-2">₹{p.price}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{p.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-violet-400/10 text-gray-400 hover:text-violet-400 rounded-xl text-xs font-bold transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(p._id, p.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`w-full h-full sm:h-auto sm:rounded-3xl rounded-none shadow-2xl sm:w-auto sm:${hasVariantsEnabled ? "max-w-2xl" : "max-w-lg"} max-h-full sm:max-h-[90vh] overflow-y-auto transition-all duration-300`}
            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h3 className="text-xl font-black text-white">{editing ? "Edit Product" : "Add Product"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {[
                { label: "Product Name *", key: "name", type: "text" },
                { label: "Base Price (₹) *", key: "price", type: "number" },
                { label: "Prep Time (min)", key: "preparationTimeMin", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
                  <input className={inputCls} type={f.type} value={form[f.key] || ""}
                    onChange={e => setForm((p: any) => ({ ...p, [f.key]: f.type === "number" ? parseFloat(e.target.value) : e.target.value }))} />
                </div>
              ))}

              {/* Product Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Product Image</label>
                <div className="flex items-center gap-4 bg-background border border-white/10 p-3 rounded-xl">
                  {form.image && (
                    <div className="relative shrink-0">
                      <img src={form.image} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-white/10 shadow-sm" />
                      <button type="button" onClick={() => setForm((p: any) => ({ ...p, image: "" }))}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow hover:bg-rose-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <input type="file" accept="image/*" disabled={uploadingImage} onChange={handleImageUpload}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer disabled:opacity-50" />
                    {uploadingImage && (
                      <p className="text-xs text-primary font-bold flex items-center gap-1.5 mt-2 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Category *</label>
                <select className={inputCls} value={form.categoryId || ""}
                  onChange={e => setForm((p: any) => ({ ...p, categoryId: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea className={inputCls} rows={3} value={form.description || ""}
                  onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
              </div>

              {/* Toggles row */}
              <div className="flex flex-wrap gap-4">
                {[{ key: "isVegetarian", label: "Vegetarian" }, { key: "isAvailable", label: "Available" }].map(f => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[f.key] || false}
                      onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary" />
                    <span className="text-sm font-semibold text-gray-300">{f.label}</span>
                  </label>
                ))}
                {/* Has Variants toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.hasVariants || false}
                    onChange={e => {
                      const checked = e.target.checked;
                      setForm((p: any) => ({ ...p, hasVariants: checked }));
                      if (!checked) {
                        // Clear pending new variants but keep deletedVariantIds so edits are saved
                        setVariants(v => v.filter(row => row._id)); // keep existing, they'll be deleted on save if needed
                      }
                    }}
                    className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm font-semibold text-gray-300">Has Variants</span>
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">sizes / quantities</span>
                </label>
              </div>

              {/* ── Inline Variant Manager ─────────────────────────────────── */}
              <AnimatePresence>
                {hasVariantsEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-2xl border border-white/10 overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-gray-200">Product Variants</span>
                          <span className="text-xs text-gray-500">({variants.length})</span>
                        </div>
                        <button onClick={addVariantRow}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 hover:bg-primary/25 text-primary rounded-lg text-xs font-bold transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Add Variant
                        </button>
                      </div>

                      {variantsLoading ? (
                        <div className="p-6 flex items-center justify-center gap-2 text-gray-500 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading variants…
                        </div>
                      ) : variants.length === 0 ? (
                        <div className="p-6 text-center">
                          <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No variants yet.</p>
                          <p className="text-xs text-gray-600 mt-1">Click "Add Variant" to create sizes or quantities.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/6">
                          {/* Header row */}
                          <div className="grid grid-cols-[1fr_80px_60px_28px] gap-2 px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            <span>Variant Name</span>
                            <span>Price (₹)</span>
                            <span>Avail.</span>
                            <span />
                          </div>
                          {variants.map((row, idx) => (
                            <div key={idx}
                              className="grid grid-cols-[1fr_80px_60px_28px] gap-2 items-center px-4 py-2.5">
                              <input
                                className={smallInputCls}
                                placeholder="e.g. Small, 4 pcs"
                                value={row.variantName}
                                onChange={e => updateVariant(idx, "variantName", e.target.value)}
                              />
                              <input
                                className={smallInputCls}
                                type="number"
                                min={0}
                                placeholder="0.00"
                                value={row.price}
                                onChange={e => updateVariant(idx, "price", e.target.value)}
                              />
                              <label className="flex items-center justify-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={row.isAvailable}
                                  onChange={e => updateVariant(idx, "isAvailable", e.target.checked)}
                                  className="w-4 h-4 rounded accent-primary" />
                                <span className={`text-[11px] font-medium ${row.isAvailable ? "text-emerald-400" : "text-gray-600"}`}>
                                  {row.isAvailable ? "Yes" : "No"}
                                </span>
                              </label>
                              <button onClick={() => removeVariant(idx)}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {variants.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-white/6 bg-white/2">
                          <p className="text-[11px] text-gray-500">
                            Base price above is used as fallback when no variant is selected.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl font-semibold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Product"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
