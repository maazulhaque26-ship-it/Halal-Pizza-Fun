"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Plus, Pencil, Loader2, X, Save, MapPin, Phone, Clock, CheckCircle, XCircle, ImagePlus } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API } from "@/config/constants";
import type { MapPoint } from "@/components/maps/types";
import type { NominatimAddress } from "@/lib/services/nominatim";

const BranchLocator = dynamic(() => import("@/components/maps/BranchLocator"), {
  ssr: false,
  loading: () => <div className="h-[620px] animate-pulse rounded-3xl bg-white/5" />,
});

const DeliveryRadiusMap = dynamic(() => import("@/components/maps/DeliveryRadiusMap"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-3xl bg-[#080d15]" />,
});

interface Branch {
  _id: string; name: string; contactNumber: string; isActive: boolean;
  isAcceptingOrders: boolean; deliveryRadiusKm: number;
  address: { street: string; city: string; state: string; zip: string };
  location: { coordinates: number[] };
  operatingHours: { open: string; close: string };
  managerId?: { name: string; email: string };
  logo?: string;
}

const empty = {
  name: "", contactNumber: "", deliveryRadiusKm: 5,
  address: { street: "", city: "", state: "", zip: "" },
  location: { type: "Point", coordinates: [0, 0] },
  operatingHours: { open: "09:00", close: "22:00" },
  isActive: true, isAcceptingOrders: true, logo: "",
};

const inputCls = "w-full px-4 py-2.5 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 text-sm transition-all";

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) update("logo", data.url);
      else toast.error("Upload failed");
    } catch { toast.error("Upload failed"); }
    finally { setUploadingImage(false); e.target.value = ""; }
  };

  const fetch_ = async () => {
    try {
      const res = await fetch(API.BRANCHES);
      const d = await res.json();
      if (d.success) setBranches(d.data);
    } catch { toast.error("Failed to load branches"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (b: Branch) => { setForm(b); setEditing(b); setShowModal(true); };

  const update = (path: string, value: any) => {
    setForm((prev: any) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) { if (!cur[keys[i]]) cur[keys[i]] = {}; cur = cur[keys[i]]; }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateBranchLocation = ({ coordinates, address }: { coordinates: MapPoint; address?: NominatimAddress | null }) => {
    update("location", { type: "Point", coordinates: [coordinates.lng, coordinates.lat] });

    if (address?.address) {
      const details = address.address;
      update("address.street", [details.house_number, details.road].filter(Boolean).join(" ") || details.neighbourhood || details.suburb || "");
      update("address.city", details.city || details.town || details.village || details.county || "");
      update("address.state", details.state || "");
      update("address.zip", details.postcode || "");
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.contactNumber) { toast.error("Name and contact number required"); return; }
    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `${API.BRANCHES}/${editing._id}` : API.BRANCHES;
      // For simplicity, use POST for both (server handles upsert by ID)
      const body = editing ? { ...form } : form;
      const res = await fetch(editing ? `/api/branches/${editing._id}` : API.BRANCHES, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { toast.success(editing ? "Branch updated!" : "Branch created!"); setShowModal(false); fetch_(); }
      else toast.error(data.message || "Save failed");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Branch Management</h2>
          <p className="text-gray-400 mt-1 text-sm">{branches.length} branches configured</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-56 bg-white/8 rounded-3xl animate-pulse" />)}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-24 text-white/50">
          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-bold text-lg">No branches yet</p>
          <p className="text-sm mt-1">Add your first branch to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-background rounded-3xl border border-white/8 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-primary">Coverage Preview</p>
                <p className="text-xs text-white/50">OpenStreetMap delivery zones for every branch</p>
              </div>
            </div>
            <DeliveryRadiusMap branches={branches} height="420px" zoom={11} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((b, i) => (
              <motion.div key={b._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-3xl p-6 " style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }} >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {b.logo && (
                      <img src={b.logo} alt={b.name} className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0" />
                    )}
                    <h3 className="text-lg font-black text-white">{b.name}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${b.isActive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {b.address?.street}, {b.address?.city}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)}
                    className="p-2 bg-violet-400/10 hover:bg-violet-400/20 text-violet-400 rounded-xl transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-background rounded-2xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Contact</p>
                  <p className="text-sm font-bold text-gray-100 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {b.contactNumber}
                  </p>
                </div>
                <div className="bg-background rounded-2xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Hours</p>
                  <p className="text-sm font-bold text-gray-100 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {b.operatingHours?.open} – {b.operatingHours?.close}
                  </p>
                </div>
                <div className="bg-background rounded-2xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Delivery Radius</p>
                  <p className="text-sm font-bold text-gray-100">{b.deliveryRadiusKm} km</p>
                </div>
                <div className="bg-background rounded-2xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Coordinates</p>
                  <p className="text-sm font-bold text-gray-100 truncate">
                    {b.location?.coordinates?.[1]?.toFixed(4)}, {b.location?.coordinates?.[0]?.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {b.isAcceptingOrders ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> Accepting Orders
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-500 text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5" /> Not Accepting Orders
                  </span>
                )}
                {b.managerId && (
                  <span className="ml-auto text-xs text-gray-500">
                    Manager: <span className="font-bold text-gray-300">{(b.managerId as any).name}</span>
                  </span>
                )}
              </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full sm:h-auto sm:rounded-3xl rounded-none shadow-2xl sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden relative" style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} >
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h3 className="text-xl font-black text-white">{editing ? "Edit Branch" : "Add Branch"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Branch Name *</label>
                <input className={inputCls} value={form.name || ""} onChange={e => update("name", e.target.value)} placeholder="e.g., Manhattan HQ" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Branch Logo / Image</label>
                <div className="flex items-center gap-4">
                  {form.logo ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                      <img src={form.logo} alt="Branch logo" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => update("logo", "")}
                        className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/15 flex items-center justify-center shrink-0">
                      <ImagePlus className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 cursor-pointer transition-colors">
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    {uploadingImage ? "Uploading…" : "Upload Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Contact Number *</label>
                <input className={inputCls} value={form.contactNumber || ""} onChange={e => update("contactNumber", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Latitude</label>
                  <input type="number" step="any" className={inputCls}
                    value={form.location?.coordinates?.[1] || ""}
                    onChange={e => {
                      const coords = [...(form.location?.coordinates || [0, 0])];
                      coords[1] = parseFloat(e.target.value);
                      update("location.coordinates", coords);
                    }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Longitude</label>
                  <input type="number" step="any" className={inputCls}
                    value={form.location?.coordinates?.[0] || ""}
                    onChange={e => {
                      const coords = [...(form.location?.coordinates || [0, 0])];
                      coords[0] = parseFloat(e.target.value);
                      update("location.coordinates", coords);
                    }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Delivery Radius (km)</label>
                <input type="number" className={inputCls} value={form.deliveryRadiusKm || 5} onChange={e => update("deliveryRadiusKm", parseFloat(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Branch Marker & Delivery Zone</label>
                <BranchLocator
                  value={{
                    lat: Number(form.location?.coordinates?.[1] || 20.5937),
                    lng: Number(form.location?.coordinates?.[0] || 78.9629),
                  }}
                  radiusKm={Number(form.deliveryRadiusKm || 5)}
                  branch={form}
                  onChange={updateBranchLocation}
                />
              </div>
              {["street", "city", "state", "zip"].map(f => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 capitalize">{f}</label>
                  <input className={inputCls} value={form.address?.[f] || ""} onChange={e => update(`address.${f}`, e.target.value)} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Opens</label>
                  <input type="time" className={inputCls} value={form.operatingHours?.open || "09:00"} onChange={e => update("operatingHours.open", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Closes</label>
                  <input type="time" className={inputCls} value={form.operatingHours?.close || "22:00"} onChange={e => update("operatingHours.close", e.target.value)} />
                </div>
              </div>
              <div className="flex gap-4">
                {[{ key: "isActive", label: "Active" }, { key: "isAcceptingOrders", label: "Accepting Orders" }].map(f => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[f.key] ?? true}
                      onChange={e => update(f.key, e.target.checked)}
                      className="w-4 h-4 rounded accent-primary" />
                    <span className="text-sm font-semibold text-gray-300">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl font-bold hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Branch"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
