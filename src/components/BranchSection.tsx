"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Store, ArrowRight, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBranchStore } from "@/store/useBranchStore";
import { ROUTES } from "@/config/constants";

interface Branch {
  _id: string;
  name: string;
  slug?: string;
  logo?: string;
  address: { street: string; city: string; state: string; zip: string; };
  contactNumber: string;
  whatsappNumber?: string;
  operatingHours: { open: string; close: string; };
  isAcceptingOrders: boolean;
  deliveryRadiusKm: number;
  deliveryCharge?: number;
  estimatedDeliveryTime?: string;
}

interface BranchSectionProps {
  branches?: Branch[];
}

const FALLBACK_BRANCHES: Branch[] = [
  {
    _id: "1", name: "HPF Downtown",
    address: { street: "128 Gourmet Boulevard", city: "New Delhi", state: "DL", zip: "110001" },
    contactNumber: "+91 8800155198", operatingHours: { open: "10:00", close: "23:00" },
    isAcceptingOrders: true, deliveryRadiusKm: 12,
  },
  {
    _id: "2", name: "HPF Uptown Express",
    address: { street: "456 Sector 14", city: "Gurugram", state: "HR", zip: "122001" },
    contactNumber: "+91 8800155198", operatingHours: { open: "10:00", close: "22:00" },
    isAcceptingOrders: true, deliveryRadiusKm: 8,
  },
  {
    _id: "3", name: "HPF Metro West",
    address: { street: "789 MG Road", city: "Noida", state: "UP", zip: "201301" },
    contactNumber: "+91 8800155198", operatingHours: { open: "09:00", close: "23:00" },
    isAcceptingOrders: false, deliveryRadiusKm: 15,
  },
];

export default function BranchSection({ branches }: BranchSectionProps) {
  const router = useRouter();
  const { setSelectedBranch, setSelectedCity, setSelectedArea } = useBranchStore();
  const displayBranches = branches && branches.length > 0 ? branches : FALLBACK_BRANCHES;

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch({
      _id: branch._id, name: branch.name,
      slug: branch.slug || branch.name.toLowerCase().replace(/ /g, "-"),
      logo: branch.logo, contactNumber: branch.contactNumber,
      whatsappNumber: branch.whatsappNumber, deliveryCharge: branch.deliveryCharge,
      estimatedDeliveryTime: branch.estimatedDeliveryTime,
      address: branch.address, operatingHours: branch.operatingHours,
    });
    setSelectedCity(branch.address.city);
    setSelectedArea(null);
    router.push(ROUTES.MENU);
  };

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-[#070f20] via-background to-[#070f20]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(212,175,55,0.04),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-tag mb-4 inline-flex">
                <Store className="w-3 h-3" />
                Locate Us
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight"
            >
              Our Restaurant <em className="text-gradient not-italic">Branches</em>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white/45 text-base max-w-2xl"
            >
              Visit us for an exceptional dine-in experience or order directly from your nearest HPF kitchen.
            </motion.p>
          </div>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBranches.map((branch, index) => (
            <motion.div
              key={branch._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              className="group relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-500 card-hover"
              style={{
                background: "linear-gradient(145deg, rgba(13,24,41,0.9), rgba(10,18,35,0.95))",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.3)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 25px 50px rgba(0,0,0,0.4), 0 0 30px rgba(212,175,55,0.08)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}
            >
              {/* Subtle top glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />

              <div>
                {/* Card top row */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div
                    className="p-3.5 rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}
                  >
                    <Store className="w-6 h-6 text-primary" />
                  </div>

                  {branch.isAcceptingOrders ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}>
                      <CheckCircle2 className="w-3 h-3" /> Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                      <XCircle className="w-3 h-3" /> Closed
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-white mb-5 group-hover:text-primary transition-colors duration-300">
                  {branch.name}
                </h3>

                <div className="space-y-3 mb-7">
                  <div className="flex items-start gap-3 text-sm text-white/50">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{branch.address.street}, {branch.address.city}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span>{branch.operatingHours.open} – {branch.operatingHours.close}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span>{branch.contactNumber}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSelectBranch(branch)}
                className="w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 group-hover:shadow-lg"
                style={{
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  color: "#D4AF37",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #D4AF37, #C5A028)";
                  (e.currentTarget as HTMLElement).style.color = "#000";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(212,175,55,0.3)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.08)";
                  (e.currentTarget as HTMLElement).style.color = "#D4AF37";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                Order from this Branch
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
