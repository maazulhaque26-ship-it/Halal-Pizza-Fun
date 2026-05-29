"use client";

import { useState, useEffect } from "react";
import { useCsrf } from "@/lib/hooks/useCsrf";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/Toast";
import {
  ShieldCheck,
  Users2,
  Megaphone,
  GraduationCap,
  UtensilsCrossed,
  CheckCircle2,
  ArrowRight,
  Loader2,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronRight,
  Rocket,
  Clock,
  Award,
} from "lucide-react";
import { API } from "@/config/constants";

const WHY_ICONS = [ShieldCheck, TrendingUp, Megaphone, GraduationCap, UtensilsCrossed, CheckCircle2];
const USP_ICONS = [ShieldCheck, Users2, UtensilsCrossed];
const STEP_ICONS = [Rocket, Clock, Award];

export default function FranchisePage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    capital: "50-100k",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { csrfToken, refetch: refetchCsrf } = useCsrf();

  useEffect(() => {
    fetch(API.SETTINGS, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSettings(d.data);
      })
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
    return cur !== undefined && cur !== null && cur !== "" ? cur : fallback;
  };
  const f = (key: string, fallback = "") => g(`franchisePage.${key}`, fallback);

  const getArr = <T,>(key: string, flatFallback: T[]): T[] => {
    const arr = settings?.franchisePage?.[key];
    return Array.isArray(arr) && arr.length > 0 ? arr : flatFallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.phone || !formData.city) {
      toast.error("Please fill in all required fields.");
      return;
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
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          city: "",
          capital: "50-100k",
        });
        refetchCsrf();
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff4e4] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#ef5a24]" />
      </main>
    );
  }

  const whyItems = getArr<{ title: string; desc: string }>("whyItems", [
    { title: f("why1Title", "Trusted Brand"), desc: f("why1Desc") },
    { title: f("why2Title", "Proven Business Model"), desc: f("why2Desc") },
    { title: f("why3Title", "Marketing Support"), desc: f("why3Desc") },
    { title: f("why4Title", "Training Assistance"), desc: f("why4Desc") },
    { title: f("why5Title", "Innovative Menu"), desc: f("why5Desc") },
    { title: f("why6Title", "100% Halal Certified"), desc: f("why6Desc") },
  ]);
  const mktStats = getArr<{ value: string; label: string }>("mktItems", [
    { value: f("mkt1Value", "$2.71T"), label: f("mkt1Label", "Global Halal Market") },
    { value: f("mkt2Value", "3.45M+"), label: f("mkt2Label", "Muslim Population Growth") },
    { value: f("mkt3Value", "15+"), label: f("mkt3Label", "Active Branches") },
  ]);
  const uspItems = getArr<{ title: string; desc: string }>("uspItems", [
    { title: f("usp1Title", "100% Halal"), desc: f("usp1Desc") },
    { title: f("usp2Title", "Family-Friendly"), desc: f("usp2Desc") },
    { title: f("usp3Title", "Innovative Menu"), desc: f("usp3Desc") },
  ]);
  const invRows = getArr<{ label: string; value: string }>("invItems", [
    { label: f("invFeeLabel", "Franchise Fee"), value: f("invFeeValue", "Rs. 5,00,000") },
    { label: f("invStartupLabel", "Startup Cost"), value: f("invStartupValue", "Rs. 30-35 Lakhs") },
    { label: f("invRoyaltyLabel", "Royalty Fee"), value: f("invRoyaltyValue", "5% of Gross Sales") },
    { label: f("invMktFeeLabel", "Marketing Fee"), value: f("invMktFeeValue", "2% of Gross Sales") },
  ]);
  const steps = getArr<{ label: string }>("trainingItems", [
    { label: f("training1", "2-Week Intensive Training") },
    { label: f("training2", "On-Site Launch Support") },
    { label: f("training3", "Ongoing Operational Assistance") },
  ]);
  const branches = getArr<{ name: string }>("branchItems", [
    { name: f("branch1", "Delhi - 15 Branches") },
    { name: f("branch2", "Rajasthan - Kota") },
    { name: f("branch3", "Uttar Pradesh - 7 Branches") },
  ]);

  return (
    <main className="min-h-screen bg-[#fff4e4] text-[#2b160c]">
      <Navbar />

      <section className="relative overflow-hidden bg-[#140d09] px-4 pb-16 pt-28 sm:px-6 md:pb-24 md:pt-36">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#140d09_0%,#2a1309_54%,#0f1117_100%)]" />
        <div className="relative mx-auto max-w-6xl text-center">
          <span className="inline-flex rounded-full border border-[#ffb44a]/25 bg-[#ffb44a]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb44a]">
            {f("heroTag", "Franchise Opportunity")}
          </span>
          <h1 className="mt-7 font-playfair text-4xl font-black leading-none text-[#fff8ee] sm:text-6xl md:text-7xl">
            {f("heroTitle", "Grow With Halal Pizza Fun")}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#f8ead7]/72 sm:text-lg">
            {f("heroSubtitle")}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#f8ead7]/56">{f("heroDesc")}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#apply-form"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ef5a24] px-7 py-3.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_0_#9b3214] transition hover:translate-y-[2px] hover:bg-[#dc4818] hover:shadow-[0_3px_0_#9b3214]"
            >
              {f("heroCta1", "Apply for Franchise")}
              <ArrowRight className="w-4 h-4" />
            </a>
            <button className="rounded-2xl border border-[#ffb44a]/25 bg-[#ffb44a]/10 px-7 py-3.5 text-xs font-black uppercase tracking-[0.14em] text-[#ffb44a] transition hover:bg-[#ffb44a]/14">
              {f("heroCta2", "Download Brochure")}
            </button>
            <a
              href="#contact"
              className="rounded-2xl border border-white/20 bg-white/6 px-7 py-3.5 text-xs font-black uppercase tracking-[0.14em] text-white/80 transition hover:bg-white/12"
            >
              {f("heroCta3", "Contact Us")}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-22">
        <div className="mb-10 text-center">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a7471b]">The advantage</span>
          <h2 className="mt-3 font-playfair text-4xl font-black text-[#2b160c] sm:text-5xl">
            {f("whyTitle", "Why Partner With Halal Pizza Fun?")}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyItems.map((item, i) => {
            const Icon = WHY_ICONS[i % WHY_ICONS.length];
            return (
              <div
                key={i}
                className="rounded-[26px] border border-[#ead8c1] bg-[#fffaf2] p-6 shadow-[0_18px_46px_rgba(73,40,18,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#ef5a24]/35"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0dd] text-[#ef5a24]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-[#2b160c]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#6d5342]">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[#ead8c1] bg-[#fff8ee] py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-playfair text-3xl font-black text-[#2b160c] md:text-4xl">
            {f("mktTitle", "A Growing Market Opportunity")}
          </h2>
          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {mktStats.map((s, i) => (
              <div key={i} className="rounded-2xl border border-[#ead8c1] bg-white p-6 text-center">
                <div className="text-4xl font-black text-[#c94618]">{s.value}</div>
                <div className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#8f6b52]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-playfair text-3xl font-black text-[#2b160c] md:text-5xl">
          {f("uspTitle", "What Makes Us Different?")}
        </h2>
        <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {uspItems.map((item, i) => {
            const Icon = USP_ICONS[i % USP_ICONS.length];
            return (
              <div key={i} className="rounded-3xl border border-[#ead8c1] bg-[#fffaf2] p-7 text-center">
                <Icon className="mx-auto h-7 w-7 text-[#ef5a24]" />
                <h3 className="mt-4 text-xl font-black text-[#2b160c]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#6d5342]">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[#ead8c1] bg-[#fff8ee] py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center font-playfair text-3xl font-black text-[#2b160c] md:text-4xl">
            {f("invTitle", "Franchise Investment")}
          </h2>
          <div className="mt-8 overflow-hidden rounded-3xl border border-[#ead8c1] bg-white">
            {invRows.map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-6 py-4 ${i < invRows.length - 1 ? "border-b border-[#ead8c1]" : ""}`}>
                <span className="text-sm font-semibold text-[#6d5342]">{row.label}</span>
                <span className="text-sm font-black text-[#2b160c] md:text-lg">{row.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-sm text-[#8f6b52]">{f("invNote")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-playfair text-3xl font-black text-[#2b160c] md:text-4xl">
          {f("trainingTitle", "Complete Training & Support")}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = STEP_ICONS[i % STEP_ICONS.length];
            return (
              <div key={i} className="rounded-3xl border border-[#ead8c1] bg-[#fffaf2] p-7 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0dd] text-[#ef5a24]">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-[#a7471b]">Step {i + 1}</p>
                <h3 className="mt-2 text-lg font-black text-[#2b160c]">{step.label}</h3>
              </div>
            );
          })}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-7 text-[#6d5342]">{f("trainingDesc")}</p>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6">
        <h2 className="font-playfair text-3xl font-black text-[#2b160c] md:text-4xl">{f("growthTitle", "Our Journey & Growth")}</h2>
        <p className="mt-4 text-base leading-8 text-[#6d5342]">{f("growthDesc")}</p>
      </section>

      <section className="border-y border-[#ead8c1] bg-[#fff8ee] py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-playfair text-3xl font-black text-[#2b160c] md:text-4xl">
            {f("branchesTitle", "Our Presence")}
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {branches.map((b, i) => (
              <div key={i} className="inline-flex items-center gap-2 rounded-2xl border border-[#ead8c1] bg-white px-5 py-3 text-sm font-semibold text-[#6d5342]">
                <MapPin className="h-4 w-4 text-[#ef5a24]" />
                {b.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-9 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a7471b]">Apply now</span>
          <h2 className="mt-3 font-playfair text-3xl font-black text-[#2b160c] md:text-4xl">Start Your Franchise Journey</h2>
          <p className="mt-4 text-sm leading-7 text-[#6d5342]">
            Fill in the form to receive our complete franchise brochure and get contacted by our franchise director within 48 hours.
          </p>
          <ul className="mt-7 space-y-4">
            {[
              "Complete setup and launch support",
              "Dedicated franchise manager",
              "Access to proprietary recipes and SOPs",
              "National marketing campaigns",
              "Real-time operations dashboard",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff0dd]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#ef5a24]" />
                </div>
                <span className="text-sm font-semibold text-[#6d5342]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div id="apply-form" className="rounded-[30px] border border-[#ead8c1] bg-[#fffaf2] p-7 shadow-[0_18px_50px_rgba(73,40,18,0.1)] md:p-9">
          <h3 className="text-2xl font-black text-[#2b160c]">Request Information</h3>
          <p className="mt-1 text-sm text-[#8f6b52]">Take the first step towards owning a Halal Pizza Fun kitchen.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(["First Name *", "Last Name"] as const).map((label, i) => (
                <div key={i}>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#a7471b]">{label}</label>
                  <input
                    type="text"
                    required={i === 0}
                    className="w-full rounded-xl border border-[#ead8c1] bg-white px-4 py-3 text-sm font-semibold text-[#2b160c] outline-none transition focus:border-[#ef5a24]/55"
                    value={i === 0 ? formData.firstName : formData.lastName}
                    onChange={(e) => setFormData({ ...formData, [i === 0 ? "firstName" : "lastName"]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(["email", "phone"] as const).map((field, i) => (
                <div key={i}>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#a7471b]">
                    {field === "email" ? "Email *" : "Phone *"}
                  </label>
                  <input
                    type={field === "email" ? "email" : "tel"}
                    required
                    className="w-full rounded-xl border border-[#ead8c1] bg-white px-4 py-3 text-sm font-semibold text-[#2b160c] outline-none transition focus:border-[#ef5a24]/55"
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#a7471b]">Target City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Delhi, Mumbai, Kota"
                className="w-full rounded-xl border border-[#ead8c1] bg-white px-4 py-3 text-sm font-semibold text-[#2b160c] placeholder:text-[#b89273] outline-none transition focus:border-[#ef5a24]/55"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#a7471b]">Liquid Capital *</label>
              <select
                className="w-full appearance-none rounded-xl border border-[#ead8c1] bg-white px-4 py-3 text-sm font-semibold text-[#2b160c] outline-none transition focus:border-[#ef5a24]/55"
                value={formData.capital}
                onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
              >
                <option value="30-50L">Rs. 30 - Rs. 50 Lakhs</option>
                <option value="50-100L">Rs. 50 Lakhs - Rs. 1 Crore</option>
                <option value="1Cr+">Rs. 1 Crore +</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef5a24] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_0_#9b3214] transition hover:translate-y-[2px] hover:bg-[#dc4818] hover:shadow-[0_3px_0_#9b3214] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            <p className="pt-1 text-center text-xs text-[#8f6b52]">Your information is secure and will never be shared.</p>
          </form>
        </div>
      </section>

      <section id="contact" className="relative overflow-hidden bg-[#140d09] px-4 py-18 text-center sm:px-6 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#140d09_0%,#2a1309_54%,#0f1117_100%)]" />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="font-playfair text-4xl font-black text-[#fff8ee] md:text-5xl">{f("ctaTitle", "Take the Next Step")}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#f8ead7]/65">{f("ctaDesc")}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href="#apply-form"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#ef5a24] px-8 py-4 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_0_#9b3214] transition hover:translate-y-[2px] hover:bg-[#dc4818] hover:shadow-[0_3px_0_#9b3214]"
            >
              {f("ctaBtn1", "Apply Now")}
              <ChevronRight className="h-5 w-5" />
            </a>
            <a
              href={`mailto:${f("ctaEmail")}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#ffb44a]/25 bg-[#ffb44a]/10 px-8 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#ffb44a] transition hover:bg-[#ffb44a]/14"
            >
              {f("ctaBtn2", "Contact Franchise Team")}
            </a>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {[
              { Icon: Phone, text: f("ctaPhone", "+91 8800155198"), href: `tel:${f("ctaPhone")}` },
              { Icon: Mail, text: f("ctaEmail", "pizzafunindia@gmail.com"), href: `mailto:${f("ctaEmail")}` },
              { Icon: Globe, text: f("ctaWebsite", "halalpizzafun.com"), href: `https://${f("ctaWebsite")}` },
            ].map(({ Icon, text, href }, i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-[#ffb44a]">
                <Icon className="h-4 w-4 text-[#ffb44a]" />
                {text}
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
