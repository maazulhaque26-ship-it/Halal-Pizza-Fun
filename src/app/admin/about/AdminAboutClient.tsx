"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, Upload, Image as ImageIcon, X, Plus, User,
  Quote, Eye, EyeOff, GripVertical, ChevronDown, ChevronUp, Video, Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API } from "@/config/constants";
import Link from "next/link";

// ─── helpers ───────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 bg-[#0d1117] border border-white/12 rounded-xl " +
  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 " +
  "text-gray-100 placeholder:text-gray-600 transition-all text-sm";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-white/70 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/50 mt-1">{hint}</p>}
    </div>
  );
}

function Card({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-3xl border border-white/8 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-6 py-4 border-b border-white/8 bg-[#0f172a] hover:bg-white/5 transition-colors"
      >
        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-black text-white/90 flex-1 text-left">{title}</h3>
        {open ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImageUpload({ label, value, onChange, folder = "hpf_about" }: {
  label: string; value: string; onChange: (url: string) => void; folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.success) { onChange(d.url); toast.success("Uploaded!"); }
      else toast.error(d.message || "Upload failed");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };
  return (
    <div>
      <label className="block text-sm font-bold text-white/70 mb-1.5">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl border border-white/10 bg-background overflow-hidden flex items-center justify-center shrink-0 relative group">
          {value
            ? <img src={value} alt="preview" className="w-full h-full object-cover" />
            : <ImageIcon className="w-6 h-6 text-white/80" />}
          {value && (
            <button
              onClick={() => onChange("")}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white/8 border border-white/10 hover:border-primary/50 text-white/70 text-sm font-semibold rounded-xl transition-colors shadow-sm">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-white/50" />}
          {uploading ? "Uploading…" : value ? "Replace" : "Upload Image"}
          <input type="file" accept="image/*" className="hidden" onChange={handle} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

function VideoUpload({ value, onChange }: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video type
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file (MP4, WebM, MOV)");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video must be under 100MB");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "hpf_promo_videos");
    fd.append("resource_type", "video");
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.success) {
        onChange(d.url);
        toast.success("Video uploaded successfully!");
      } else {
        toast.error(d.message || "Upload failed");
      }
    } catch {
      toast.error("Video upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden bg-[#080d15] aspect-video">
          <video
            src={value}
            controls
            muted
            loop
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/80 text-xs font-bold rounded-lg transition-colors shadow">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading…" : "Replace"}
              <input type="file" accept="video/*" className="hidden" onChange={handle} disabled={uploading} />
            </label>
            <button
              onClick={() => onChange("")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors shadow"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      ) : (
        <label className="cursor-pointer flex flex-col items-center justify-center gap-3 p-10 bg-background hover:bg-white/5 border-2 border-dashed border-white/15 hover:border-primary/50 rounded-2xl transition-colors group">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-semibold text-white/40">Uploading video...</span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Video className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold text-white/70 group-hover:text-primary transition-colors">Upload Promotional Video</p>
                <p className="text-xs text-white/50 mt-1">MP4, WebM, MOV · Max 100MB</p>
              </div>
            </>
          )}
          <input type="file" accept="video/*" className="hidden" onChange={handle} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

function GalleryManager({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 12) { toast.error("Max 12 gallery images"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "hpf_gallery");
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.success) { onChange([...images, d.url]); toast.success("Image added to gallery"); }
      else toast.error(d.message || "Upload failed");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const remove = (idx: number) => {
    const next = [...images];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div>
      <p className="text-xs text-white/40 mb-3">
        Upload up to <strong>12</strong> images. The <span className="text-primary font-bold">first image</span> is displayed large (featured). Click × to remove.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.map((url, idx) => (
          <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-background">
            <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
            {idx === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-primary text-black text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                Featured
              </span>
            )}
            <button
              onClick={() => remove(idx)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {images.length < 12 && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-white/15 bg-background hover:border-primary/60 hover:bg-white/5 cursor-pointer flex flex-col items-center justify-center gap-1.5 group transition-colors">
            {uploading
              ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
              : <Plus className="w-5 h-5 text-white/50 group-hover:text-primary transition-colors" />}
            <span className="text-[10px] font-semibold text-white/50 group-hover:text-primary transition-colors">
              {uploading ? "Uploading…" : "Add Photo"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
}

// ─── Preview Panel ───────────────────────────────────────────────────────────
function FounderPreview({ name, title, story, imageUrl }: {
  name: string; title: string; story: string; imageUrl: string;
}) {
  return (
    <div className="bg-background rounded-2xl p-6 text-white overflow-hidden">
      <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">PREVIEW — Founder Card</p>
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/40 bg-white/10 flex items-center justify-center shrink-0">
          {imageUrl
            ? <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            : <span className="text-primary text-3xl font-black">{name?.[0] || "?"}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-lg text-white leading-tight">{name || "Founder Name"}</p>
          <p className="text-primary/70 text-sm mb-3">{title || "Founder Title"}</p>
          <div className="border-l-2 border-primary/40 pl-3">
            <Quote className="w-4 h-4 text-primary/50 mb-1" />
            <p className="text-white/80 text-xs leading-relaxed line-clamp-4 italic">
              {story || "Founder story will appear here…"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAboutPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch(API.SETTINGS, { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data?.aboutPage ?? {}); })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, val: any) =>
    setData((prev: any) => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(API.SETTINGS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aboutPage: data }),
      });
      const d = await res.json();
      if (d.success) toast.success("About page saved!");
      else toast.error(d.message || "Save failed");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/8 rounded-3xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-white">About Page Editor</h2>
          <p className="text-white/40 mt-1 text-sm">
            Edit every section of <Link href="/about-us" target="_blank" className="text-primary hover:underline font-semibold">/about-us ↗</Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreview(p => !p)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/8 text-white/70 rounded-xl text-sm font-bold transition-colors"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? "Hide Preview" : "Founder Preview"}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Founder live preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <FounderPreview
              name={data.founderName || ""}
              title={data.founderTitle || ""}
              story={data.founderStory || ""}
              imageUrl={data.founderImageUrl || ""}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-5">
        {/* ── Hero Section ─────────────────────────────────────────── */}
        <Card title="Hero Section" icon={Quote}>
          <div className="space-y-4">
            <Field label="Hero Tagline Label" hint="The small uppercase tag shown above the title">
              <input
                className={inputCls}
                value={data.heroTag || ""}
                onChange={e => set("heroTag", e.target.value)}
                placeholder="OUR STORY & VISION"
              />
            </Field>
            <Field label="Hero Title" hint="Large heading shown at the top of the About page">
              <input
                className={inputCls}
                value={data.heroTitle || ""}
                onChange={e => set("heroTitle", e.target.value)}
                placeholder="Redefining Premium Gastronomy at Home"
              />
            </Field>
            <Field label="Hero Subtitle" hint="Descriptive text below the title">
              <textarea
                className={inputCls}
                rows={3}
                value={data.heroSubtitle || ""}
                onChange={e => set("heroSubtitle", e.target.value)}
                placeholder="Founded with a passion for exceptional culinary experiences…"
              />
            </Field>
          </div>
        </Card>

        {/* ── Founder Section ───────────────────────────────────────── */}
        <Card title="Founder Section" icon={User}>
          <div className="space-y-5">
            <Field label="Section Tagline Label" hint="The small uppercase tag shown above the founder name">
              <input
                className={inputCls}
                value={data.founderTag || ""}
                onChange={e => set("founderTag", e.target.value)}
                placeholder="MEET THE FOUNDER"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Founder Name">
                <input
                  className={inputCls}
                  value={data.founderName || ""}
                  onChange={e => set("founderName", e.target.value)}
                  placeholder="Chef Harpreet Sidhu"
                />
              </Field>
              <Field label="Founder Title / Role">
                <input
                  className={inputCls}
                  value={data.founderTitle || ""}
                  onChange={e => set("founderTitle", e.target.value)}
                  placeholder="Founder & Executive Chef"
                />
              </Field>
            </div>
            <Field label="Founder Story" hint="This appears as the italic quote block on the About page">
              <textarea
                className={inputCls}
                rows={6}
                value={data.founderStory || ""}
                onChange={e => set("founderStory", e.target.value)}
                placeholder="Tell the founder's journey and vision…"
              />
            </Field>
            <ImageUpload
              label="Founder Portrait Photo"
              value={data.founderImageUrl || ""}
              onChange={url => set("founderImageUrl", url)}
            />

            {/* Founder Milestones / Stats */}
            <div className="pt-4 border-t border-white/8">
              <label className="block text-sm font-bold text-white/90 mb-3">Founder Milestones / Mini-Stats (3 Columns)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Milestone 1 */}
                <div className="p-3.5 bg-background border border-white/10 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black text-white/50 uppercase">Milestone 1</span>
                  <Field label="Value"><input className={inputCls} value={data.founderStat1Value || ""} onChange={e => set("founderStat1Value", e.target.value)} placeholder="2019" /></Field>
                  <Field label="Label"><input className={inputCls} value={data.founderStat1Label || ""} onChange={e => set("founderStat1Label", e.target.value)} placeholder="Founded" /></Field>
                </div>
                {/* Milestone 2 */}
                <div className="p-3.5 bg-background border border-white/10 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black text-white/50 uppercase">Milestone 2</span>
                  <Field label="Value"><input className={inputCls} value={data.founderStat2Value || ""} onChange={e => set("founderStat2Value", e.target.value)} placeholder="15+" /></Field>
                  <Field label="Label"><input className={inputCls} value={data.founderStat2Label || ""} onChange={e => set("founderStat2Label", e.target.value)} placeholder="Branches" /></Field>
                </div>
                {/* Milestone 3 */}
                <div className="p-3.5 bg-background border border-white/10 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black text-white/50 uppercase">Milestone 3</span>
                  <Field label="Value"><input className={inputCls} value={data.founderStat3Value || ""} onChange={e => set("founderStat3Value", e.target.value)} placeholder="20yr" /></Field>
                  <Field label="Label"><input className={inputCls} value={data.founderStat3Label || ""} onChange={e => set("founderStat3Label", e.target.value)} placeholder="Experience" /></Field>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Vision & Mission ──────────────────────────────────────── */}
        <Card title="Vision & Mission & Stats" icon={Quote} defaultOpen={false}>
          <div className="space-y-4">
            <Field label="Vision Section Tagline Label" hint="The small uppercase tag shown above the vision title">
              <input
                className={inputCls}
                value={data.visionTag || ""}
                onChange={e => set("visionTag", e.target.value)}
                placeholder="THE VISION"
              />
            </Field>
            <Field label="Vision Title">
              <input className={inputCls} value={data.visionTitle || ""} onChange={e => set("visionTitle", e.target.value)} />
            </Field>
            <Field label="Vision Description (Part 1)">
              <textarea className={inputCls} rows={3} value={data.visionDesc1 || ""} onChange={e => set("visionDesc1", e.target.value)} />
            </Field>
            <Field label="Vision Description (Part 2)">
              <textarea className={inputCls} rows={3} value={data.visionDesc2 || ""} onChange={e => set("visionDesc2", e.target.value)} />
            </Field>
            <div className="pt-3 border-t border-white/8">
              <Field label="Mission Title">
                <input className={inputCls} value={data.missionTitle || ""} onChange={e => set("missionTitle", e.target.value)} />
              </Field>
            </div>
            <Field label="Mission Description">
              <textarea className={inputCls} rows={3} value={data.missionDesc || ""} onChange={e => set("missionDesc", e.target.value)} />
            </Field>

            {/* Mission Stats */}
            <div className="pt-4 border-t border-white/8">
              <label className="block text-sm font-bold text-white/90 mb-3">Mission Statement Statistics (3 Columns)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Stat 1 */}
                <div className="p-4 bg-background border border-white/10 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-white/50 uppercase">Stat Column 1</span>
                  <Field label="Value">
                    <input
                      className={inputCls}
                      value={data.stat1Value || ""}
                      onChange={e => set("stat1Value", e.target.value)}
                      placeholder="100%"
                    />
                  </Field>
                  <Field label="Label">
                    <input
                      className={inputCls}
                      value={data.stat1Label || ""}
                      onChange={e => set("stat1Label", e.target.value)}
                      placeholder="Gourmet"
                    />
                  </Field>
                </div>

                {/* Stat 2 */}
                <div className="p-4 bg-background border border-white/10 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-white/50 uppercase">Stat Column 2</span>
                  <Field label="Value">
                    <input
                      className={inputCls}
                      value={data.stat2Value || ""}
                      onChange={e => set("stat2Value", e.target.value)}
                      placeholder="20 min"
                    />
                  </Field>
                  <Field label="Label">
                    <input
                      className={inputCls}
                      value={data.stat2Label || ""}
                      onChange={e => set("stat2Label", e.target.value)}
                      placeholder="Avg Delivery"
                    />
                  </Field>
                </div>

                {/* Stat 3 */}
                <div className="p-4 bg-background border border-white/10 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-white/50 uppercase">Stat Column 3</span>
                  <Field label="Value">
                    <input
                      className={inputCls}
                      value={data.stat3Value || ""}
                      onChange={e => set("stat3Value", e.target.value)}
                      placeholder="15+"
                    />
                  </Field>
                  <Field label="Label">
                    <input
                      className={inputCls}
                      value={data.stat3Label || ""}
                      onChange={e => set("stat3Label", e.target.value)}
                      placeholder="Branches"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Core Values ───────────────────────────────────────────── */}
        <Card title="Core Values (3 Cards)" icon={Quote} defaultOpen={false}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/8">
              <Field label="Values Section Tagline Label" hint="The small uppercase tag shown above the values title">
                <input
                  className={inputCls}
                  value={data.valuesTag || ""}
                  onChange={e => set("valuesTag", e.target.value)}
                  placeholder="OUR VALUES"
                />
              </Field>
              <Field label="Values Section Subtitle" hint="The subtitle header for the core values section">
                <input
                  className={inputCls}
                  value={data.valuesSubtitle || ""}
                  onChange={e => set("valuesSubtitle", e.target.value)}
                  placeholder="The Standards We Live By"
                />
              </Field>
            </div>
            {([1, 2, 3] as const).map(n => (
              <div key={n} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                <div className="sm:col-span-1">
                  <Field label={`Value ${n} — Title`}>
                    <input
                      className={inputCls}
                      value={data[`value${n}Title`] || ""}
                      onChange={e => set(`value${n}Title`, e.target.value)}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <textarea
                      className={inputCls}
                      rows={2}
                      value={data[`value${n}Desc`] || ""}
                      onChange={e => set(`value${n}Desc`, e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Gallery ───────────────────────────────────────────────── */}
        <Card title="Photo Gallery" icon={ImageIcon}>
          <GalleryManager
            images={data.galleryImages ?? []}
            onChange={imgs => set("galleryImages", imgs)}
          />
        </Card>

        {/* ── Promotional Video ─────────────────────────────────────── */}
        <Card title="Promotional Video Section" icon={Video} defaultOpen={false}>
          <div className="space-y-4">
            <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl p-3 text-sm text-amber-400 flex items-start gap-2">
              <Video className="w-4 h-4 mt-0.5 shrink-0" />
              <span>This video will autoplay (muted, looped) on the About Us page with a cinematic overlay. Recommended: short 15–60s branded clip.</span>
            </div>
            <Field label="Video Section Title" hint="Heading shown above or on the video">
              <input
                className={inputCls}
                value={data.videoTitle || ""}
                onChange={e => set("videoTitle", e.target.value)}
                placeholder="Experience Premium Dining"
              />
            </Field>
            <Field label="Video Section Subtitle">
              <input
                className={inputCls}
                value={data.videoSubtitle || ""}
                onChange={e => set("videoSubtitle", e.target.value)}
                placeholder="Watch how we craft every dish with passion and precision"
              />
            </Field>
            <Field label="Upload Video">
              <VideoUpload
                value={data.videoUrl || ""}
                onChange={url => set("videoUrl", url)}
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* Floating save */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-black px-6 py-4 rounded-2xl font-bold shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>
    </div>
  );
}
