"use client";

import { useState, useEffect } from "react";
import { useCsrf } from "@/lib/hooks/useCsrf";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/Toast";
import {
  ShieldCheck, Users2, Megaphone, GraduationCap, UtensilsCrossed,
  CheckCircle2, ArrowRight, Loader2, TrendingUp, MapPin,
  Phone, Mail, Globe, ChevronRight, Rocket, Clock, Award
} from "lucide-react";
import { API } from "@/config/constants";

const WHY_ICONS = [ShieldCheck, TrendingUp, Megaphone, GraduationCap, UtensilsCrossed, CheckCircle2];
const USP_ICONS  = [ShieldCheck, Users2, UtensilsCrossed];
const STEP_ICONS = [Rocket, Clock, Award];

export default function FranchisePage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", city: "", capital: "50-100k",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { csrfToken, refetch: refetchCsrf } = useCsrf();

  useEffect(() => {
    fetch(API.SETTINGS, { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const g = (path: string, fallback = "") => {
    if (!settings) return fallback;
    const keys = path.split(".");
    let cur: any = settings;
    for (const k of keys) {
      if (cur == null || typeof cur !== "object") return fallback;
      cur = cur[k];
    }
    return (cur !== undefined && cur !== null && cur !== "") ? cur : fallback;
  };
  const f = (key: string, fallback = "") => g(`franchisePage.${key}`, fallback);

  const getArr = <T,>(key: string, flatFallback: T[]): T[] => {
    const arr = settings?.franchisePage?.[key];
    return Array.isArray(arr) && arr.length > 0 ? arr : flatFallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.phone || !formData.city) {
      toast.error("Please fill in all required fields."); return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/franchise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Application submitted! Our franchise director will contact you within 48 hours.");
        setFormData({ firstName: "", lastName: "", email: "", phone: "", city: "", capital: "50-100k" });
        refetchCsrf(); // rotate the token after each successful submission
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </main>
    );
  }

  const whyItems = getArr<{ title: string; desc: string }>("whyItems", [
    { title: f("why1Title","Trusted Brand"),        desc: f("why1Desc") },
    { title: f("why2Title","Proven Business Model"),desc: f("why2Desc") },
    { title: f("why3Title","Marketing Support"),    desc: f("why3Desc") },
    { title: f("why4Title","Training Assistance"),  desc: f("why4Desc") },
    { title: f("why5Title","Innovative Menu"),      desc: f("why5Desc") },
    { title: f("why6Title","100% Halal Certified"), desc: f("why6Desc") },
  ]);
  const mktStats = getArr<{ value: string; label: string }>("mktItems", [
    { value: f("mkt1Value","$2.71T"),  label: f("mkt1Label","Global Halal Market") },
    { value: f("mkt2Value","3.45M+"), label: f("mkt2Label","Muslim Population Growth") },
    { value: f("mkt3Value","15+"),     label: f("mkt3Label","Active Branches") },
  ]);
  const uspItems = getArr<{ title: string; desc: string }>("uspItems", [
    { title: f("usp1Title","100% Halal"),       desc: f("usp1Desc") },
    { title: f("usp2Title","Family-Friendly"),  desc: f("usp2Desc") },
    { title: f("usp3Title","Innovative Menu"),  desc: f("usp3Desc") },
  ]);
  const invRows = getArr<{ label: string; value: string }>("invItems", [
    { label: f("invFeeLabel","Franchise Fee"),   value: f("invFeeValue","₹5,00,000") },
    { label: f("invStartupLabel","Startup Cost"),value: f("invStartupValue","₹30–35 Lakhs") },
    { label: f("invRoyaltyLabel","Royalty Fee"), value: f("invRoyaltyValue","5% of Gross Sales") },
    { label: f("invMktFeeLabel","Marketing Fee"),value: f("invMktFeeValue","2% of Gross Sales") },
  ]);
  const steps = getArr<{ label: string }>("trainingItems", [
    { label: f("training1","2-Week Intensive Training") },
    { label: f("training2","On-Site Launch Support") },
    { label: f("training3","Ongoing Operational Assistance") },
  ]);
  const branches = getArr<{ name: string }>("branchItems", [
    { name: f("branch1","Delhi – 15 Branches") },
    { name: f("branch2","Rajasthan – Kota") },
    { name: f("branch3","Uttar Pradesh – 7 Branches") },
  ]);

  return (
    <main className="min-h-screen bg-background text-white font-sans selection:bg-primary selection:text-black">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(212,175,55,0.22),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(120,60,200,0.12),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <span className="inline-block text-primary font-black tracking-widest text-xs uppercase px-4 py-1.5 bg-primary/10 rounded-full border border-primary/25 mb-6">
            {f("heroTag","FRANCHISE OPPORTUNITY")}
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none mb-6 text-white">
            {f("heroTitle","Grow With Halal Pizza Fun")}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-4 leading-relaxed font-medium">
            {f("heroSubtitle")}
          </p>
          <p className="text-sm text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            {f("heroDesc")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="#apply-form"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-black px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/30 text-sm">
              {f("heroCta1","Apply for Franchise")} <ArrowRight className="w-4 h-4" />
            </a>
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-7 py-3.5 rounded-2xl transition-all text-sm">
              {f("heroCta2","Download Brochure")}
            </button>
            <a href="#contact"
              className="flex items-center gap-2 bg-transparent hover:bg-white/10 border border-white/10 text-white/80 font-bold px-7 py-3.5 rounded-2xl transition-all text-sm">
              {f("heroCta3","Contact Us")}
            </a>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/8 bg-white/2">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-primary font-bold text-xs tracking-widest uppercase">THE ADVANTAGE</span>
            <h2 className="text-3xl md:text-5xl font-black mt-3">{f("whyTitle","Why Partner With Halal Pizza Fun?")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyItems.map((item, i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length];
              return (
                <div key={i} className="group p-7 rounded-3xl transition-all duration-300 hover:-translate-y-1" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.3)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                  <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-extrabold text-lg mb-2 text-white">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Opportunity ──────────────────────────────────────────── */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-primary text-xs font-black uppercase tracking-widest">Opportunity</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black mb-6">{f("oppTitle","Your Slice of the Future")}</h2>
        <p className="text-white/50 text-lg leading-relaxed">{f("oppDesc")}</p>
      </section>

      {/* ── Market Growth ─────────────────────────────────────────── */}
      <section className="py-16 bg-white/2 border-y border-white/8">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-4xl font-black text-center mb-12">{f("mktTitle","A Growing Market Opportunity")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {mktStats.map((s, i) => (
              <div key={i} className="rounded-3xl p-8 text-center transition-all" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.3)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <div className="text-4xl md:text-5xl font-black text-primary mb-2">{s.value}</div>
                <div className="text-white/50 text-sm font-semibold uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USP ──────────────────────────────────────────────────── */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black">{f("uspTitle","What Makes Us Different?")}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {uspItems.map((item, i) => {
            const Icon = USP_ICONS[i % USP_ICONS.length];
            return (
              <div key={i} className="relative overflow-hidden rounded-3xl p-8 text-center transition-all group" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.3)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-black mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Investment ───────────────────────────────────────────── */}
      <section className="py-20 bg-white/2 border-y border-white/8">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-10">{f("invTitle","Franchise Investment")}</h2>
          <div className="rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }}>
            {invRows.map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-8 py-5 ${i < invRows.length - 1 ? "border-b border-white/8" : ""}`}>
                <span className="text-white/50 font-semibold text-sm">{row.label}</span>
                <span className="text-white font-black text-lg">{row.value}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-white/50 text-sm mt-6">{f("invNote")}</p>
        </div>
      </section>

      {/* ── Training & Support ───────────────────────────────────── */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-12">{f("trainingTitle","Complete Training & Support")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {steps.map((step, i) => {
            const Icon = STEP_ICONS[i % STEP_ICONS.length];
            return (
              <div key={i} className="flex flex-col items-center text-center rounded-3xl p-8 transition-all" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.3)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-primary mb-2">Step {i + 1}</span>
                <h3 className="font-extrabold text-lg text-white">{step.label}</h3>
              </div>
            );
          })}
        </div>
        <p className="text-center text-white/50 leading-relaxed max-w-2xl mx-auto">{f("trainingDesc")}</p>
      </section>



      {/* ── Growth Timeline ───────────────────────────────────────── */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-6">{f("growthTitle","Our Journey & Growth")}</h2>
        <p className="text-white/50 text-lg leading-relaxed">{f("growthDesc")}</p>
      </section>

      {/* ── Branches ──────────────────────────────────────────────── */}
      <section className="py-16 bg-white/2 border-y border-white/8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-4xl font-black mb-10">{f("branchesTitle","Our Presence")}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {branches.map((b, i) => (
              <div key={i} className="flex items-center gap-2 px-6 py-4 rounded-2xl transition-all group" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.3)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-white/80 group-hover:text-white transition-colors">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ──────────────────────────────────────── */}
      <section className="py-20 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Apply Now</span>
          <h2 className="text-3xl md:text-4xl font-black mt-3 mb-4">Start Your Franchise Journey</h2>
          <p className="text-white/50 leading-relaxed mb-8">Fill in the form to receive our complete franchise brochure and get contacted by our franchise director within 48 hours.</p>
          <ul className="space-y-4">
            {["Complete setup & launch support", "Dedicated franchise manager", "Access to proprietary recipes & SOPs", "National marketing campaigns", "Real-time operations dashboard"].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                </div>
                <span className="text-white/80 font-medium text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div id="apply-form" className="relative">
          <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-[3rem] pointer-events-none" />
          <div className="relative p-8 md:p-10 rounded-[2.5rem] shadow-2xl" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-2xl font-black text-white mb-2">Request Information</h3>
            <p className="text-white/50 text-sm mb-7">Take the first step towards owning a Halal Pizza Fun kitchen.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {(["First Name *", "Last Name"] as const).map((label, i) => (
                  <div key={i}>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">{label}</label>
                    <input type="text" required={i === 0}
                      className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm placeholder:text-white/25"
                      value={i === 0 ? formData.firstName : formData.lastName}
                      onChange={e => setFormData({ ...formData, [i === 0 ? "firstName" : "lastName"]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(["email", "phone"] as const).map((field, i) => (
                  <div key={i}>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">{field === "email" ? "Email *" : "Phone *"}</label>
                    <input type={field === "email" ? "email" : "tel"} required
                      className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm placeholder:text-white/25"
                      value={formData[field]}
                      onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Target City *</label>
                <input type="text" required placeholder="e.g. Delhi, Mumbai, Kota"
                  className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm placeholder:text-white/25"
                  value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Liquid Capital *</label>
                <select className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors appearance-none text-sm"
                  value={formData.capital} onChange={e => setFormData({ ...formData, capital: e.target.value })}>
                  <option value="30-50L">₹30 – ₹50 Lakhs</option>
                  <option value="50-100L">₹50 Lakhs – ₹1 Crore</option>
                  <option value="1Cr+">₹1 Crore +</option>
                </select>
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black font-black px-6 py-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</> : <>Submit Application <ArrowRight className="w-5 h-5" /></>}
              </button>
              <p className="text-center text-xs text-white/30 pt-1">Your information is secure and will never be shared.</p>
            </form>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section id="contact" className="py-24 relative overflow-hidden border-t border-white/8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(212,175,55,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">{f("ctaTitle","Take the Next Step")}</h2>
          <p className="text-white/50 text-lg mb-10 leading-relaxed">{f("ctaDesc")}</p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a href="#apply-form"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-black px-8 py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all">
              {f("ctaBtn1","Apply Now")} <ChevronRight className="w-5 h-5" />
            </a>
            <a href={`mailto:${f("ctaEmail")}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl transition-all">
              {f("ctaBtn2","Contact Franchise Team")}
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { Icon: Phone, text: f("ctaPhone","+91 8800155198"), href: `tel:${f("ctaPhone")}` },
              { Icon: Mail,  text: f("ctaEmail","pizzafunindia@gmail.com"), href: `mailto:${f("ctaEmail")}` },
              { Icon: Globe, text: f("ctaWebsite","halalpizzafun.com"), href: `https://${f("ctaWebsite")}` },
            ].map(({ Icon, text, href }, i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/80 hover:text-primary transition-colors text-sm font-semibold">
                <Icon className="w-4 h-4 text-primary" /> {text}
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
