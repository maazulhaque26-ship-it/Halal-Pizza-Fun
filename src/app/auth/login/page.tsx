"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Loader2, Eye, EyeOff, Flame } from "lucide-react";
import Link from "next/link";
import { ROLES } from "@/config/constants";

/** Where to send a user after successful login based on their role */
function roleDestination(role: string): string {
  if (role === ROLES.SUPER_ADMIN)   return "/admin/dashboard";
  if (role === ROLES.BRANCH_MANAGER) return "/branch/dashboard";
  if (role === ROLES.MANAGER)        return "/branch/dashboard";
  if (role === ROLES.DELIVERY_STAFF) return "/delivery";
  return "/";
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState("");

  // Where to go after login — read both ?from= (our own redirects) and
  // ?callbackUrl= (NextAuth's standard param, used by signIn() itself)
  const [dest, setDest] = useState("/");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from   = params.get("from");
    const cb     = params.get("callbackUrl");
    if (from) {
      setDest(from);
    } else if (cb) {
      // callbackUrl is a full URL — extract the pathname only
      try { setDest(new URL(cb).pathname); } catch { setDest(cb); }
    }
  }, []);

  // ── If already logged in, skip the form and go straight to dashboard ──
  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && session?.user) {
      // If `dest` points to a role-appropriate page, use it; otherwise role dashboard
      const target = dest !== "/" ? dest : roleDestination(session.user.role);
      router.replace(target);
    }
  }, [status, session, dest, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result?.ok || result.error) {
        setError(result?.error || "Invalid email or password. Please try again.");
        return;
      }

      // Fetch the session so we know the role for routing
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role as string | undefined;

      if (!role) {
        setError("Login failed — could not read session. Please try again.");
        return;
      }

      // Role-appropriate destination, or the page they came from
      let target = dest !== "/" ? dest : roleDestination(role);

      // Safety: don't send non-admin roles to admin pages
      if (target.startsWith("/admin") && role !== ROLES.SUPER_ADMIN) {
        target = roleDestination(role);
      }
      if (target.startsWith("/branch") &&
          role !== ROLES.BRANCH_MANAGER && role !== ROLES.MANAGER && role !== ROLES.SUPER_ADMIN) {
        target = roleDestination(role);
      }

      router.push(target);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show spinner while checking existing session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Already logged in — useEffect above will redirect; show nothing in the meantime
  if (status === "authenticated") return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
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
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(13,24,41,0.98), rgba(10,18,35,0.99))",
            border: "1px solid rgba(212,175,55,0.15)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.05)",
          }}
        >
          <div className="h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

          <div className="p-8 md:p-10">
            {/* Brand */}
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
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-white/20 text-sm font-medium transition-all focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
                    onBlur={e  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
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
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-white placeholder:text-white/20 text-sm font-medium transition-all focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
                    onBlur={e  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors p-1"
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
                  <> Sign In <ArrowRight className="w-4 h-4" /> </>
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

        <p className="mt-5 text-center text-xs text-white/20">
          <Link href="/" className="hover:text-white/50 transition-colors">← Back to homepage</Link>
        </p>
      </motion.div>
    </div>
  );
}
