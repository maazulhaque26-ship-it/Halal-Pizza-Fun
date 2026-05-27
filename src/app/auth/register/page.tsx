"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { User, Lock, Mail, ArrowRight, Loader2, Phone, Eye, EyeOff, Flame } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/Toast";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Already logged in → go home
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account created successfully! Please log in.");
        router.push("/auth/login");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fields = [
    { name: "name",     label: "Full Name",     type: "text",     icon: User,  placeholder: "John Doe",          required: true },
    { name: "email",    label: "Email Address", type: "email",    icon: Mail,  placeholder: "you@example.com",   required: true },
    { name: "phone",    label: "Phone Number",  type: "tel",      icon: Phone, placeholder: "+91 98765 43210",   required: false },
  ] as const;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.06),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.04),transparent_55%)]" />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.07, 0.04] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]"
      />

      <div className="flex items-center justify-center p-4 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative w-full max-w-md"
        >
          {/* Card */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(13,24,41,0.98), rgba(10,18,35,0.99))",
              border: "1px solid rgba(212,175,55,0.15)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.05)",
            }}
          >
            {/* Top accent */}
            <div className="h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

            <div className="p-8 md:p-10">
              {/* Brand mark */}
              <div className="flex flex-col items-center gap-3 mb-8">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #C5A028)", boxShadow: "0 8px 24px rgba(212,175,55,0.4)" }}
                >
                  <Flame className="w-7 h-7 text-black" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-black text-white tracking-tight">Create Account</h1>
                  <p className="text-white/40 text-sm mt-1">Join for premium dining experiences</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {fields.map(({ name, label, type, icon: Icon, placeholder, required }) => (
                  <div key={name}>
                    <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 w-4 h-4" />
                      <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        required={required}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-white/20 text-sm font-medium transition-all focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                    </div>
                  </div>
                ))}

                {/* Password */}
                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl text-white placeholder:text-white/20 text-sm font-medium transition-all focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm transition-all disabled:opacity-60 mt-2"
                  style={{
                    background: "linear-gradient(135deg, #D4AF37, #C5A028)",
                    color: "#000",
                    boxShadow: "0 8px 24px rgba(212,175,55,0.35)",
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-white/30">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary font-bold hover:text-accent transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-white/20">
            <Link href="/" className="hover:text-white/50 transition-colors">
              ← Back to homepage
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
