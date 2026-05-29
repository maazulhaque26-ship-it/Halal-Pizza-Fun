"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Store, ArrowRight, Route, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBranchStore } from "@/store/useBranchStore";
import { ROUTES } from "@/config/constants";

interface Branch {
  _id: string;
  name: string;
  slug?: string;
  logo?: string;
  address: { street: string; city: string; state: string; zip: string };
  contactNumber: string;
  whatsappNumber?: string;
  operatingHours: { open: string; close: string };
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
    _id: "1",
    name: "HPF Downtown",
    address: { street: "128 Gourmet Boulevard", city: "New Delhi", state: "DL", zip: "110001" },
    contactNumber: "+91 8800155198",
    operatingHours: { open: "10:00", close: "23:00" },
    isAcceptingOrders: true,
    deliveryRadiusKm: 12,
  },
  {
    _id: "2",
    name: "HPF Uptown Express",
    address: { street: "456 Sector 14", city: "Gurugram", state: "HR", zip: "122001" },
    contactNumber: "+91 8800155198",
    operatingHours: { open: "10:00", close: "22:00" },
    isAcceptingOrders: true,
    deliveryRadiusKm: 8,
  },
  {
    _id: "3",
    name: "HPF Metro West",
    address: { street: "789 MG Road", city: "Noida", state: "UP", zip: "201301" },
    contactNumber: "+91 8800155198",
    operatingHours: { open: "09:00", close: "23:00" },
    isAcceptingOrders: false,
    deliveryRadiusKm: 15,
  },
];

export default function BranchSection({ branches }: BranchSectionProps) {
  const router = useRouter();
  const { setSelectedBranch, setSelectedCity, setSelectedArea } = useBranchStore();
  const displayBranches = branches && branches.length > 0 ? branches : FALLBACK_BRANCHES;

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch({
      _id: branch._id,
      name: branch.name,
      slug: branch.slug || branch.name.toLowerCase().replace(/ /g, "-"),
      logo: branch.logo,
      contactNumber: branch.contactNumber,
      whatsappNumber: branch.whatsappNumber,
      deliveryCharge: branch.deliveryCharge,
      estimatedDeliveryTime: branch.estimatedDeliveryTime,
      address: branch.address,
      operatingHours: branch.operatingHours,
    });
    setSelectedCity(branch.address.city);
    setSelectedArea(null);
    router.push(ROUTES.MENU);
  };

  return (
    <section className="relative overflow-hidden bg-[#0f1117] px-4 py-18 sm:px-6 md:py-24">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f1117_0%,#1d120d_100%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c35b]/20 bg-[#f5c35b]/8 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f5c35b]">
              <Store className="h-3.5 w-3.5" />
              Local kitchens
            </span>
            <h2 className="mt-5 font-playfair text-4xl font-black leading-tight text-[#fff8ee] sm:text-5xl">
              Pick the kitchen closest to tonight.
            </h2>
          </div>
          <p className="max-w-2xl text-sm font-medium leading-7 text-[#f8ead7]/62 sm:text-base">
            Every branch has its own rhythm, prep window, and delivery radius. Choose the kitchen that gets dinner to you warmest.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.08fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[#fff8ee] p-7 shadow-[0_28px_80px_rgba(0,0,0,0.28)]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: 'url("/hero-bg.png")' }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_20%,rgba(0,0,0,0.78)_100%)]" />
            <div className="relative flex h-full min-h-[366px] flex-col justify-end">
              <div className="max-w-lg">
                <span className="mb-4 inline-flex rounded-full bg-[#fff8ee] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#a7471b]">
                  From oven to doorstep
                </span>
                <h3 className="font-playfair text-4xl font-black leading-tight text-white">
                  Branch selection is part of the freshness story.
                </h3>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/14 p-4 backdrop-blur-md">
                    <Route className="mb-3 h-5 w-5 text-[#ffb44a]" />
                    <p className="text-xl font-black text-white">{displayBranches.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/58">Active branches</p>
                  </div>
                  <div className="rounded-2xl bg-white/14 p-4 backdrop-blur-md">
                    <Clock className="mb-3 h-5 w-5 text-[#ffb44a]" />
                    <p className="text-xl font-black text-white">Fresh</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/58">Live prep windows</p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-white/14 p-4 backdrop-blur-md sm:col-span-1">
                    <MapPin className="mb-3 h-5 w-5 text-[#ffb44a]" />
                    <p className="text-xl font-black text-white">Local</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/58">City aware</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4">
            {displayBranches.map((branch, index) => (
              <motion.div
                key={branch._id}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.07 }}
                className="group rounded-[26px] border border-white/10 bg-[#fff8ee] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-[#ffb44a]/45"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2b160c] text-[#ffb44a]">
                        <Store className="h-5 w-5" />
                      </span>
                      {branch.isAcceptingOrders ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1f8f5f]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#16724f]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Open now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#b22924]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#b22924]">
                          <XCircle className="h-3.5 w-3.5" /> Closed
                        </span>
                      )}
                    </div>
                    <h3 className="font-playfair text-2xl font-black leading-tight text-[#2b160c]">
                      {branch.name}
                    </h3>
                    <div className="mt-4 grid gap-2 text-sm font-semibold text-[#6d5342]">
                      <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ef5a24]" />
                        {branch.address.street}, {branch.address.city}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-[#ef5a24]" />
                        {branch.operatingHours.open} - {branch.operatingHours.close}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-[#ef5a24]" />
                        {branch.contactNumber}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-[#fff0dd] px-4 py-3 text-center">
                    <p className="text-xl font-black text-[#2b160c]">{branch.deliveryRadiusKm}km</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#a7471b]">Radius</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectBranch(branch)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ef5a24] px-5 py-3.5 text-xs font-black uppercase tracking-[0.13em] text-white shadow-[0_6px_0_#9b3214] transition hover:translate-y-[2px] hover:bg-[#dc4818] hover:shadow-[0_3px_0_#9b3214]"
                >
                  Order from this Branch
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
