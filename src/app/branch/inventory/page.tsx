"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Package, Leaf, Plus, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { API } from "@/config/constants";

interface Product {
  _id: string; name: string; isAvailable: boolean; isVegetarian: boolean;
  price: number; image: string;
}

export default function BranchInventoryPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      // For a real app, availability might be branch-specific (in a separate collection or array).
      // Here we assume global product availability for simplicity, or we let the manager toggle global status.
      const res = await fetch(`${API.PRODUCTS}?all=true`);
      const d = await res.json();
      if (d.success) setProducts(d.data);
    } catch { toast.error("Failed to load inventory"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInventory(); }, []);

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch(API.PRODUCTS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAvailable: !currentStatus }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(currentStatus ? "Marked as Sold Out" : "Marked as Available");
        fetchInventory();
      } else toast.error(d.message);
    } catch { toast.error("Update failed"); }
    finally { setUpdating(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Inventory Management</h2>
          <p className="text-white/40 mt-1">Mark items out of stock</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-background/8 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <motion.div key={p._id} layout className={`bg-background rounded-2xl border p-4 flex items-center gap-4 shadow-sm transition-all ${p.isAvailable ? "border-white/8" : "border-red-400/20 bg-red-400/5"}`}>
              <img src={p.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200"} alt={p.name} className={`w-14 h-14 rounded-xl object-cover shrink-0 ${!p.isAvailable && "grayscale opacity-50"}`} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate flex items-center gap-1">
                  {p.name}
                  {p.isVegetarian && <Leaf className="w-3 h-3 text-green-500 shrink-0" />}
                </p>
                <p className="text-xs text-white/40">₹{p.price}</p>
              </div>
              <button onClick={() => toggleAvailability(p._id, p.isAvailable)} disabled={updating === p._id}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all disabled:opacity-50 ${p.isAvailable ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
                {updating === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : p.isAvailable ? "Sold Out" : "Enable"}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
