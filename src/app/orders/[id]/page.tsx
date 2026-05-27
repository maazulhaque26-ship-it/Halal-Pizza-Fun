"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Clock, MapPin, Phone, ChefHat, Truck, Star, Package } from "lucide-react";
import { getSocket, connectSocket } from "@/lib/socket";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API, ORDER_STATUS } from "@/config/constants";

interface Order {
  _id: string; orderId: string; status: string; total: number; createdAt: string;
  items: { productId: { name: string; image: string }; quantity: number; price: number }[];
  branchId: { name: string; address: { street: string; city: string }; contactNumber: string };
  deliveryAddress: { street: string; city: string };
}

const STEPS = [
  { status: ORDER_STATUS.PENDING, label: "Order Placed", icon: Clock },
  { status: ORDER_STATUS.ACCEPTED, label: "Confirmed", icon: CheckCircle },
  { status: ORDER_STATUS.PREPARING, label: "Preparing", icon: ChefHat },
  { status: ORDER_STATUS.PACKED, label: "Packed", icon: Package },
  { status: ORDER_STATUS.OUT_FOR_DELIVERY, label: "Out for Delivery", icon: Truck },
  { status: ORDER_STATUS.DELIVERED, label: "Delivered", icon: Star },
];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const d = await res.json();
      if (d.success) setOrder(d.data);
    } catch { console.error("Failed to fetch order"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrder();
    // Slow safety-net polling (60s) in case the socket is disconnected;
    // primary live-update path is the socket subscription below.
    const interval = setInterval(fetchOrder, 60000);
    return () => clearInterval(interval);
  }, [id]);

  const { data: session } = useSession();

  // Real-time order status updates via the app-wide socket singleton.
  // Deps: [session?.user?.id, id] — stable values; no socket recreation on refetch.
  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = getSocket();
    const onStatusChange = (data: any) => {
      if (String(data.orderId) === String(id)) fetchOrder();
    };

    socket.on("ORDER_STATUS_CHANGED", onStatusChange);
    socket.on("ORDER_STATUS_UPDATED", onStatusChange);
    connectSocket(); // no-op if already connected

    return () => {
      socket.off("ORDER_STATUS_CHANGED", onStatusChange);
      socket.off("ORDER_STATUS_UPDATED", onStatusChange);
    };
  }, [session?.user?.id, id]);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center flex-col text-center px-6">
        <h1 className="text-3xl font-black text-white/90 mb-2">Order Not Found</h1>
        <p className="text-white/40">We couldn't find the order you're looking for.</p>
      </div>
    </div>
  );

  const currentStepIdx = STEPS.findIndex(s => s.status === order.status) !== -1
    ? STEPS.findIndex(s => s.status === order.status)
    : order.status === ORDER_STATUS.READY ? 2 : 0; // Fallback mapping

  const cancelledStatuses: string[] = [ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED];
  const isCancelled = cancelledStatuses.includes(order.status);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-32 pb-20">
        <div className=" rounded-3xl p-8 border border-white/8 shadow-sm mb-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2">Track Your Order</h1>
            <p className="text-white/40 font-medium">Order #{order.orderId}</p>
          </div>

          {/* Progress Bar */}
          {isCancelled ? (
            <div className="bg-red-400/8 border border-red-400/20 rounded-2xl p-6 text-center">
              <p className="text-xl font-black text-red-400 mb-1">Order Cancelled</p>
              <p className="text-sm text-red-400/70">Unfortunately, this order could not be fulfilled.</p>
            </div>
          ) : (
            <div className="relative mb-16 sm:mb-12 px-4 sm:px-0 mt-6 sm:mt-0">
              <div className="absolute top-1/2 left-4 right-4 sm:left-0 sm:right-0 h-1.5 /5 -translate-y-1/2 rounded-full" />
              <motion.div
                className="absolute top-1/2 left-4 sm:left-0 h-1.5 bg-primary -translate-y-1/2 rounded-full transition-all duration-1000"
                initial={{ width: 0 }}
                animate={{ width: `calc(${(currentStepIdx / (STEPS.length - 1)) * 100}% - 2rem)` }}
              />
              <div className="relative flex justify-between">
                {STEPS.map((step, i) => {
                  const isActive = i <= currentStepIdx;
                  const isCurrent = i === currentStepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.status} className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{ scale: isCurrent ? 1.2 : isActive ? 1.1 : 1, backgroundColor: isActive ? "#7c3aed" : "#f1f5f9" }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10 transition-colors shadow-sm ${isActive ? "text-white" : "text-white/50"}`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.div>
                      <span className={`text-[10px] sm:text-xs font-black mt-2 sm:mt-3 uppercase tracking-wider text-center absolute top-10 sm:top-12 w-16 sm:w-24 -ml-8 sm:-ml-12 transition-opacity ${isActive ? "text-primary" : "text-white/50"} ${isCurrent ? "opacity-100" : "opacity-0 sm:opacity-100"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className=" rounded-3xl p-6 border border-white/8 shadow-sm">
            <h3 className="text-lg font-black text-white mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl /5 overflow-hidden shrink-0">
                    {item.productId?.image && <img src={item.productId.image} alt="food" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white/90 text-sm">{item.productId?.name || "Item"}</p>
                    <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-black text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-white/8 pt-4 flex justify-between items-center font-black text-lg">
              <span>Total</span>
              <span className="text-primary">₹{order.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Location Info */}
          <div className="space-y-6">
            <div className=" rounded-3xl p-6 border border-white/8 shadow-sm">
              <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">Delivering From</h3>
              <p className="font-black text-white text-lg mb-1">{order.branchId?.name}</p>
              <p className="text-sm text-white/40 flex items-start gap-2 mb-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                {order.branchId?.address?.street}, {order.branchId?.address?.city}
              </p>
              <p className="text-sm text-white/40 flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                {order.branchId?.contactNumber}
              </p>
            </div>

            <div className=" rounded-3xl p-6 border border-white/8 shadow-sm">
              <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">Delivery To</h3>
              <p className="text-sm font-bold text-white/90 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
