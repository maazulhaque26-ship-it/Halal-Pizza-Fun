"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, X, Save, ShieldAlert, Store, Edit } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API, ROLES } from "@/config/constants";

interface User {
  _id: string; name: string; email: string; role: string; createdAt: string;
  branchId?: { _id: string; name: string } | string;
}

const empty = { _id: "", name: "", email: "", password: "", role: ROLES.BRANCH_MANAGER, branchId: "" };
const inputCls = "w-full px-4 py-2.5 bg-[#0d1117] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 text-gray-100 placeholder:text-gray-600 text-sm transition-all";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [uRes, bRes] = await Promise.all([ fetch(API.USERS), fetch(API.BRANCHES) ]);
      const uData = await uRes.json();
      const bData = await bRes.json();
      if (uData.success) setUsers(uData.data);
      if (bData.success) setBranches(bData.data);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.email || (!form._id && !form.password)) { toast.error("Name and email are required. Password is required for new users."); return; }
    if (form.role === ROLES.BRANCH_MANAGER && !form.branchId) { toast.error("Branch Manager must be assigned to a branch"); return; }
    
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.role !== ROLES.BRANCH_MANAGER) delete payload.branchId;

      const url = payload._id ? `${API.USERS}/${payload._id}` : API.USERS;
      const method = payload._id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(payload._id ? "User updated!" : "User created!");
        setShowModal(false);
        fetchAll();
      } else toast.error(data.message || "Save failed");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${API.USERS}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted");
        fetchAll();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Authorities Management</h2>
          <p className="text-gray-400 mt-1 text-sm">{users.filter(u => u.role !== ROLES.CUSTOMER).length} staff members</p>
        </div>
        <button onClick={() => { setForm(empty); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-black px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {loading ? (
        <div className="h-64 bg-white/8 rounded-3xl animate-pulse" />
      ) : (
        <div className="space-y-8">

          {/* Authorities Section */}
          <div className="rounded-3xl overflow-hidden " style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }} >
            <div className="p-6 border-b border-white/8 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Authorities (Managers & Admins)</h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{users.filter(u => u.role !== ROLES.CUSTOMER).length} Staff</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background border-b border-white/8">
                    {["Name", "Email", "Role", "Assigned Branch", "Joined", "Actions"].map(h => (
                      <th key={h} className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.filter(u => u.role !== ROLES.CUSTOMER).map(u => (
                    <tr key={u._id} className="hover:bg-white/3 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-100 text-sm">{u.name}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                          ${u.role === ROLES.SUPER_ADMIN ? "bg-purple-400/10 text-purple-400" :
                            u.role === ROLES.BRANCH_MANAGER ? "bg-blue-400/10 text-blue-400" : "bg-white/5 text-white/60"}`}>
                          {u.role === ROLES.SUPER_ADMIN && <ShieldAlert className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {u.role === ROLES.BRANCH_MANAGER ? (
                          <span className="flex items-center gap-1"><Store className="w-3.5 h-3.5" /> {(u.branchId as any)?.name || "—"}</span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setForm({
                              _id: u._id,
                              name: u.name,
                              email: u.email,
                              password: "",
                              role: u.role,
                              branchId: (u.branchId as any)?._id || "",
                            });
                            setShowModal(true);
                          }} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(u._id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden " style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} >
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h3 className="text-xl font-black text-white">{form._id ? "Edit Authority" : "Add New Authority"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name *</label>
                <input className={inputCls} value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address *</label>
                <input type="email" className={inputCls} value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password {form._id ? "(Leave blank to keep current)" : "*"}</label>
                <input type="password" placeholder={form._id ? "Leave blank to keep unchanged" : "Min 6 characters"} className={inputCls} value={form.password} onChange={e => setForm((p: any) => ({ ...p, password: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                <select className={inputCls} value={form.role} onChange={e => setForm((p: any) => ({ ...p, role: e.target.value }))}>
                  {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {form.role === ROLES.BRANCH_MANAGER && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 mt-4">Assign Branch *</label>
                  <select className={inputCls} value={form.branchId} onChange={e => setForm((p: any) => ({ ...p, branchId: e.target.value }))}>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </motion.div>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-0 border-t border-white/5 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl font-semibold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : form._id ? "Update User" : "Create User"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
