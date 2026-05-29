"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Save, Loader2,
  LogOut, ShoppingBag, ChevronRight, Edit3, Check, X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { toast } from "@/components/ui/Toast";

const inputCls =
  "w-full px-4 py-3 bg-white border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/50 text-[#2b160c] placeholder:text-[#8f6b52] text-sm transition-all";

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [profile, setProfile]       = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Edit mode
  const [editing, setEditing]       = useState(false);
  const [name, setName]             = useState("");
  const [phone, setPhone]           = useState("");
  const [saving, setSaving]         = useState(false);

  // Password change
  const [showPwSection, setShowPwSection] = useState(false);
  const [pw, setPw]                 = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw]         = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw]     = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login?from=/profile");
  }, [status, router]);

  // Fetch full profile
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProfile(d.data);
          setName(d.data.name || "");
          setPhone(d.data.phone || "");
        }
      })
      .catch(() => toast.error("Could not load profile"))
      .finally(() => setLoadingProfile(false));
  }, [status]);

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setEditing(false);
        toast.success("Profile updated ✓");
        // Refresh the session name so the Navbar updates
        await updateSession({ name: name.trim() });
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch { toast.error("Update failed"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pw.current)              { toast.error("Enter your current password"); return; }
    if (pw.next.length < 6)       { toast.error("New password must be at least 6 characters"); return; }
    if (pw.next !== pw.confirm)   { toast.error("Passwords do not match"); return; }
    setSavingPw(true);
    try {
      const res  = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully ✓");
        setPw({ current: "", next: "", confirm: "" });
        setShowPwSection(false);
      } else {
        toast.error(data.message || "Password change failed");
      }
    } catch { toast.error("Password change failed"); }
    finally { setSavingPw(false); }
  };

  if (status === "loading" || loadingProfile) {
    return (
      <div className="min-h-screen bg-[#fff4e4]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="w-8 h-8 text-[#ef5a24] animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const initials = (profile?.name || session.user.name || "?")
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#fff4e4]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-28">
        <h1 className="font-playfair text-3xl sm:text-4xl font-black text-[#2b160c] mb-8">My Profile</h1>

        <div className="space-y-5">

          {/* ── Avatar + Name card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 bg-[#fffaf2] border border-[#ead8c1] shadow-[0_18px_46px_rgba(73,40,18,0.08)]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar */}
              <div className="shrink-0 mx-auto sm:mx-0">
                <div className="w-20 h-20 rounded-full border-2 border-[#ef5a24] overflow-hidden flex items-center justify-center bg-[#ef5a24]/10 relative">
                  {profile?.image || session.user.image ? (
                    <img
                      src={profile?.image || session.user.image}
                      alt={profile?.name || session.user.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#ef5a24] font-black text-2xl">{initials}</span>
                  )}
                </div>
              </div>

              {/* Info / Edit form */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                {editing ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8f6b52]" />
                      <input
                        className={`${inputCls} pl-10`}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8f6b52]" />
                      <input
                        className={`${inputCls} pl-10`}
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Phone number (optional)"
                        type="tel"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#ef5a24] text-white shadow-md text-sm font-black rounded-xl hover:bg-[#ef5a24]/90 disabled:opacity-60 transition-colors"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Save
                      </button>
                      <button
                        onClick={() => { setEditing(false); setName(profile?.name || ""); setPhone(profile?.phone || ""); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#fffaf2] border border-[#ead8c1] text-[#8f6b52] text-sm font-semibold rounded-xl hover:bg-[#ead8c1]/30 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-black text-[#2b160c]">{profile?.name || session.user.name}</h2>
                    <p className="text-[#8f6b52] text-sm mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {profile?.email || session.user.email}
                    </p>
                    {profile?.phone && (
                      <p className="text-[#8f6b52] text-sm mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {profile.phone}
                      </p>
                    )}
                    <button
                      onClick={() => setEditing(true)}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 border border-[#ef5a24]/40 text-[#ef5a24] text-sm font-bold rounded-xl hover:bg-[#ef5a24]/10 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Quick links ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl overflow-hidden bg-[#fffaf2] border border-[#ead8c1] shadow-[0_18px_46px_rgba(73,40,18,0.08)]"
          >
            <Link
              href="/orders"
              className="flex items-center justify-between px-5 py-4 hover:bg-black/5 transition-colors border-b border-[#ead8c1]"
            >
              <div className="flex items-center gap-3 text-[#2b160c]/80">
                <ShoppingBag className="w-4 h-4 text-[#ef5a24]" />
                <span className="text-sm font-semibold">My Orders</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8f6b52]" />
            </Link>
          </motion.div>

          {/* ── Change Password ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl overflow-hidden bg-[#fffaf2] border border-[#ead8c1] shadow-[0_18px_46px_rgba(73,40,18,0.08)]"
          >
            <button
              onClick={() => setShowPwSection(s => !s)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/5 transition-colors"
            >
              <div className="flex items-center gap-3 text-[#2b160c]/80">
                <Lock className="w-4 h-4 text-[#ef5a24]" />
                <span className="text-sm font-semibold">Change Password</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#8f6b52] transition-transform ${showPwSection ? "rotate-90" : ""}`} />
            </button>

            {showPwSection && (
              <div className="px-5 pb-5 space-y-3 border-t border-[#ead8c1] pt-4">
                {(["current", "next", "confirm"] as const).map(field => {
                  const labels = { current: "Current Password", next: "New Password", confirm: "Confirm New Password" };
                  return (
                    <div key={field} className="relative">
                      <input
                        type={showPw[field] ? "text" : "password"}
                        placeholder={labels[field]}
                        value={pw[field]}
                        onChange={e => setPw(p => ({ ...p, [field]: e.target.value }))}
                        className={`${inputCls} pr-11`}
                        autoComplete={field === "current" ? "current-password" : "new-password"}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPw(s => ({ ...s, [field]: !s[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f6b52] hover:text-[#8f6b52] transition-colors p-1"
                      >
                        {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
                {pw.next && pw.confirm && pw.next === pw.confirm && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Passwords match
                  </p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={savingPw}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#ef5a24]/10 border border-[#ef5a24]/25 text-[#ef5a24] font-black text-sm rounded-xl hover:bg-[#ef5a24]/20 disabled:opacity-60 transition-colors"
                >
                  {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {savingPw ? "Updating…" : "Update Password"}
                </button>
              </div>
            )}
          </motion.div>

          {/* ── Sign Out ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 font-bold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </motion.div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
