"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/Toast";
import { API } from "@/config/constants";
import {
  Rocket, ShieldCheck, TrendingUp, Megaphone, GraduationCap,
  UtensilsCrossed, CheckCircle2, Star, MapPin, Phone, Mail,
  Globe, Award, ChevronDown, Loader2, Save, Quote,
  ChevronUp, Trash2, Plus,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface FranchiseData {
  heroTag?: string; heroTitle?: string; heroSubtitle?: string; heroDesc?: string;
  heroCta1?: string; heroCta2?: string; heroCta3?: string;
  whyTitle?: string; whyItems?: Array<{ title: string; desc: string }>;
  oppTitle?: string; oppDesc?: string;
  mktTitle?: string; mktItems?: Array<{ value: string; label: string }>;
  uspTitle?: string; uspItems?: Array<{ title: string; desc: string }>;
  invTitle?: string; invItems?: Array<{ label: string; value: string }>; invNote?: string;
  trainingTitle?: string; trainingItems?: Array<{ label: string }>; trainingDesc?: string;
  testiItems?: Array<{ text: string }>;
  growthTitle?: string; growthDesc?: string;
  branchesTitle?: string; branchItems?: Array<{ name: string }>;
  ctaTitle?: string; ctaDesc?: string; ctaBtn1?: string; ctaBtn2?: string;
  ctaPhone?: string; ctaEmail?: string; ctaWebsite?: string;
  [key: string]: any;
}

// ── Migration: flat keys → arrays ────────────────────────────────────────────
function migrate(raw: Record<string, any>): FranchiseData {
  const d: FranchiseData = { ...raw };

  if (!Array.isArray(d.whyItems)) {
    const items: Array<{ title: string; desc: string }> = [];
    for (let n = 1; n <= 6; n++) {
      const t = d[`why${n}Title`] || ""; const desc = d[`why${n}Desc`] || "";
      if (t || desc) items.push({ title: t, desc });
    }
    d.whyItems = items.length ? items : [{ title: "", desc: "" }];
  }

  if (!Array.isArray(d.mktItems)) {
    const items: Array<{ value: string; label: string }> = [];
    for (let n = 1; n <= 3; n++) {
      const v = d[`mkt${n}Value`] || ""; const l = d[`mkt${n}Label`] || "";
      if (v || l) items.push({ value: v, label: l });
    }
    d.mktItems = items.length ? items : [{ value: "", label: "" }];
  }

  if (!Array.isArray(d.uspItems)) {
    const items: Array<{ title: string; desc: string }> = [];
    for (let n = 1; n <= 3; n++) {
      const t = d[`usp${n}Title`] || ""; const desc = d[`usp${n}Desc`] || "";
      if (t || desc) items.push({ title: t, desc });
    }
    d.uspItems = items.length ? items : [{ title: "", desc: "" }];
  }

  if (!Array.isArray(d.invItems)) {
    const rows = [
      { lk: "invFeeLabel", vk: "invFeeValue" },
      { lk: "invStartupLabel", vk: "invStartupValue" },
      { lk: "invRoyaltyLabel", vk: "invRoyaltyValue" },
      { lk: "invMktFeeLabel", vk: "invMktFeeValue" },
    ];
    d.invItems = rows.map(r => ({ label: d[r.lk] || "", value: d[r.vk] || "" }));
  }

  if (!Array.isArray(d.trainingItems)) {
    const items: Array<{ label: string }> = [];
    for (let n = 1; n <= 3; n++) { const l = d[`training${n}`] || ""; if (l) items.push({ label: l }); }
    d.trainingItems = items.length ? items : [{ label: "" }];
  }

  if (!Array.isArray(d.testiItems)) {
    const items: Array<{ text: string }> = [];
    for (let n = 1; n <= 3; n++) { const t = d[`testi${n}`] || ""; if (t) items.push({ text: t }); }
    d.testiItems = items.length ? items : [{ text: "" }];
  }

  if (!Array.isArray(d.branchItems)) {
    const items: Array<{ name: string }> = [];
    for (let n = 1; n <= 3; n++) { const nm = d[`branch${n}`] || ""; if (nm) items.push({ name: nm }); }
    d.branchItems = items.length ? items : [{ name: "" }];
  }

  return d;
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-white/8 rounded-3xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-7 py-5 hover:bg-background transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-black text-white/90">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-7 pb-7 pt-2 border-t border-white/8">{children}</div>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-white/70 mb-1">{label}</label>
      {hint && <p className="text-xs text-white/50 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 text-sm transition-all";

// ── Dynamic array section ─────────────────────────────────────────────────────
function ArraySection<T extends Record<string, string>>({
  items, onChange, addLabel, newItem, minItems = 1,
  renderFields,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  addLabel: string;
  newItem: T;
  minItems?: number;
  renderFields: (item: T, upd: (field: keyof T, val: string) => void) => React.ReactNode;
}) {
  const add = () => onChange([...items, { ...newItem }]);
  const remove = (i: number) => { if (items.length > minItems) onChange(items.filter((_, idx) => idx !== i)); };
  const move = (i: number, dir: -1 | 1) => {
    const a = [...items]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  };
  const upd = (i: number, field: keyof T, val: string) =>
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-4 bg-background border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Item {i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="p-1 hover:bg-white/8 rounded-lg transition-colors disabled:opacity-20 text-white/50">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                className="p-1 hover:bg-white/8 rounded-lg transition-colors disabled:opacity-20 text-white/50">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => remove(i)} disabled={items.length <= minItems}
                className="p-1.5 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 rounded-lg transition-colors disabled:opacity-20">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {renderFields(item, (field, val) => upd(i, field, val))}
        </div>
      ))}
      <button type="button" onClick={add}
        className="w-full py-2.5 border-2 border-dashed border-white/15 hover:border-primary/40 text-white/40 hover:text-primary/70 rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> {addLabel}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminFranchisePage() {
  const [data, setData] = useState<FranchiseData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(API.SETTINGS, { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (d.success) setData(migrate(d.data?.franchisePage ?? {})); })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = useCallback((key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(API.SETTINGS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ franchisePage: data }),
      });
      const json = await res.json();
      if (json.success) toast.success("Franchise page saved!");
      else toast.error(json.message || `Save failed (${res.status})`);
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black text-white/90">Franchise Page</h2>
          <p className="text-white/50 text-sm mt-1">Edit every section of the franchise page</p>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <Card title="Hero Section" icon={Rocket}>
        <div className="space-y-4">
          <Field label="Tagline Badge" hint="Small uppercase tag above the title">
            <input className={inputCls} value={data.heroTag || ""} onChange={e => set("heroTag", e.target.value)} placeholder="FRANCHISE OPPORTUNITY" />
          </Field>
          <Field label="Hero Title">
            <input className={inputCls} value={data.heroTitle || ""} onChange={e => set("heroTitle", e.target.value)} placeholder="Grow With Halal Pizza Fun" />
          </Field>
          <Field label="Hero Subtitle">
            <textarea className={inputCls} rows={3} value={data.heroSubtitle || ""} onChange={e => set("heroSubtitle", e.target.value)} placeholder="Join one of India's fastest-growing halal food brands…" />
          </Field>
          <Field label="Hero Description" hint="Smaller paragraph below the subtitle">
            <textarea className={inputCls} rows={3} value={data.heroDesc || ""} onChange={e => set("heroDesc", e.target.value)} placeholder="Since 2012, Halal Pizza Fun has delivered…" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="CTA Button 1"><input className={inputCls} value={data.heroCta1 || ""} onChange={e => set("heroCta1", e.target.value)} placeholder="Apply for Franchise" /></Field>
            <Field label="CTA Button 2"><input className={inputCls} value={data.heroCta2 || ""} onChange={e => set("heroCta2", e.target.value)} placeholder="Download Brochure" /></Field>
            <Field label="CTA Button 3"><input className={inputCls} value={data.heroCta3 || ""} onChange={e => set("heroCta3", e.target.value)} placeholder="Contact Us" /></Field>
          </div>
        </div>
      </Card>

      {/* ── Why Choose Us ─────────────────────────────────────── */}
      <Card title="Why Choose Us" icon={ShieldCheck} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Section Title">
            <input className={inputCls} value={data.whyTitle || ""} onChange={e => set("whyTitle", e.target.value)} placeholder="Why Partner With Halal Pizza Fun?" />
          </Field>
          <div className="pt-2 border-t border-white/8">
            <ArraySection<{ title: string; desc: string }>
              items={data.whyItems || [{ title: "", desc: "" }]}
              onChange={items => set("whyItems", items)}
              addLabel="Add Feature"
              newItem={{ title: "", desc: "" }}
              renderFields={(item, upd) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Title"><input className={inputCls} value={item.title} onChange={e => upd("title", e.target.value)} /></Field>
                  <Field label="Description"><input className={inputCls} value={item.desc} onChange={e => upd("desc", e.target.value)} /></Field>
                </div>
              )}
            />
          </div>
        </div>
      </Card>

      {/* ── Opportunity ───────────────────────────────────────── */}
      <Card title="Opportunity Section" icon={TrendingUp} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Title"><input className={inputCls} value={data.oppTitle || ""} onChange={e => set("oppTitle", e.target.value)} placeholder="Your Slice of the Future" /></Field>
          <Field label="Description"><textarea className={inputCls} rows={4} value={data.oppDesc || ""} onChange={e => set("oppDesc", e.target.value)} /></Field>
        </div>
      </Card>

      {/* ── Market Growth ──────────────────────────────────────── */}
      <Card title="Market Growth Stats" icon={TrendingUp} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Section Title">
            <input className={inputCls} value={data.mktTitle || ""} onChange={e => set("mktTitle", e.target.value)} placeholder="A Growing Market Opportunity" />
          </Field>
          <div className="pt-2 border-t border-white/8">
            <ArraySection<{ value: string; label: string }>
              items={data.mktItems || [{ value: "", label: "" }]}
              onChange={items => set("mktItems", items)}
              addLabel="Add Stat"
              newItem={{ value: "", label: "" }}
              renderFields={(item, upd) => (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Value"><input className={inputCls} value={item.value} onChange={e => upd("value", e.target.value)} /></Field>
                  <Field label="Label"><input className={inputCls} value={item.label} onChange={e => upd("label", e.target.value)} /></Field>
                </div>
              )}
            />
          </div>
        </div>
      </Card>

      {/* ── USP ───────────────────────────────────────────────── */}
      <Card title="Unique Selling Proposition" icon={Award} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Section Title">
            <input className={inputCls} value={data.uspTitle || ""} onChange={e => set("uspTitle", e.target.value)} placeholder="What Makes Us Different?" />
          </Field>
          <div className="pt-2 border-t border-white/8">
            <ArraySection<{ title: string; desc: string }>
              items={data.uspItems || [{ title: "", desc: "" }]}
              onChange={items => set("uspItems", items)}
              addLabel="Add USP"
              newItem={{ title: "", desc: "" }}
              renderFields={(item, upd) => (
                <div className="space-y-2">
                  <Field label="Title"><input className={inputCls} value={item.title} onChange={e => upd("title", e.target.value)} /></Field>
                  <Field label="Description"><textarea className={inputCls} rows={2} value={item.desc} onChange={e => upd("desc", e.target.value)} /></Field>
                </div>
              )}
            />
          </div>
        </div>
      </Card>

      {/* ── Investment ─────────────────────────────────────────── */}
      <Card title="Investment Table" icon={TrendingUp} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Section Title">
            <input className={inputCls} value={data.invTitle || ""} onChange={e => set("invTitle", e.target.value)} placeholder="Franchise Investment" />
          </Field>
          <div className="pt-2 border-t border-white/8">
            <ArraySection<{ label: string; value: string }>
              items={data.invItems || [{ label: "", value: "" }]}
              onChange={items => set("invItems", items)}
              addLabel="Add Row"
              newItem={{ label: "", value: "" }}
              renderFields={(item, upd) => (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Row Label"><input className={inputCls} value={item.label} onChange={e => upd("label", e.target.value)} placeholder="Franchise Fee" /></Field>
                  <Field label="Row Value"><input className={inputCls} value={item.value} onChange={e => upd("value", e.target.value)} placeholder="₹5,00,000" /></Field>
                </div>
              )}
            />
          </div>
          <Field label="Note below table"><input className={inputCls} value={data.invNote || ""} onChange={e => set("invNote", e.target.value)} /></Field>
        </div>
      </Card>

      {/* ── Training & Support ─────────────────────────────────── */}
      <Card title="Training & Support" icon={GraduationCap} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Section Title">
            <input className={inputCls} value={data.trainingTitle || ""} onChange={e => set("trainingTitle", e.target.value)} placeholder="Complete Training & Support" />
          </Field>
          <div className="pt-2 border-t border-white/8">
            <ArraySection<{ label: string }>
              items={data.trainingItems || [{ label: "" }]}
              onChange={items => set("trainingItems", items)}
              addLabel="Add Step"
              newItem={{ label: "" }}
              renderFields={(item, upd) => (
                <Field label="Step Label"><input className={inputCls} value={item.label} onChange={e => upd("label", e.target.value)} /></Field>
              )}
            />
          </div>
          <Field label="Section Description">
            <textarea className={inputCls} rows={3} value={data.trainingDesc || ""} onChange={e => set("trainingDesc", e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <Card title="Testimonials" icon={Quote} defaultOpen={false}>
        <ArraySection<{ text: string }>
          items={data.testiItems || [{ text: "" }]}
          onChange={items => set("testiItems", items)}
          addLabel="Add Testimonial"
          newItem={{ text: "" }}
          renderFields={(item, upd) => (
            <Field label="Testimonial Text">
              <textarea className={inputCls} rows={3} value={item.text} onChange={e => upd("text", e.target.value)} />
            </Field>
          )}
        />
      </Card>

      {/* ── Growth Timeline ────────────────────────────────────── */}
      <Card title="Growth Timeline" icon={TrendingUp} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Title"><input className={inputCls} value={data.growthTitle || ""} onChange={e => set("growthTitle", e.target.value)} placeholder="Our Journey & Growth" /></Field>
          <Field label="Description"><textarea className={inputCls} rows={4} value={data.growthDesc || ""} onChange={e => set("growthDesc", e.target.value)} /></Field>
        </div>
      </Card>

      {/* ── Branches / Presence ────────────────────────────────── */}
      <Card title="Branches / Our Presence" icon={MapPin} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Section Title">
            <input className={inputCls} value={data.branchesTitle || ""} onChange={e => set("branchesTitle", e.target.value)} placeholder="Our Presence" />
          </Field>
          <div className="pt-2 border-t border-white/8">
            <ArraySection<{ name: string }>
              items={data.branchItems || [{ name: "" }]}
              onChange={items => set("branchItems", items)}
              addLabel="Add Location"
              newItem={{ name: "" }}
              renderFields={(item, upd) => (
                <Field label="Location Name"><input className={inputCls} value={item.name} onChange={e => upd("name", e.target.value)} placeholder="Delhi NCR" /></Field>
              )}
            />
          </div>
        </div>
      </Card>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <Card title="Final CTA Section" icon={Rocket} defaultOpen={false}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title"><input className={inputCls} value={data.ctaTitle || ""} onChange={e => set("ctaTitle", e.target.value)} placeholder="Take the Next Step" /></Field>
            <Field label="CTA Button 1"><input className={inputCls} value={data.ctaBtn1 || ""} onChange={e => set("ctaBtn1", e.target.value)} placeholder="Apply Now" /></Field>
          </div>
          <Field label="Description"><textarea className={inputCls} rows={3} value={data.ctaDesc || ""} onChange={e => set("ctaDesc", e.target.value)} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CTA Button 2"><input className={inputCls} value={data.ctaBtn2 || ""} onChange={e => set("ctaBtn2", e.target.value)} placeholder="Contact Franchise Team" /></Field>
          </div>
          <div className="pt-2 border-t border-white/8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Phone"><input className={inputCls} value={data.ctaPhone || ""} onChange={e => set("ctaPhone", e.target.value)} placeholder="+91 8800155198" /></Field>
            <Field label="Email"><input className={inputCls} value={data.ctaEmail || ""} onChange={e => set("ctaEmail", e.target.value)} placeholder="pizzafunindia@gmail.com" /></Field>
            <Field label="Website"><input className={inputCls} value={data.ctaWebsite || ""} onChange={e => set("ctaWebsite", e.target.value)} placeholder="halalpizzafun.com" /></Field>
          </div>
        </div>
      </Card>

      {/* ── Sticky Save ───────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-black px-6 py-3.5 rounded-2xl shadow-2xl shadow-primary/40 transition-all disabled:opacity-60">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>
    </div>
  );
}
