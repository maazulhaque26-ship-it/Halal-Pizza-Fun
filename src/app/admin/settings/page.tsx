"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Upload, Palette, Globe, Truck, Image as ImageIcon, X, Plus, User } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API } from "@/config/constants";

interface SettingsData {
  siteName: string; siteTagline: string; siteDescription: string;
  logoUrl: string; mobileLogoUrl: string; faviconUrl: string; darkModeLogoUrl: string; footerLogoUrl: string;
  theme: { primaryColor: string; secondaryColor: string; accentColor: string };
  seo: { metaTitle: string; metaDescription: string; ogImage: string; seoShareImage: string; googleAnalyticsId: string };
  contactEmail: string; contactPhone: string; address: string;
  socialLinks: { facebook: string; instagram: string; twitter: string; youtube: string };
  delivery: { baseDeliveryFee: number; pricePerKm: number; taxPercentage: number; maxDeliveryRadiusKm: number; freeDeliveryAbove: number };
  payment: { codEnabled: boolean };
  homepage: { heroTitle: string; heroSubtitle: string; heroBackgroundUrl: string };
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden " style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }} >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8 bg-[#0f172a]">
        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-black text-white/90">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ImageUploadField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "hpf_branding");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        onChange(data.url);
        toast.success("Uploaded successfully");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-background/50 flex items-center justify-center shrink-0 group">
            <img src={value} alt="Preview" className="max-w-[80%] max-h-[80%] object-contain" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button onClick={() => onChange("")} className="bg-red-500 text-white rounded-full p-1.5 shadow-lg active:scale-95 transition-transform">
                 <X className="w-4 h-4" />
               </button>
            </div>
          </div>
        ) : (
           <div className="w-16 h-16 rounded-xl border border-dashed border-white/15 bg-background flex items-center justify-center shrink-0">
             <ImageIcon className="w-5 h-5 text-white/80" />
           </div>
        )}
        <div className="flex-1">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white/8 border border-white/10 hover:border-primary/50 hover:bg-white/12 text-white/70 text-sm font-semibold rounded-xl transition-colors shadow-sm">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-white/50" />}
            {uploading ? "Uploading..." : value ? "Replace Image" : "Upload Image"}
            <input type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml, image/x-icon" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  );
}

function GalleryUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "hpf_gallery");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) { onUploaded(data.url); toast.success("Image added to gallery"); }
      else toast.error(data.message || "Upload failed");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  return (
    <label className="aspect-square rounded-xl border-2 border-dashed border-white/15 bg-background hover:border-primary/50 hover:bg-white/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
      {uploading
        ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
        : <Plus className="w-5 h-5 text-white/50 group-hover:text-primary transition-colors" />}
      <span className="text-[11px] font-semibold text-white/50 group-hover:text-primary transition-colors">
        {uploading ? "Uploading…" : "Add Image"}
      </span>
      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
    </label>
  );
}

