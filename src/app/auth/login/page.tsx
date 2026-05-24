"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Loader2, Eye, EyeOff, Flame } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectPath(params.get("from") ?? "/");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const callbackUrl = `${window.location.origin}${redirectPath}`;
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        setError(result.error || "Invalid email or password");
        return;
      }

      if (!result?.ok) {
        setError("Login failed. Please check your credentials and try again.");
        return;
      }

      if (redirectPath && redirectPath !== "/") {
        window.location.href = callbackUrl;
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) {
        setError("Unable to retrieve session after login. Please refresh and try again.");
        return;
      }

      const session = await sessionRes.json();
      const role = session?.user?.role;

      if (role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else if (role === "BRANCH_MANAGER") {
        router.push("/branch/dashboard");
      } else if (role === "DELIVERY_STAFF") {
        router.push("/delivery");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.06),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.04),transparent_60%)]" />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]"
      />

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
          {/* Top accent line */}
          <div className="h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

          <div className="p-8 md:p-10">
            {/* Brand mark */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #C5A028)", boxShadow: "0 8px 24px rgba(212,175,55,0.4)" }}
                >
                  <Flame className="w-7 h-7 text-black" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
                  <p className="text-white/40 text-sm mt-1">Sign in to continue your food journey</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-white/20 text-sm font-medium transition-all focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-white placeholder:text-white/20 text-sm font-medium transition-all focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                    required
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

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm font-medium px-4 py-3 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {error}
                </motion.p>
              )}

              {/* Submit */}
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
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-white/30">
              New here?{" "}
              <Link href="/auth/register" className="text-primary font-bold hover:text-accent transition-colors">
                Create a free account
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <p className="mt-5 text-center text-xs text-white/20">
          <Link href="/" className="hover:text-white/50 transition-colors">
            ← Back to homepage
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
