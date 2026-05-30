"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, X, Save, Upload, ImageOff } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API } from "@/config/constants";

interface Category {
  _id: string;
  name: string;
  image?: string;
  description?: string;
  order: number;
  isActive: boolean;
}

const empty = { name: "", image: "", description: "", order: 0, isActive: true };
const inputCls = "w-full px-4 py-2.5 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 text-sm transition-all";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "categories");
      const res = await fetch(API.UPLOAD, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm((p: any) => ({ ...p, image: data.url }));
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchAll = async () => {
    try {
      const res = await fetch(`${API.CATEGORIES}?all=true`);
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch { toast.error("Failed to load categories"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (c: Category) => { setForm(c); setEditing(c); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const body = editing ? { id: editing._id, ...form } : form;
      const res = await fetch(API.CATEGORIES, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editing ? "Category updated!" : "Category created!");
        setShowModal(false);
        fetchAll();
      } else toast.error(data.message || "Save failed");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "₹{name}"?`)) return;
    try {
      const res = await fetch(`${API.CATEGORIES}?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Deleted"); fetchAll(); }
      else toast.error(data.message);
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Categories</h2>
          <p className="text-gray-400 mt-1 text-sm">{categories.length} categories total</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-primary text-black px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-white/8 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl overflow-hidden group p-5 flex flex-col justify-between transition-all" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(244,196,48,0.2)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-white text-lg">{c.name}</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${c.isActive ? "bg-emerald-400/10 text-emerald-400" : "bg-white/5 text-white/40"}`}>
                    {c.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{c.description || "No description"}</p>
                <p className="text-xs font-bold text-gray-500 mb-4">Sort Order: {c.order}</p>
              </div>
              <div className="flex gap-2 border-t border-white/8 pt-4">
                <button onClick={() => openEdit(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/3 hover:bg-violet-400/10 text-gray-400 hover:text-violet-400 rounded-xl text-xs font-bold transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(c._id, c.name)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full sm:h-auto sm:rounded-3xl rounded-none shadow-2xl sm:max-w-md overflow-hidden" style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h3 className="text-xl font-black text-white">{editing ? "Edit Category" : "Add Category"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Category Name *</label>
                <input className={inputCls} value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {form.image ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/12 bg-[#0d1117]">
                    <img
                      src={form.image}
                      alt="Category preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/60">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-black rounded-lg text-xs font-bold"
                      >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((p: any) => ({ ...p, image: "" }))}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/80 text-white rounded-lg text-xs font-bold"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex flex-col items-center justify-center gap-2 h-36 border-2 border-dashed border-white/15 rounded-xl bg-[#0d1117] hover:border-primary/40 hover:bg-primary/5 transition-colors text-gray-500 hover:text-primary"
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <ImageOff className="w-6 h-6" />
                    )}
                    <span className="text-xs font-semibold">
                      {uploading ? "Uploading…" : "Click to upload image"}
                    </span>
                    <span className="text-[10px] text-gray-600">JPG, PNG, WebP, GIF · max 10 MB</span>
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea className={inputCls} rows={2} value={form.description || ""} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Sort Order</label>
                  <input type="number" className={inputCls} value={isNaN(form.order) ? "" : form.order} onChange={e => setForm((p: any) => ({ ...p, order: e.target.value === "" ? "" : parseInt(e.target.value) }))} />
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                    <span className="text-sm font-semibold text-white/70">Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0 mt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl font-semibold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
