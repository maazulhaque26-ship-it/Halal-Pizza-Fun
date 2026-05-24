"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Save, Eye, EyeOff, Loader2, CheckCircle, User, Shield, Mail, Lock, Upload, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/Toast";

export default function AdminProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({ name: "", email: "", image: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProfile({ name: d.data.name || "", email: d.data.email || "", image: d.data.image || "" });
          setPreviewUrl(d.data.image || "");
        }
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, WebP or GIF images allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "profile");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setProfile(p => ({ ...p, image: data.url }));
      toast.success("Photo uploaded — save profile to apply.");
    } catch (err: any) {
      toast.error(err.message || "Photo upload failed.");
      setPreviewUrl(profile.image);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl("");
    setProfile(p => ({ ...p, image: "" }));
  };

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) { toast.error("Name cannot be empty."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, image: profile.image }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await updateSession({ name: profile.name, image: profile.image });
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!passwords.current) { toast.error("Enter your current password."); return; }
    if (passwords.newPass.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (passwords.newPass !== passwords.confirm) { toast.error("Passwords do not match."); return; }
    setSavingPass(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPasswords({ current: "", newPass: "", confirm: "" });
      toast.success("Password changed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setSavingPass(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your Super Admin profile, photo, and password.</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl p-6 md:p-8 space-y-6"
        style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-black text-white">Profile Information</h2>
        </div>

        {/* Photo section */}
        <div className="flex items-start gap-6">
          <div className="relative shrink-0">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: "rgba(244,196,48,0.08)", border: "2px solid rgba(244,196,48,0.18)" }}
            >
              {uploadingPhoto ? (
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              ) : previewUrl ? (
                <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-primary/60">
                  {profile.name?.[0]?.toUpperCase() || session?.user?.name?.[0]?.toUpperCase() || "A"}
                </span>
              )}
            </div>

            {/* Camera overlay button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "#F4C430", boxShadow: "0 4px 12px rgba(244,196,48,0.4)" }}
              title="Change photo"
            >
              <Camera className="w-4 h-4 text-black" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-lg truncate">{profile.name || "Super Admin"}</p>
            <p className="text-gray-400 text-sm truncate">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-black text-primary uppercase tracking-widest">Super Admin</span>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-bold text-primary/80 hover:text-primary transition-colors px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(244,196,48,0.08)", border: "1px solid rgba(244,196,48,0.18)" }}
              >
                <Upload className="w-3 h-3" /> Upload Photo
              </button>
              {previewUrl && (
                <button
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-400/80 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Name field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/25 text-sm font-medium transition-all focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(244,196,48,0.4)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            placeholder="Your display name"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Email Address
            <span className="ml-2 text-gray-600 normal-case font-normal">(read-only)</span>
          </label>
          <div
            className="w-full px-4 py-3 rounded-xl text-white/40 text-sm flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Mail className="w-4 h-4 text-white/20" />
            {profile.email}
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-60"
          style={{ background: "#F4C430", color: "#000", boxShadow: "0 4px 20px rgba(244,196,48,0.25)" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </motion.div>

      {/* Password Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-6 md:p-8 space-y-5"
        style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-black text-white">Change Password</h2>
        </div>

        {(["current", "newPass", "confirm"] as const).map((field) => {
          const labels: Record<string, string> = { current: "Current Password", newPass: "New Password", confirm: "Confirm New Password" };
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{labels[field]}</label>
              <div className="relative">
                <input
                  type={showPass[field] ? "text" : "password"}
                  value={passwords[field]}
                  onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white placeholder:text-white/25 text-sm font-medium transition-all focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(244,196,48,0.4)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  placeholder={labels[field]}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => ({ ...s, [field]: !s[field] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}

        {passwords.newPass && passwords.confirm && passwords.newPass === passwords.confirm && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> Passwords match
          </p>
        )}

        <button
          onClick={handleSavePassword}
          disabled={savingPass}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-60"
          style={{
            background: "rgba(244,196,48,0.1)",
            border: "1px solid rgba(244,196,48,0.2)",
            color: "#D4AF37",
          }}
        >
          {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {savingPass ? "Updating..." : "Update Password"}
        </button>
      </motion.div>
    </div>
  );
}