const inputCls = "w-full px-4 py-3 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 transition-all text-sm";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Partial<SettingsData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(API.SETTINGS, { cache: "no-store" }).then(r => r.json()).then(d => {
      if (d.success) setSettings(d.data);
    }).catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const update = (path: string, value: any) => {
    setSettings(prev => {
      const next = structuredClone(prev) as any;
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(API.SETTINGS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) toast.success("Settings saved successfully!");
      else toast.error(data.message || "Save failed");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-6">
      {[1,2,3].map(i => <div key={i} className="h-48 bg-white/8 rounded-3xl animate-pulse" />)}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Site Settings</h2>
          <p className="text-gray-400 mt-1 text-sm">Control every aspect of your platform</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-60 self-start sm:self-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Branding */}
        <SectionCard title="Branding & Identity" icon={ImageIcon}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Site Name">
              <input className={inputCls} value={settings.siteName || ""} onChange={e => update("siteName", e.target.value)} placeholder="HPF" />
            </Field>
            <Field label="Site Tagline">
              <input className={inputCls} value={settings.siteTagline || ""} onChange={e => update("siteTagline", e.target.value)} placeholder="Taste the Difference" />
            </Field>
            
            {/* Visual Branding Assets */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-white/8">
              <ImageUploadField label="Website Logo (Primary)" value={settings.logoUrl || ""} onChange={url => update("logoUrl", url)} />
              <ImageUploadField label="Mobile Logo (Icon)" value={settings.mobileLogoUrl || ""} onChange={url => update("mobileLogoUrl", url)} />
              <ImageUploadField label="Favicon (.ico, .png)" value={settings.faviconUrl || ""} onChange={url => update("faviconUrl", url)} />
              <ImageUploadField label="Dark Mode Logo" value={settings.darkModeLogoUrl || ""} onChange={url => update("darkModeLogoUrl", url)} />
              <ImageUploadField label="Footer Logo" value={settings.footerLogoUrl || ""} onChange={url => update("footerLogoUrl", url)} />
            </div>

            <div className="sm:col-span-2 pt-4 border-t border-white/8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Contact Email">
                  <input className={inputCls} type="email" value={settings.contactEmail || ""} onChange={e => update("contactEmail", e.target.value)} />
                </Field>
                <Field label="Contact Phone">
                  <input className={inputCls} value={settings.contactPhone || ""} onChange={e => update("contactPhone", e.target.value)} />
                </Field>
                <Field label="Website URL (e.g. halalpizzafun.com)">
                  <input className={inputCls} value={(settings as any)?.contactWebsite || ""} onChange={e => update("contactWebsite", e.target.value)} placeholder="halalpizzafun.com" />
                </Field>
                <Field label="Opening Hours">
                  <input className={inputCls} value={(settings as any)?.contactHours || ""} onChange={e => update("contactHours", e.target.value)} placeholder="Mon – Sun: 10:00 AM – 11:00 PM" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Physical Address">
                    <input className={inputCls} value={(settings as any)?.address || ""} onChange={e => update("address", e.target.value)} placeholder="123 Main Street, City, Country" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Site Description">
                    <textarea className={inputCls} rows={2} value={settings.siteDescription || ""} onChange={e => update("siteDescription", e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Theme */}
        <SectionCard title="Theme Colors" icon={Palette}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: "Primary Color", key: "theme.primaryColor" },
              { label: "Secondary Color", key: "theme.secondaryColor" },
              { label: "Accent Color", key: "theme.accentColor" },
            ].map(f => (
              <Field key={f.key} label={f.label}>
                <div className="flex gap-3 items-center">
                  <input type="color" value={(settings as any)?.theme?.[f.key.split(".")[1]] || "#7c3aed"}
                    onChange={e => update(f.key, e.target.value)}
                    className="w-12 h-12 rounded-xl border border-white/10 cursor-pointer p-1" />
                  <input className={`${inputCls} flex-1`} value={(settings as any)?.theme?.[f.key.split(".")[1]] || ""}
                    onChange={e => update(f.key, e.target.value)} placeholder="#7c3aed" />
                </div>
              </Field>
            ))}
          </div>
        </SectionCard>

        {/* SEO */}
        <SectionCard title="SEO & Metadata" icon={Globe}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Meta Title">
              <input className={inputCls} value={settings.seo?.metaTitle || ""} onChange={e => update("seo.metaTitle", e.target.value)} />
            </Field>
            <Field label="Google Analytics ID">
              <input className={inputCls} value={settings.seo?.googleAnalyticsId || ""} onChange={e => update("seo.googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Meta Description">
                <textarea className={inputCls} rows={2} value={settings.seo?.metaDescription || ""} onChange={e => update("seo.metaDescription", e.target.value)} />
              </Field>
            </div>
            
            {/* Visual SEO Assets */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/8">
              <ImageUploadField label="Open Graph (OG) Image" value={settings.seo?.ogImage || ""} onChange={url => update("seo.ogImage", url)} />
              <ImageUploadField label="Twitter/SEO Share Image" value={settings.seo?.seoShareImage || ""} onChange={url => update("seo.seoShareImage", url)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Delivery Configuration" icon={Truck}>
          <p className="text-xs text-white/40 mb-4 bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-2">
            💡 <strong>How delivery fee is calculated:</strong> Fee = Base Fee + (Distance km × Price per km). If subtotal ≥ Free Delivery Above, the fee is waived entirely.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { label: "Base Delivery Fee (₹)", key: "delivery.baseDeliveryFee", type: "number", help: "Flat charge added to every order regardless of distance" },
              { label: "Price Per KM (₹/km)", key: "delivery.pricePerKm", type: "number", help: "Multiplied by the actual road distance from branch to customer" },
              { label: "Tax Percentage (%)", key: "delivery.taxPercentage", type: "number", help: "Applied on (subtotal − coupon). Not applied on delivery fee." },
              { label: "Max Delivery Radius (km)", key: "delivery.maxDeliveryRadiusKm", type: "number", help: "Orders beyond this radius are rejected even if within branch zone" },
              { label: "Free Delivery Above (₹)", key: "delivery.freeDeliveryAbove", type: "number", help: "Delivery fee is waived if the subtotal exceeds this amount" },
            ].map(f => (
              <div key={f.key}>
                <Field label={f.label}>
                  <input className={inputCls} type={f.type}
                    value={isNaN((settings as any)?.delivery?.[f.key.split(".")[1]]) ? "" : ((settings as any)?.delivery?.[f.key.split(".")[1]] ?? "")}
                    onChange={e => update(f.key, e.target.value === "" ? "" : parseFloat(e.target.value))} />
                </Field>
                <p className="text-xs text-white/50 mt-1">{f.help}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Payment Config */}
        <SectionCard title="Payment Configuration" icon={Globe}>
          <div className="grid grid-cols-1 gap-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                className="w-5 h-5 accent-primary border-white/15 rounded"
                checked={(settings as any)?.payment?.codEnabled ?? true}
                onChange={e => update("payment.codEnabled", e.target.checked)}
              />
              <span className="text-sm font-bold text-white/70">Enable Cash on Delivery (COD)</span>
            </label>
            <p className="text-xs text-white/50 -mt-3 ml-8">If unchecked, the Cash on Delivery option will instantly disappear from the checkout page.</p>
          </div>
        </SectionCard>

        {/* Homepage */}
        <SectionCard title="Homepage Content" icon={Globe}>
          <div className="grid grid-cols-1 gap-5">
            <Field label="Hero Title">
              <input className={inputCls} value={settings.homepage?.heroTitle || ""} onChange={e => update("homepage.heroTitle", e.target.value)} />
            </Field>
            <Field label="Hero Subtitle">
              <input className={inputCls} value={settings.homepage?.heroSubtitle || ""} onChange={e => update("homepage.heroSubtitle", e.target.value)} />
            </Field>
            <ImageUploadField 
              label="Hero Background Image (Upload from Device)" 
              value={settings.homepage?.heroBackgroundUrl || ""} 
              onChange={url => update("homepage.heroBackgroundUrl", url)} 
            />
          </div>
        </SectionCard>

        {/* About Us Page Content */}
        <SectionCard title="About Us Page Content" icon={Globe}>
          <div className="grid grid-cols-1 gap-5">
            <Field label="Hero Title">
              <input className={inputCls} value={(settings as any)?.aboutPage?.heroTitle || ""} onChange={e => update("aboutPage.heroTitle", e.target.value)} />
            </Field>
            <Field label="Hero Subtitle">
              <textarea className={inputCls} rows={2} value={(settings as any)?.aboutPage?.heroSubtitle || ""} onChange={e => update("aboutPage.heroSubtitle", e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/8">
              <Field label="Vision Title">
                <input className={inputCls} value={(settings as any)?.aboutPage?.visionTitle || ""} onChange={e => update("aboutPage.visionTitle", e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Vision Description 1">
                  <textarea className={inputCls} rows={2} value={(settings as any)?.aboutPage?.visionDesc1 || ""} onChange={e => update("aboutPage.visionDesc1", e.target.value)} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Vision Description 2">
                  <textarea className={inputCls} rows={2} value={(settings as any)?.aboutPage?.visionDesc2 || ""} onChange={e => update("aboutPage.visionDesc2", e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/8">
              <Field label="Mission Title">
                <input className={inputCls} value={(settings as any)?.aboutPage?.missionTitle || ""} onChange={e => update("aboutPage.missionTitle", e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Mission Description">
                  <textarea className={inputCls} rows={2} value={(settings as any)?.aboutPage?.missionDesc || ""} onChange={e => update("aboutPage.missionDesc", e.target.value)} />
                </Field>
              </div>
            </div>

            {/* Mission Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-white/8">
              <div className="p-4 bg-background border border-white/10 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-white/50 uppercase">Stat Column 1</span>
                <Field label="Value">
                  <input className={inputCls} value={(settings as any)?.aboutPage?.stat1Value || ""} onChange={e => update("aboutPage.stat1Value", e.target.value)} placeholder="100%" />
                </Field>
                <Field label="Label">
                  <input className={inputCls} value={(settings as any)?.aboutPage?.stat1Label || ""} onChange={e => update("aboutPage.stat1Label", e.target.value)} placeholder="Gourmet" />
                </Field>
              </div>
              <div className="p-4 bg-background border border-white/10 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-white/50 uppercase">Stat Column 2</span>
                <Field label="Value">
                  <input className={inputCls} value={(settings as any)?.aboutPage?.stat2Value || ""} onChange={e => update("aboutPage.stat2Value", e.target.value)} placeholder="20 min" />
                </Field>
                <Field label="Label">
                  <input className={inputCls} value={(settings as any)?.aboutPage?.stat2Label || ""} onChange={e => update("aboutPage.stat2Label", e.target.value)} placeholder="Avg Delivery" />
                </Field>
              </div>
              <div className="p-4 bg-background border border-white/10 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-white/50 uppercase">Stat Column 3</span>
                <Field label="Value">
                  <input className={inputCls} value={(settings as any)?.aboutPage?.stat3Value || ""} onChange={e => update("aboutPage.stat3Value", e.target.value)} placeholder="15+" />
                </Field>
                <Field label="Label">
                  <input className={inputCls} value={(settings as any)?.aboutPage?.stat3Label || ""} onChange={e => update("aboutPage.stat3Label", e.target.value)} placeholder="Branches" />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 pt-4 border-t border-white/8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Value 1 Title"><input className={inputCls} value={(settings as any)?.aboutPage?.value1Title || ""} onChange={e => update("aboutPage.value1Title", e.target.value)} /></Field>
                <Field label="Value 1 Description"><textarea className={inputCls} rows={2} value={(settings as any)?.aboutPage?.value1Desc || ""} onChange={e => update("aboutPage.value1Desc", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Value 2 Title"><input className={inputCls} value={(settings as any)?.aboutPage?.value2Title || ""} onChange={e => update("aboutPage.value2Title", e.target.value)} /></Field>
                <Field label="Value 2 Description"><textarea className={inputCls} rows={2} value={(settings as any)?.aboutPage?.value2Desc || ""} onChange={e => update("aboutPage.value2Desc", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Value 3 Title"><input className={inputCls} value={(settings as any)?.aboutPage?.value3Title || ""} onChange={e => update("aboutPage.value3Title", e.target.value)} /></Field>
                <Field label="Value 3 Description"><textarea className={inputCls} rows={2} value={(settings as any)?.aboutPage?.value3Desc || ""} onChange={e => update("aboutPage.value3Desc", e.target.value)} /></Field>
              </div>
            </div>

            {/* ── Founder Section ──────────────────────────────────────── */}
            <div className="pt-6 border-t border-white/8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <h4 className="font-black text-white/90 text-sm">Founder Section</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Founder Name">
                  <input className={inputCls} value={(settings as any)?.aboutPage?.founderName || ""} onChange={e => update("aboutPage.founderName", e.target.value)} placeholder="Chef Harpreet Sidhu" />
                </Field>
                <Field label="Founder Title / Role">
                  <input className={inputCls} value={(settings as any)?.aboutPage?.founderTitle || ""} onChange={e => update("aboutPage.founderTitle", e.target.value)} placeholder="Founder & Executive Chef" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Founder Story (Paragraph)">
                    <textarea className={inputCls} rows={5} value={(settings as any)?.aboutPage?.founderStory || ""} onChange={e => update("aboutPage.founderStory", e.target.value)} placeholder="Tell the founder's story..." />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="Founder Portrait Photo"
                    value={(settings as any)?.aboutPage?.founderImageUrl || ""}
                    onChange={url => update("aboutPage.founderImageUrl", url)}
                  />
                </div>
              </div>
            </div>

            {/* ── Gallery Section ───────────────────────────────────────── */}
            <div className="pt-6 border-t border-white/8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                </div>
                <h4 className="font-black text-white/90 text-sm">About Page Gallery</h4>
                <span className="ml-auto text-xs text-white/50">Up to 12 images · First image is featured (large)</span>
              </div>

              {/* Existing images */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {((settings as any)?.aboutPage?.galleryImages ?? []).map((url: string, idx: number) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-background">
                    <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                    <button
                      onClick={() => {
                        const imgs = [...((settings as any)?.aboutPage?.galleryImages ?? [])];
                        imgs.splice(idx, 1);
                        update("aboutPage.galleryImages", imgs);
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Upload new gallery image */}
                {((settings as any)?.aboutPage?.galleryImages ?? []).length < 12 && (
                  <GalleryUploadButton
                    onUploaded={url => {
                      const imgs = [...((settings as any)?.aboutPage?.galleryImages ?? []), url];
                      update("aboutPage.galleryImages", imgs);
                    }}
                  />
                )}
              </div>

              <p className="text-xs text-white/50">
                💡 Upload images directly or leave empty to use built-in fallback images on the public About page.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Gallery Page Content */}
        <SectionCard title="Gallery Page Images" icon={ImageIcon}>
          <div className="space-y-4">
            <p className="text-xs text-white/40 bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-2">
              📷 These images appear on the <strong>/gallery</strong> public page. If empty, the About page gallery is used as fallback.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {((settings as any)?.galleryPage?.images ?? []).map((url: string, idx: number) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-background">
                  <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      const imgs = [...((settings as any)?.galleryPage?.images ?? [])];
                      imgs.splice(idx, 1);
                      update("galleryPage.images", imgs);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {((settings as any)?.galleryPage?.images ?? []).length < 24 && (
                <GalleryUploadButton
                  onUploaded={url => {
                    const imgs = [...((settings as any)?.galleryPage?.images ?? []), url];
                    update("galleryPage.images", imgs);
                  }}
                />
              )}
            </div>
          </div>
        </SectionCard>

        {/* Franchise Page Content */}
        <SectionCard title="Franchise Page Content" icon={Globe}>
          <div className="space-y-6">

            {/* Hero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Hero Tag"><input className={inputCls} value={(settings as any)?.franchisePage?.heroTag || ""} onChange={e => update("franchisePage.heroTag", e.target.value)} placeholder="FRANCHISE OPPORTUNITY" /></Field>
              <Field label="Hero Title"><input className={inputCls} value={(settings as any)?.franchisePage?.heroTitle || ""} onChange={e => update("franchisePage.heroTitle", e.target.value)} placeholder="Grow With Halal Pizza Fun" /></Field>
              <div className="sm:col-span-2"><Field label="Hero Subtitle"><textarea className={inputCls} rows={2} value={(settings as any)?.franchisePage?.heroSubtitle || ""} onChange={e => update("franchisePage.heroSubtitle", e.target.value)} /></Field></div>
              <div className="sm:col-span-2"><Field label="Hero Description"><textarea className={inputCls} rows={2} value={(settings as any)?.franchisePage?.heroDesc || ""} onChange={e => update("franchisePage.heroDesc", e.target.value)} /></Field></div>
              <Field label="CTA Button 1"><input className={inputCls} value={(settings as any)?.franchisePage?.heroCta1 || ""} onChange={e => update("franchisePage.heroCta1", e.target.value)} placeholder="Apply for Franchise" /></Field>
              <Field label="CTA Button 2"><input className={inputCls} value={(settings as any)?.franchisePage?.heroCta2 || ""} onChange={e => update("franchisePage.heroCta2", e.target.value)} placeholder="Download Brochure" /></Field>
            </div>

            {/* Why Choose Us */}
            <div className="pt-5 border-t border-white/8">
              <p className="text-xs font-black text-white/40 uppercase tracking-wider mb-4">Why Choose Us (6 Items)</p>
              <div className="grid grid-cols-1 gap-4">
                {[1,2,3,4,5,6].map(n => (
                  <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={`Reason ${n} Title`}><input className={inputCls} value={(settings as any)?.franchisePage?.[`why${n}Title`] || ""} onChange={e => update(`franchisePage.why${n}Title`, e.target.value)} /></Field>
                    <Field label={`Reason ${n} Description`}><textarea className={inputCls} rows={2} value={(settings as any)?.franchisePage?.[`why${n}Desc`] || ""} onChange={e => update(`franchisePage.why${n}Desc`, e.target.value)} /></Field>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunity */}
            <div className="pt-5 border-t border-white/8 grid grid-cols-1 gap-4">
              <Field label="Opportunity Title"><input className={inputCls} value={(settings as any)?.franchisePage?.oppTitle || ""} onChange={e => update("franchisePage.oppTitle", e.target.value)} placeholder="Your Slice of the Future" /></Field>
              <Field label="Opportunity Description"><textarea className={inputCls} rows={2} value={(settings as any)?.franchisePage?.oppDesc || ""} onChange={e => update("franchisePage.oppDesc", e.target.value)} /></Field>
            </div>

            {/* Market Stats */}
            <div className="pt-5 border-t border-white/8">
              <p className="text-xs font-black text-white/40 uppercase tracking-wider mb-4">Market Growth Stats</p>
              <Field label="Section Title"><input className={inputCls} value={(settings as any)?.franchisePage?.mktTitle || ""} onChange={e => update("franchisePage.mktTitle", e.target.value)} placeholder="A Growing Market Opportunity" /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {[1,2,3].map(n => (
                  <div key={n} className="p-3 bg-background border border-white/10 rounded-xl space-y-2">
                    <span className="text-[10px] font-black text-white/50 uppercase">Stat {n}</span>
                    <Field label="Value"><input className={inputCls} value={(settings as any)?.franchisePage?.[`mkt${n}Value`] || ""} onChange={e => update(`franchisePage.mkt${n}Value`, e.target.value)} /></Field>
                    <Field label="Label"><input className={inputCls} value={(settings as any)?.franchisePage?.[`mkt${n}Label`] || ""} onChange={e => update(`franchisePage.mkt${n}Label`, e.target.value)} /></Field>
                  </div>
                ))}
              </div>
            </div>

            {/* USP */}
            <div className="pt-5 border-t border-white/8">
              <p className="text-xs font-black text-white/40 uppercase tracking-wider mb-4">What Makes Us Different (3 USPs)</p>
              <Field label="Section Title"><input className={inputCls} value={(settings as any)?.franchisePage?.uspTitle || ""} onChange={e => update("franchisePage.uspTitle", e.target.value)} placeholder="What Makes Us Different?" /></Field>
              <div className="grid grid-cols-1 gap-4 mt-4">
                {[1,2,3].map(n => (
                  <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={`USP ${n} Title`}><input className={inputCls} value={(settings as any)?.franchisePage?.[`usp${n}Title`] || ""} onChange={e => update(`franchisePage.usp${n}Title`, e.target.value)} /></Field>
                    <Field label={`USP ${n} Description`}><textarea className={inputCls} rows={2} value={(settings as any)?.franchisePage?.[`usp${n}Desc`] || ""} onChange={e => update(`franchisePage.usp${n}Desc`, e.target.value)} /></Field>
                  </div>
                ))}
              </div>
            </div>

            {/* Investment */}
            <div className="pt-5 border-t border-white/8">
              <p className="text-xs font-black text-white/40 uppercase tracking-wider mb-4">Investment Table</p>
              <Field label="Section Title"><input className={inputCls} value={(settings as any)?.franchisePage?.invTitle || ""} onChange={e => update("franchisePage.invTitle", e.target.value)} placeholder="Franchise Investment" /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {[
                  { label: "Franchise Fee Label", key: "invFeeLabel", placeholder: "Franchise Fee" },
                  { label: "Franchise Fee Value", key: "invFeeValue", placeholder: "₹5,00,000" },
                  { label: "Startup Cost Label", key: "invStartupLabel", placeholder: "Startup Cost" },
                  { label: "Startup Cost Value", key: "invStartupValue", placeholder: "₹30–35 Lakhs" },
                  { label: "Royalty Fee Label", key: "invRoyaltyLabel", placeholder: "Royalty Fee" },
                  { label: "Royalty Fee Value", key: "invRoyaltyValue", placeholder: "5% of Gross Sales" },
                  { label: "Marketing Fee Label", key: "invMktFeeLabel", placeholder: "Marketing Fee" },
                  { label: "Marketing Fee Value", key: "invMktFeeValue", placeholder: "2% of Gross Sales" },
                ].map(f => (
                  <Field key={f.key} label={f.label}><input className={inputCls} value={(settings as any)?.franchisePage?.[f.key] || ""} onChange={e => update(`franchisePage.${f.key}`, e.target.value)} placeholder={f.placeholder} /></Field>
                ))}
                <div className="sm:col-span-2"><Field label="Investment Note"><input className={inputCls} value={(settings as any)?.franchisePage?.invNote || ""} onChange={e => update("franchisePage.invNote", e.target.value)} /></Field></div>
              </div>
            </div>

            {/* Training */}
            <div className="pt-5 border-t border-white/8">
              <p className="text-xs font-black text-white/40 uppercase tracking-wider mb-4">Training & Support</p>
              <Field label="Section Title"><input className={inputCls} value={(settings as any)?.franchisePage?.trainingTitle || ""} onChange={e => update("franchisePage.trainingTitle", e.target.value)} placeholder="Complete Training & Support" /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {[1,2,3].map(n => (
                  <Field key={n} label={`Training Step ${n}`}><input className={inputCls} value={(settings as any)?.franchisePage?.[`training${n}`] || ""} onChange={e => update(`franchisePage.training${n}`, e.target.value)} /></Field>
                ))}
              </div>
              <div className="mt-4"><Field label="Training Description"><textarea className={inputCls} rows={2} value={(settings as any)?.franchisePage?.trainingDesc || ""} onChange={e => update("franchisePage.trainingDesc", e.target.value)} /></Field></div>
            </div>

            {/* Branches */}
            <div className="pt-5 border-t border-white/8">
              <p className="text-xs font-black text-white/40 uppercase tracking-wider mb-4">Our Presence / Branches</p>
              <Field label="Section Title"><input className={inputCls} value={(settings as any)?.franchisePage?.branchesTitle || ""} onChange={e => update("franchisePage.branchesTitle", e.target.value)} placeholder="Our Presence" /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {[1,2,3].map(n => (
                  <Field key={n} label={`Branch Location ${n}`}><input className={inputCls} value={(settings as any)?.franchisePage?.[`branch${n}`] || ""} onChange={e => update(`franchisePage.branch${n}`, e.target.value)} /></Field>
                ))}
              </div>
            </div>

            {/* Growth */}
            <div className="pt-5 border-t border-white/8 grid grid-cols-1 gap-4">
              <Field label="Growth Title"><input className={inputCls} value={(settings as any)?.franchisePage?.growthTitle || ""} onChange={e => update("franchisePage.growthTitle", e.target.value)} placeholder="Our Journey & Growth" /></Field>
              <Field label="Growth Description"><textarea className={inputCls} rows={2} value={(settings as any)?.franchisePage?.growthDesc || ""} onChange={e => update("franchisePage.growthDesc", e.target.value)} /></Field>
            </div>

            {/* CTA */}
            <div className="pt-5 border-t border-white/8">
              <p className="text-xs font-black text-white/40 uppercase tracking-wider mb-4">Final CTA Section</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="CTA Title"><input className={inputCls} value={(settings as any)?.franchisePage?.ctaTitle || ""} onChange={e => update("franchisePage.ctaTitle", e.target.value)} placeholder="Take the Next Step" /></Field>
                <div className="sm:col-span-2"><Field label="CTA Description"><textarea className={inputCls} rows={2} value={(settings as any)?.franchisePage?.ctaDesc || ""} onChange={e => update("franchisePage.ctaDesc", e.target.value)} /></Field></div>
                <Field label="CTA Button 1 Text"><input className={inputCls} value={(settings as any)?.franchisePage?.ctaBtn1 || ""} onChange={e => update("franchisePage.ctaBtn1", e.target.value)} placeholder="Apply Now" /></Field>
                <Field label="CTA Button 2 Text"><input className={inputCls} value={(settings as any)?.franchisePage?.ctaBtn2 || ""} onChange={e => update("franchisePage.ctaBtn2", e.target.value)} placeholder="Contact Franchise Team" /></Field>
                <Field label="Contact Phone"><input className={inputCls} value={(settings as any)?.franchisePage?.ctaPhone || ""} onChange={e => update("franchisePage.ctaPhone", e.target.value)} placeholder="+91 8800155198" /></Field>
                <Field label="Contact Email"><input className={inputCls} value={(settings as any)?.franchisePage?.ctaEmail || ""} onChange={e => update("franchisePage.ctaEmail", e.target.value)} placeholder="pizzafunindia@gmail.com" /></Field>
                <Field label="Website"><input className={inputCls} value={(settings as any)?.franchisePage?.ctaWebsite || ""} onChange={e => update("franchisePage.ctaWebsite", e.target.value)} placeholder="halalpizzafun.com" /></Field>
              </div>
            </div>

          </div>
        </SectionCard>

        {/* Offers Page Content */}
        <SectionCard title="Offers Page Content" icon={Globe}>
          <div className="grid grid-cols-1 gap-5">
            <Field label="Hero Title">
              <input className={inputCls} value={(settings as any)?.offersPage?.heroTitle || ""} onChange={e => update("offersPage.heroTitle", e.target.value)} />
            </Field>
            <Field label="Hero Subtitle">
              <textarea className={inputCls} rows={2} value={(settings as any)?.offersPage?.heroSubtitle || ""} onChange={e => update("offersPage.heroSubtitle", e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/8">
              <Field label="Delivery Banner Title">
                <input className={inputCls} value={(settings as any)?.offersPage?.deliveryBannerTitle || ""} onChange={e => update("offersPage.deliveryBannerTitle", e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Delivery Banner Description">
                  <textarea className={inputCls} rows={2} value={(settings as any)?.offersPage?.deliveryBannerDesc || ""} onChange={e => update("offersPage.deliveryBannerDesc", e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Hero Section Content */}
        <SectionCard title="Hero Section (Homepage)" icon={Globe}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[1, 2, 3].map(n => (
                <div key={n} className="p-4 bg-background border border-white/10 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-white/50 uppercase">Stat {n}</span>
                  <Field label="Value">
                    <input className={inputCls} value={(settings as any)?.hero?.[`stat${n}Value`] || ""} onChange={e => update(`hero.stat${n}Value`, e.target.value)} placeholder={["4.9★", "50K+", "10+"][n - 1]} />
                  </Field>
                  <Field label="Label">
                    <input className={inputCls} value={(settings as any)?.hero?.[`stat${n}Label`] || ""} onChange={e => update(`hero.stat${n}Label`, e.target.value)} placeholder={["Rating", "Orders Served", "Years"][n - 1]} />
                  </Field>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/8">
              <Field label="Trending Tags (comma-separated)">
                <input
                  className={inputCls}
                  value={Array.isArray((settings as any)?.hero?.trendingTags) ? (settings as any).hero.trendingTags.join(", ") : ""}
                  onChange={e => update("hero.trendingTags", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="Pizza, Cheeza, Burgers, Wings, Sides"
                />
              </Field>
              <p className="text-xs text-white/40 mt-1">Shown as quick-search tags below the search bar on the homepage.</p>
            </div>
          </div>
        </SectionCard>

        {/* Reviews Page */}
        <SectionCard title="Reviews Page Content" icon={Globe}>
          <div className="grid grid-cols-1 gap-5">
            <Field label="Hero Tag">
              <input className={inputCls} value={(settings as any)?.reviewsPage?.heroTag || ""} onChange={e => update("reviewsPage.heroTag", e.target.value)} placeholder="CUSTOMER REVIEWS" />
            </Field>
            <Field label="Hero Title">
              <input className={inputCls} value={(settings as any)?.reviewsPage?.heroTitle || ""} onChange={e => update("reviewsPage.heroTitle", e.target.value)} placeholder="What Our Customers Say" />
            </Field>
            <Field label="Hero Subtitle">
              <textarea className={inputCls} rows={2} value={(settings as any)?.reviewsPage?.heroSubtitle || ""} onChange={e => update("reviewsPage.heroSubtitle", e.target.value)} placeholder="Real reviews from real customers..." />
            </Field>
          </div>
        </SectionCard>

        {/* Gallery Page Hero */}
        <SectionCard title="Gallery Page Content" icon={Globe}>
          <div className="grid grid-cols-1 gap-5">
            <Field label="Hero Tag">
              <input className={inputCls} value={(settings as any)?.galleryPage?.heroTag || ""} onChange={e => update("galleryPage.heroTag", e.target.value)} placeholder="CULINARY GALLERY" />
            </Field>
            <Field label="Hero Title">
              <input className={inputCls} value={(settings as any)?.galleryPage?.heroTitle || ""} onChange={e => update("galleryPage.heroTitle", e.target.value)} placeholder="Behind the Craft" />
            </Field>
            <Field label="Hero Subtitle">
              <textarea className={inputCls} rows={2} value={(settings as any)?.galleryPage?.heroSubtitle || ""} onChange={e => update("galleryPage.heroSubtitle", e.target.value)} placeholder="A glimpse into our kitchens..." />
            </Field>
          </div>
        </SectionCard>

        {/* Contact Page */}
        <SectionCard title="Contact Page Content" icon={Globe}>
          <div className="grid grid-cols-1 gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Hero Tag">
                <input className={inputCls} value={(settings as any)?.contactPage?.heroTag || ""} onChange={e => update("contactPage.heroTag", e.target.value)} placeholder="GET IN TOUCH" />
              </Field>
              <Field label="Hero Title">
                <input className={inputCls} value={(settings as any)?.contactPage?.heroTitle || ""} onChange={e => update("contactPage.heroTitle", e.target.value)} placeholder="Contact Us" />
              </Field>
            </div>
            <Field label="Hero Subtitle">
              <textarea className={inputCls} rows={2} value={(settings as any)?.contactPage?.heroSubtitle || ""} onChange={e => update("contactPage.heroSubtitle", e.target.value)} placeholder="Have a question, suggestion..." />
            </Field>
            <div className="pt-4 border-t border-white/8 grid grid-cols-1 gap-5">
              <Field label="Form Intro Title">
                <input className={inputCls} value={(settings as any)?.contactPage?.formIntroTitle || ""} onChange={e => update("contactPage.formIntroTitle", e.target.value)} placeholder="We'd love to hear from you" />
              </Field>
              <Field label="Form Intro Description">
                <textarea className={inputCls} rows={2} value={(settings as any)?.contactPage?.formIntroDesc || ""} onChange={e => update("contactPage.formIntroDesc", e.target.value)} placeholder="Whether you have a question about our menu..." />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Legal Links */}
        <SectionCard title="Legal & Footer Links" icon={Globe}>
          <div className="grid grid-cols-1 gap-5">
            <Field label="Privacy Policy URL">
              <input className={inputCls} value={(settings as any)?.legalLinks?.privacyPolicyUrl || ""} onChange={e => update("legalLinks.privacyPolicyUrl", e.target.value)} placeholder="https://halalpizzafun.com/privacy" />
            </Field>
            <Field label="Terms of Service URL">
              <input className={inputCls} value={(settings as any)?.legalLinks?.termsOfServiceUrl || ""} onChange={e => update("legalLinks.termsOfServiceUrl", e.target.value)} placeholder="https://halalpizzafun.com/terms" />
            </Field>
            <Field label="Cookie Policy URL">
              <input className={inputCls} value={(settings as any)?.legalLinks?.cookiePolicyUrl || ""} onChange={e => update("legalLinks.cookiePolicyUrl", e.target.value)} placeholder="https://halalpizzafun.com/cookies" />
            </Field>
            <p className="text-xs text-white/40">Leave blank to show the label as plain text (not a link) in the footer.</p>
          </div>
        </SectionCard>

        {/* Social Links */}
        <SectionCard title="Social Links" icon={Globe}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {["facebook", "instagram", "twitter", "youtube"].map(platform => (
              <Field key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                <input className={inputCls} value={(settings as any)?.socialLinks?.[platform] || ""}
                  onChange={e => update(`socialLinks.${platform}`, e.target.value)}
                  placeholder={`https://${platform}.com/yourpage`} />
              </Field>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Floating Save */}
      <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-40">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary text-black px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-bold shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 text-sm sm:text-base">
          {saving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5" />}
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>
    </div>
  );
}
