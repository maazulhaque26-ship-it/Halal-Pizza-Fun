"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Send, Loader2, Globe, Clock } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API } from "@/config/constants";

export default function ContactPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(API.SETTINGS, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setSettings(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const g = (key: string, fallback = "") => {
    if (!settings) return fallback;
    return settings[key] || fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    // Simulate sending — wire to a real email API if needed
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Message sent! We'll get back to you shortly.");
    setForm({ name: "", email: "", subject: "", message: "" });
    setSubmitting(false);
  };

  const email = g("contactEmail", "hello@hpf.com");
  const phone = g("contactPhone", "+91 8800155198");
  const address = g("address", "");
  const website = g("contactWebsite", "");
  const hours = g("contactHours", "Mon – Sun: 10:00 AM – 11:00 PM");

  const contactItems = [
    { Icon: Mail, label: "Email Us", value: email, href: `mailto:${email}` },
    { Icon: Phone, label: "Call Us", value: phone, href: `tel:${phone}` },
    ...(address ? [{ Icon: MapPin, label: "Visit Us", value: address, href: `https://maps.google.com?q=${encodeURIComponent(address)}` }] : []),
    ...(hours ? [{ Icon: Clock, label: "Opening Hours", value: hours, href: null }] : []),
    ...(website ? [{ Icon: Globe, label: "Website", value: website, href: `https://${website.replace(/^https?:\/\//, "")}` }] : []),
  ];

  return (
    <main className="min-h-screen bg-background text-white font-sans selection:bg-primary selection:text-black">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(212,175,55,0.15),transparent)]">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <span className="text-primary font-black tracking-widest text-xs uppercase px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            {settings?.contactPage?.heroTag || "GET IN TOUCH"}
          </span>
          <h1 className="text-5xl md:text-7xl font-black mt-6 mb-6 tracking-tight leading-none text-white">
            {settings?.contactPage?.heroTitle || "Contact Us"}
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            {settings?.contactPage?.heroSubtitle || "Have a question, suggestion, or want to partner with us? We're just a message away."}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">
                  {settings?.contactPage?.formIntroTitle || "We'd love to hear from you"}
                </h2>
                <p className="text-white/50 leading-relaxed">
                  {settings?.contactPage?.formIntroDesc || "Whether you have a question about our menu, delivery, franchise opportunities, or anything else — our team is ready to help."}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                {contactItems.map(({ Icon, label, value, href }, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="text-white font-semibold hover:text-primary transition-colors mt-0.5 block"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-white font-semibold mt-0.5">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              {(settings?.socialLinks?.instagram ||
                settings?.socialLinks?.facebook ||
                settings?.socialLinks?.twitter ||
                settings?.socialLinks?.youtube) && (
                <div className="pt-6 border-t border-white/8">
                  <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-4">Follow Us</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: "instagram", label: "Instagram", color: "hover:border-pink-500/50 hover:text-pink-400" },
                      { key: "facebook", label: "Facebook", color: "hover:border-blue-500/50 hover:text-blue-400" },
                      { key: "twitter", label: "Twitter / X", color: "hover:border-sky-500/50 hover:text-sky-400" },
                      { key: "youtube", label: "YouTube", color: "hover:border-red-500/50 hover:text-red-400" },
                    ]
                      .filter(({ key }) => settings?.socialLinks?.[key])
                      .map(({ key, label, color }) => (
                        <a
                          key={key}
                          href={settings.socialLinks[key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-4 py-2 border border-white/10 text-white/40 rounded-xl text-sm font-semibold transition-all ${color}`}
                        >
                          {label}
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-[3rem] pointer-events-none" />
              <div className="relative p-8 md:p-10 rounded-[2.5rem] shadow-2xl" style={{ background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-2xl font-black text-white mb-2">Send a Message</h3>
                <p className="text-white/50 text-sm mb-7">We typically respond within 24 hours.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm placeholder:text-white/25"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm placeholder:text-white/25"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/10 uppercase tracking-wider mb-2">Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/10 uppercase tracking-wider mb-2">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us how we can help..."
                        className="w-full bg-background border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors text-sm resize-none placeholder:text-white/25"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black font-black py-4 rounded-xl transition-all disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {submitting ? "Sending…" : "Send Message"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
