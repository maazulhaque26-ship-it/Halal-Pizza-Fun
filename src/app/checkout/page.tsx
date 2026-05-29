"use client";

import { useCartStore } from "@/store/useCartStore";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingBag, MapPin, Trash2, Plus, Minus, Tag, ArrowRight,
  Lock, CreditCard, CheckCircle2, RotateCcw, Loader2, Navigation, Banknote, Store
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { toast } from "@/components/ui/Toast";
import { APP_CONFIG, ROUTES, API } from "@/config/constants";

import { useBranchStore } from "@/store/useBranchStore";

interface DeliveryEstimate {
  withinRange: boolean;
  branchId?: string;
  branchName?: string;
  distanceKm?: number;
  deliveryFee?: number;
  freeDeliveryAbove?: number;
  taxPercentage?: number;
}

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, clearCart, getSubTotal } = useCartStore();
  const { selectedBranch: initialBranch } = useBranchStore();
  const { data: session } = useSession();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Delivery address text fields — Indian manual input
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: "",
    phone: "",
    alternatePhone: "",
    houseNumber: "",
    floor: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    deliveryInstructions: "",
  });
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Server-side estimate (the only source of truth for fee)
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [isCodEnabled, setIsCodEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");

  // Whether the details and branch are "confirmed"
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  // Cart validation ref
  const hasValidatedRef = useRef(false);

  const subTotal = getSubTotal();
  const taxPct = estimate?.taxPercentage ?? 8.5;
  const freeAbove = estimate?.freeDeliveryAbove ?? 500;
  const deliveryFee = estimate
    ? (subTotal - couponDiscount >= freeAbove ? 0 : (estimate.deliveryFee ?? 0))
    : 0;
  const taxableAmount = Math.max(subTotal - couponDiscount, 0);
  const taxAmount = (taxableAmount * taxPct) / 100;
  const total = taxableAmount + deliveryFee + taxAmount;

  // ── Fetch delivery estimate from server for manual branch ─────────────────
  const fetchEstimate = useCallback(async (branchId: string) => {
    setEstimateLoading(true);
    try {
      const res = await fetch(`${API.DELIVERY_ESTIMATE}?branchId=${branchId}`);
      const data = await res.json();
      if (data.success) {
        setEstimate(data);
      } else {
        toast.error(data.message || "Failed to load delivery estimate");
      }
    } catch {
      toast.error("Could not calculate delivery fee. Please try again.");
    } finally {
      setEstimateLoading(false);
    }
  }, []);

  // ── Fetch branches and settings ────────────────────────────────────────────────
  useEffect(() => {
    fetch(API.BRANCHES)
      .then((r) => r.json())
      .then((d) => { 
        if (d.success) {
          const activeBranches = d.data.filter((b: any) => b.isActive !== false && b.isDeleted !== true);
          setBranches(activeBranches); 
        }
      })
      .catch(() => {});
      
    fetch(API.SETTINGS)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setIsCodEnabled(d.data?.payment?.codEnabled ?? true);
        }
      })
      .catch(() => {});
  }, []);

  // ── Pre-fill branch if already selected in the store ──────────────────────
  useEffect(() => {
    if (initialBranch?._id) {
      setSelectedBranchId(initialBranch._id);
      fetchEstimate(initialBranch._id);
    }
  }, [initialBranch]);

  // ── Pre-fill user profile info if logged in ────────────────────────────────
  useEffect(() => {
    if (session?.user) {
      setDeliveryAddress((p) => ({
        ...p,
        fullName: session.user.name || "",
        phone: (session.user as any).phone || "",
      }));
    }
  }, [session]);

  // ── Validate stale cart items ─────────────────────────────────────────────
  useEffect(() => {
    if (hasValidatedRef.current || items.length === 0) return;
    hasValidatedRef.current = true;
    fetch(API.PRODUCTS)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const ids = new Set(d.data.map((p: any) => p._id.toString()));
          const stale = items.filter((i) => !ids.has(i.productId));
          if (stale.length > 0) {
            stale.forEach((i) => removeItem(i.productId));
            toast.error(`Removed unavailable items: ${stale.map((i) => i.name).join(", ")}`);
          }
        }
      })
      .catch(() => {});
  }, [items, removeItem]);

  // ── Handle branch selection change ────────────────────────────────────────
  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    fetchEstimate(branchId);
  };

  // ── Confirm Address & Branch ──────────────────────────────────────────────
  const confirmLocation = () => {
    if (!selectedBranchId) {
      toast.error("Please select a nearest HPF branch to deliver your order.");
      return;
    }
    if (
      !deliveryAddress.fullName.trim() ||
      !deliveryAddress.phone.trim() ||
      !deliveryAddress.houseNumber.trim() ||
      !deliveryAddress.street.trim() ||
      !deliveryAddress.city.trim() ||
      !deliveryAddress.state.trim() ||
      !deliveryAddress.pincode.trim()
    ) {
      toast.error("Please fill in all mandatory address fields.");
      return;
    }
    setLocationConfirmed(true);
    toast.success(`📍 Address & branch confirmed for delivery!`);
  };

  // ── Reset Address/Branch selection ─────────────────────────────────────────
  const resetLocation = () => {
    setLocationConfirmed(false);
    setSelectedBranchId("");
    setEstimate(null);
  };

  // ── Coupon ────────────────────────────────────────────────────────────────
  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode.toUpperCase()}&orderValue=${subTotal}`);
      const data = await res.json();
      if (data.success) {
        setCouponDiscount(data.discount);
        toast.success(`Coupon applied! You saved ₹${data.discount.toFixed(2)}`);
      } else {
        toast.error(data.message || "Invalid coupon");
      }
    } catch {
      toast.error("Could not validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // ── Payment ───────────────────────────────────────────────────────────────
  const handlePayment = async () => {
    if (!locationConfirmed || !selectedBranchId) {
      toast.error("Please confirm your delivery address and select a branch.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    // Bypass Razorpay check if COD
    if (paymentMethod === "ONLINE" && !isRazorpayReady) {
      if (typeof (window as any).Razorpay !== "undefined") {
        setIsRazorpayReady(true);
      } else {
        toast.error("Payment gateway still loading. Please wait.");
        return;
      }
    }

    setPaymentLoading(true);
    try {
      const orderRes = await fetch(API.PAYMENTS_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            ...(i.variantId ? { variantId: i.variantId } : {}),
            quantity: i.quantity,
            selectedAddons: i.selectedAddons.map((a) => ({ name: a.name })),
          })),
          deliveryAddress,
          branchId: selectedBranchId,
          specialInstructions,
          couponCode: couponDiscount > 0 ? couponCode : undefined,
          paymentMethod,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.message);

      if (paymentMethod === "COD") {
        clearCart();
        toast.success("Order placed successfully!");
        router.push(`/orders/${orderData.order._id}`);
        return;
      }

      // ── ONLINE PAYMENT FLOW (Razorpay) ──
      const razorKey = APP_CONFIG.RAZORPAY_KEY;
      if (!razorKey || !orderData.order) throw new Error("Razorpay checkout is not configured");

      const Razorpay = (window as any).Razorpay;
      if (typeof Razorpay !== "function") throw new Error("Razorpay checkout is not available");

      const rzp = new Razorpay({
        key: razorKey,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: APP_CONFIG.NAME,
        description: "Food Order",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch(API.PAYMENTS_VERIFY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            clearCart();
            toast.success("Order placed successfully!");
            router.push(`/orders/${verifyData.order._id}`);
          } else {
            toast.error(verifyData.message || "Payment verification failed");
          }
        },
        prefill: { name: session?.user.name || "", email: session?.user.email || "" },
        theme: { color: "#D4AF37" },
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fff4e4] text-[#2b160c]">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <ShoppingBag className="w-24 h-24 text-[#8f6b52]/30" />
          <h2 className="font-playfair text-3xl font-black text-[#2b160c]">Your cart is empty</h2>
          <p className="text-[#8f6b52]">Add some delicious food to your cart!</p>
          <Link href={ROUTES.MENU} className="bg-[#ef5a24] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#dc4818] transition-colors">
            Explore Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4e4] text-[#2b160c]">
      <Navbar />
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsRazorpayReady(true)}
        onError={() => toast.error("Unable to load payment gateway")}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-24">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-playfair text-3xl font-black text-[#2b160c] mb-10"
        >
          Checkout
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cart Items */}
            <div className="rounded-3xl p-6 rounded-[28px] border border-[#ead8c1] bg-[#fffaf2] shadow-[0_18px_46px_rgba(73,40,18,0.08)]">
<h2 className="text-lg font-black text-[#2b160c] mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#ef5a24]" /> Your Order ({items.length} items)
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.variantId ? `${item.productId}:${item.variantId}` : item.productId} className="flex gap-3 items-start">
                    <img src={item.image} alt={item.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-[#2b160c] text-sm line-clamp-2 leading-tight">{item.name}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-red-400 hover:text-red-500 p-2 shrink-0 -mt-1 -mr-1 rounded-xl transition-colors"
                          style={{ touchAction: "manipulation" }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#8f6b52] mt-0.5">₹{item.price} each</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          {/* Minus — full 44px touch target */}
                          <button
                            type="button"
                            onClick={() =>
                              item.quantity > 1
                                ? updateQuantity(item.productId, item.quantity - 1, item.variantId)
                                : removeItem(item.productId, item.variantId)
                            }
                            className="w-11 h-11 rounded-full bg-[#ead8c1]/30 hover:bg-[#ead8c1]/40 active:bg-[#ead8c1]/50 flex items-center justify-center transition-colors"
                            style={{ touchAction: "manipulation" }}
                          >
                            <Minus className="w-3.5 h-3.5 text-[#2b160c]/80" />
                          </button>
                          <span className="w-7 text-center font-black text-[#2b160c] text-sm tabular-nums">{item.quantity}</span>
                          {/* Plus — full 44px touch target */}
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                            className="w-11 h-11 rounded-full bg-[#ef5a24]/20 hover:bg-[#ef5a24]/30 active:bg-[#ef5a24]/40 flex items-center justify-center transition-colors"
                            style={{ touchAction: "manipulation" }}
                          >
                            <Plus className="w-3.5 h-3.5 text-[#ef5a24]" />
                          </button>
                        </div>
                        <p className="font-black text-[#2b160c] text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Location & Address (Manual Branch Selection) */}
            <div className="rounded-3xl p-6 rounded-[28px] border border-[#ead8c1] bg-[#fffaf2] shadow-[0_18px_46px_rgba(73,40,18,0.08)]">
<div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-[#2b160c] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#ef5a24]" /> Delivery Details
                </h2>
                {locationConfirmed && (
                  <button
                    onClick={resetLocation}
                    className="flex items-center gap-1.5 text-sm text-[#8f6b52] hover:text-red-500 transition-colors font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Edit details
                  </button>
                )}
              </div>

              {locationConfirmed && estimate?.withinRange ? (
                /* ── Locked state ── */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border border-emerald-500/25 bg-emerald-500/8 rounded-2xl px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-black text-emerald-300">Delivery Address Confirmed</p>
                      <p className="text-xs text-emerald-400">
                        Assigned Branch: {estimate.branchName} · Delivery fee: ₹{deliveryFee.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#fff4e4] text-[#2b160c] rounded-2xl p-4 space-y-2 border border-[#ead8c1] text-sm">
                    <p className="text-[#2b160c]"><strong className="text-[#8f6b52]">Deliver To:</strong> {deliveryAddress.fullName} · {deliveryAddress.phone} {deliveryAddress.alternatePhone && `(Alt: ${deliveryAddress.alternatePhone})`}</p>
                    <p className="text-[#2b160c]">
                      <strong className="text-[#8f6b52]">Address:</strong> {deliveryAddress.houseNumber}
                      {deliveryAddress.floor && `, Floor ${deliveryAddress.floor}`}
                      , {deliveryAddress.street}
                    </p>
                    {deliveryAddress.landmark && (
                      <p className="text-[#2b160c]"><strong className="text-[#8f6b52]">Landmark:</strong> {deliveryAddress.landmark}</p>
                    )}
                    <p className="text-[#2b160c]"><strong className="text-[#8f6b52]">City & State:</strong> {deliveryAddress.city}, {deliveryAddress.state} - <span className="font-bold">{deliveryAddress.pincode}</span></p>
                    {specialInstructions && (
                      <p className="text-[#2b160c]"><strong className="text-[#8f6b52]">Instructions:</strong> {specialInstructions}</p>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Address Inputs & Branch selection state ── */
                <div className="space-y-6">
                  <p className="text-sm text-[#8f6b52]">
                    Fill in your manual delivery address and select the nearest HPF branch to complete your order.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">Recipient Name</label>
                      <input
                        type="text"
                        placeholder="Recipient full name"
                        value={deliveryAddress.fullName}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, fullName: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">Primary Phone Number</label>
                      <input
                        type="text"
                        placeholder="10-digit mobile number"
                        value={deliveryAddress.phone}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">Alternate Phone (optional)</label>
                      <input
                        type="text"
                        placeholder="Alternate mobile number"
                        value={deliveryAddress.alternatePhone}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, alternatePhone: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">Flat / House / Shop No.</label>
                      <input
                        type="text"
                        placeholder="e.g., Flat 402, Golden Crest Apartments"
                        value={deliveryAddress.houseNumber}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, houseNumber: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">Floor / Block (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., 4th Floor, B-Wing"
                        value={deliveryAddress.floor}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, floor: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">Street Name / Area / Colony</label>
                      <input
                        type="text"
                        placeholder="e.g., Carter Road, Bandra West"
                        value={deliveryAddress.street}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, street: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">Landmark (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., Near HDFC Bank ATM"
                        value={deliveryAddress.landmark}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, landmark: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">City</label>
                      <input
                        type="text"
                        placeholder="e.g., Mumbai"
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, city: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">State</label>
                      <input
                        type="text"
                        placeholder="e.g., Maharashtra"
                        value={deliveryAddress.state}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, state: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-2">Pincode</label>
                      <input
                        type="text"
                        placeholder="e.g., 400001"
                        value={deliveryAddress.pincode}
                        onChange={(e) => setDeliveryAddress((p) => ({ ...p, pincode: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] text-sm transition-all placeholder:text-[#8f6b52]/60"
                      />
                    </div>
                  </div>

                  {/* Branch Selection List */}
                  <div>
                    <label className="block text-xs font-black text-[#8f6b52] uppercase tracking-widest mb-3">Select Nearest Branch</label>
                    {branches.length === 0 ? (
                      <div className="text-sm text-[#8f6b52]/80 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl p-4 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#ef5a24]" /> Loading branches...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {branches.map((branch) => {
                          const isSelected = selectedBranchId === branch._id;
                          return (
                            <button
                              type="button"
                              key={branch._id}
                              onClick={() => handleBranchSelect(branch._id)}
                              className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all ${
                                isSelected 
                                  ? "border-[#ef5a24] bg-[#fff0dd] ring-1 ring-[#ef5a24]" 
                                  : "border-[#ead8c1] hover:border-[#ead8c1]"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Store className={`w-4 h-4 ${isSelected ? "text-[#ef5a24]" : "text-[#8f6b52]/80"}`} />
                                <span className="font-bold text-[#2b160c] text-sm">{branch.name}</span>
                              </div>
                              <p className="text-xs text-[#8f6b52] line-clamp-2">
                                {branch.address?.street}, {branch.address?.city}, {branch.address?.state} {branch.address?.zip}
                              </p>
                              {typeof branch.deliveryCharge === "number" && (
                                <p className="text-[10px] bg-[#ead8c1]/30 px-2 py-0.5 rounded-full font-bold text-[#8f6b52] mt-2">
                                  Delivery: ₹{branch.deliveryCharge}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Estimate result */}
                  {estimateLoading && (
                    <div className="flex items-center gap-2 text-sm text-[#8f6b52] bg-[#fff4e4] text-[#2b160c] rounded-xl px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-[#ef5a24]" />
                      Calculating delivery estimate…
                    </div>
                  )}

                  {!estimateLoading && estimate?.withinRange && (
                    <div className="border border-emerald-500/25 bg-emerald-500/8 rounded-xl px-4 py-3 text-sm text-emerald-400 font-semibold flex items-center justify-between">
                      <span>✓ Delivery from <strong>{estimate.branchName}</strong></span>
                      <span className="font-black">₹{estimate.deliveryFee?.toFixed(2)}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-[#8f6b52] mb-1">Special Instructions (optional)</label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={2}
                      placeholder="e.g., Ring the bell, Leave at door..."
                      className="w-full px-4 py-3 bg-[#fff4e4] text-[#2b160c] border border-[#ead8c1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ef5a24]/20 focus:border-[#ef5a24]/40 text-[#2b160c] resize-none text-sm transition-all placeholder:text-[#8f6b52]/60"
                    />
                  </div>

                  {selectedBranchId && deliveryAddress.fullName.trim() && deliveryAddress.phone.trim() && deliveryAddress.houseNumber.trim() && deliveryAddress.street.trim() && deliveryAddress.city.trim() && deliveryAddress.state.trim() && deliveryAddress.pincode.trim() && (
                    <button
                      onClick={confirmLocation}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-[#2b160c] py-3.5 rounded-2xl font-black transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                      Confirm Address & Branch
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="rounded-3xl p-6 rounded-[28px] border border-[#ead8c1] bg-[#fffaf2] shadow-[0_18px_46px_rgba(73,40,18,0.08)]">
<h2 className="text-lg font-black text-[#2b160c] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#ef5a24]" /> Payment Method
              </h2>
              
              <div className="space-y-3">
                {/* Online Payment */}
                <button
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 transition-all ${
                    paymentMethod === "ONLINE" ? "border-[#ef5a24] bg-[#fff0dd]" : "border-[#ead8c1] hover:border-[#ef5a24]/30"
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mt-0.5 ${paymentMethod === "ONLINE" ? "text-[#ef5a24]" : "text-[#8f6b52]/80"}`} />
                  <div className="text-left">
                    <p className={`font-bold ${paymentMethod === "ONLINE" ? "text-[#2b160c]" : "text-[#8f6b52]"}`}>
                      Pay Online (Razorpay)
                    </p>
                    <p className="text-sm text-[#8f6b52] mt-0.5">Credit, Debit, UPI, Netbanking.</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${paymentMethod === "ONLINE" ? "border-[#ef5a24]" : "border-[#ead8c1]"}`}>
                    {paymentMethod === "ONLINE" && <div className="w-2.5 h-2.5 rounded-full bg-[#ef5a24]" />}
                  </div>
                </button>

                {/* Cash on Delivery (only if enabled in settings) */}
                {isCodEnabled && (
                  <button
                    onClick={() => setPaymentMethod("COD")}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === "COD" ? "border-[#ef5a24] bg-[#fff0dd]" : "border-[#ead8c1] hover:border-[#ef5a24]/30"
                    }`}
                  >
                    <Banknote className={`w-5 h-5 mt-0.5 ${paymentMethod === "COD" ? "text-[#ef5a24]" : "text-[#8f6b52]/80"}`} />
                    <div className="text-left">
                      <p className={`font-bold ${paymentMethod === "COD" ? "text-[#2b160c]" : "text-[#8f6b52]"}`}>
                        Cash on Delivery
                      </p>
                      <p className="text-sm text-[#8f6b52] mt-0.5">Pay with cash when your food arrives.</p>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${paymentMethod === "COD" ? "border-[#ef5a24]" : "border-[#ead8c1]"}`}>
                      {paymentMethod === "COD" && <div className="w-2.5 h-2.5 rounded-full bg-[#ef5a24]" />}
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column: Order Summary ──────────────────────────────── */}
          <div>
            <div className="rounded-3xl p-6 sticky top-28 rounded-[28px] border border-[#ead8c1] bg-[#fffaf2] shadow-[0_18px_46px_rgba(73,40,18,0.08)]">
              <h2 className="text-lg font-black text-[#2b160c] mb-6">Order Summary</h2>

              {/* Coupon */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8f6b52]/80" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none text-[#2b160c] uppercase font-bold tracking-widest placeholder:text-[#8f6b52]/60 bg-white border border-[#ead8c1] focus:border-[#ef5a24]/40"  
                  />
                </div>
                <button
                  onClick={handleCoupon}
                  disabled={couponLoading}
                  className="px-4 py-3 bg-[#ef5a24] text-white rounded-xl font-bold text-sm hover:bg-[#dc4818] transition-colors disabled:opacity-60"
                >
                  Apply
                </button>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-[#8f6b52]">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subTotal.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon Discount</span>
                    <span className="font-bold">-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#8f6b52]">
                  <span className="flex items-center gap-1">
                    Delivery Fee
                  </span>
                  <span className="font-semibold">
                    {estimateLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ef5a24] inline" />
                    ) : !estimate ? (
                      <span className="text-[#8f6b52]/80 text-xs">Select branch</span>
                    ) : deliveryFee === 0 ? (
                      <span className="text-emerald-400 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[#8f6b52]">
                  <span>Tax ({taxPct}%)</span>
                  <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#ead8c1] pt-3 flex justify-between font-black text-[#2b160c] text-lg">
                  <span>Total</span>
                  <span className="text-[#ef5a24]">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Free delivery progress */}
              {estimate?.withinRange && deliveryFee > 0 && (
                <p className="text-xs text-[#8f6b52]/80 bg-[#fff0dd] rounded-xl p-3 mb-4 text-center">
                  Add <span className="font-bold text-[#ef5a24]">₹{Math.max(freeAbove - (subTotal - couponDiscount), 0).toFixed(2)}</span> more for free delivery!
                </p>
              )}

              <button
                onClick={handlePayment}
                disabled={paymentLoading || !locationConfirmed}
                className="w-full flex items-center justify-center gap-3 bg-[#ef5a24] hover:bg-[#dc4818] text-white py-4 rounded-2xl font-black text-base transition-all shadow-lg shadow-[#ef5a24]/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : !locationConfirmed ? (
                  <><Lock className="w-5 h-5" /> Confirm Delivery Address First</>
                ) : (
                  <>{paymentMethod === "ONLINE" ? <Lock className="w-5 h-5" /> : <Banknote className="w-5 h-5" />} {paymentMethod === "ONLINE" ? "Pay" : "Place Order"} ₹{total.toFixed(2)} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {paymentMethod === "ONLINE" && (
                <p className="text-xs text-[#8f6b52]/80 text-center mt-3 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Secured by Razorpay
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
