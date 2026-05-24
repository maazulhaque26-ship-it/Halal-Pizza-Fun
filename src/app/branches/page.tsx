"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Clock, MapPin, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { BranchMapBranch } from "@/components/maps/types";
import { API } from "@/config/constants";

const BranchMap = dynamic(() => import("@/components/maps/BranchMap"), {
  ssr: false,
  loading: () => <div className="h-[520px] animate-pulse rounded-3xl bg-white/10" />,
});

const DeliveryRadiusMap = dynamic(() => import("@/components/maps/DeliveryRadiusMap"), {
  ssr: false,
  loading: () => <div className="h-[455px] animate-pulse rounded-3xl bg-white/10" />,
});

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchMapBranch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(API.BRANCHES);
        const data = await response.json();
        if (data.success) setBranches(data.data);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  return (
    <main className="min-h-screen bg-background pt-24">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 max-w-3xl">
          <h1 className="mb-3 text-4xl font-extrabold text-white">Our Branches</h1>
          <p className="text-white/50">
            Explore every active restaurant branch and its delivery coverage powered by OpenStreetMap.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <BranchMap branches={branches} height="520px" zoom={11} />
          <div className="glass-card rounded-3xl border border-white/10 p-5">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-primary">Delivery coverage</p>
            <DeliveryRadiusMap branches={branches} height="455px" zoom={10} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <div
                key={branch._id}
                className="glass-card rounded-2xl border border-white/10 p-6 transition-colors hover:border-primary/50"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="mb-2 text-xl font-bold text-white">{branch.name}</h3>
                    <p className="flex gap-2 text-sm text-white/50">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {[branch.address?.street, branch.address?.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-black text-primary">
                    {branch.deliveryRadiusKm} km
                  </span>
                </div>

                <div className="space-y-2 text-sm text-white/50">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    {branch.contactNumber || "Contact not available"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {branch.operatingHours?.open || "09:00"} - {branch.operatingHours?.close || "22:00"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
