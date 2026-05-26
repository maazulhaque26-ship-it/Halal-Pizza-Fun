"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MapPin, Navigation, CheckCircle, Package, AlertCircle, Phone, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { getSocket, connectSocket } from "@/lib/socket";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ROLES } from "@/config/constants";

// Mock delivery data for the dashboard
const MOCK_ASSIGNED_ORDERS = [
  {
    _id: "ORD-987654",
    restaurant: "HPF Manhattan (HQ)",
    restaurantAddress: "123 Luxury Ave, Food District, NY",
    customerName: "Jane Doe",
    customerAddress: "456 Riverside Drive, Apt 12B, NY",
    customerPhone: "+1 555-0198",
    status: "READY",
    earnings: 5.50,
    distance: "1.2 mi",
  }
];

export default function DeliveryDashboard() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState(MOCK_ASSIGNED_ORDERS);
  const [isOnline, setIsOnline] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(124.50);
  const [deliveriesToday, setDeliveriesToday] = useState(12);

  // Initialize Socket for real-time tracking via the app-wide singleton.
  // Never call io() directly — use getSocket()/connectSocket() so there is
  // exactly ONE connection regardless of how many components mount.
  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = getSocket();
    const onConnect = () => console.log("[Delivery] Connected to socket");

    socket.on("connect", onConnect);
    connectSocket(); // fetches JWT, sets socket.auth, then calls socket.connect()

    return () => {
      socket.off("connect", onConnect);
    };
  }, [session?.user?.id]);

  if (session?.user?.role && session.user.role !== ROLES.DELIVERY_STAFF && session.user.role !== ROLES.SUPER_ADMIN) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="glass-card p-8 rounded-3xl max-w-md w-full text-center border border-red-500/20 bg-red-500/5">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Unauthorized Access</h1>
          <p className="text-gray-400 mb-6">Your account is not authorized as a delivery partner.</p>
          <a href="/" className="bg-background/10 text-white px-6 py-3 rounded-xl font-bold w-full block hover:bg-background/20 transition-colors">Return Home</a>
        </div>
      </div>
    );
  }

  const updateStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    toast.success(`Order ${orderId} marked as ${newStatus.replace(/_/g, " ")}`);
    
    // If delivered, update earnings mock
    if (newStatus === "DELIVERED") {
      const order = orders.find(o => o._id === orderId);
      if (order) {
        setTotalEarnings(prev => prev + order.earnings);
        setDeliveriesToday(prev => prev + 1);
        setTimeout(() => {
          setOrders(prev => prev.filter(o => o._id !== orderId));
        }, 3000);
      }
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="glass-card p-8 rounded-3xl max-w-md w-full text-center border border-white/10">
          <Package className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Delivery Partner Portal</h1>
          <p className="text-gray-400 mb-6">Please log in to view your assigned deliveries and earnings.</p>
          <a href="/auth/login" className="bg-primary text-black px-6 py-3 rounded-xl font-bold w-full block hover:bg-accent transition-colors">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        
        {/* Header Stats */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-white">Partner Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {session.user.name}</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="glass-card flex-1 md:flex-none p-4 rounded-2xl border border-white/10">
              <p className="text-sm text-gray-400">Today's Earnings</p>
              <p className="text-2xl font-black text-primary">${totalEarnings.toFixed(2)}</p>
            </div>
            <div className="glass-card flex-1 md:flex-none p-4 rounded-2xl border border-white/10">
              <p className="text-sm text-gray-400">Deliveries</p>
              <p className="text-2xl font-black text-white">{deliveriesToday}</p>
            </div>
          </div>
        </div>

        {/* Status Toggle */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full animate-pulse ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
            <span className="font-bold text-white">{isOnline ? "You're Online & Accepting Orders" : "You're Offline"}</span>
          </div>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-colors ${isOnline ? "bg-background/10 text-white hover:bg-background/20" : "bg-primary text-black hover:bg-accent"}`}
          >
            Go {isOnline ? "Offline" : "Online"}
          </button>
        </div>

        {/* Active Orders */}
        <h2 className="text-xl font-black text-white mb-4">Assigned Deliveries ({orders.length})</h2>
        
        {orders.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-white/10 text-center">
            <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-gray-300">No active deliveries</h3>
            <p className="text-gray-500 mt-2">Waiting for new orders to be assigned...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <motion.div 
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  {/* Info */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-primary/20 text-primary font-bold text-xs rounded-full uppercase">
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-gray-400 font-mono text-sm">{order._id}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> Pickup</p>
                        <p className="font-bold text-white">{order.restaurant}</p>
                        <p className="text-sm text-gray-400 mt-1">{order.restaurantAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Dropoff</p>
                        <p className="font-bold text-white">{order.customerName}</p>
                        <p className="text-sm text-gray-400 mt-1">{order.customerAddress}</p>
                        <a href={`tel:${order.customerPhone}`} className="text-primary text-sm font-bold flex items-center gap-1 mt-2 hover:underline">
                          <Phone className="w-3 h-3" /> Call Customer
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full md:w-64 flex flex-col gap-3 justify-end border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Est. Earnings</span>
                      <span className="text-xl font-black text-primary">${order.earnings.toFixed(2)}</span>
                    </div>
                    
                    <a
                      href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(order.customerAddress)}`}
                      target="_blank" rel="noreferrer"
                      className="bg-background/5 border border-white/10 hover:bg-background/10 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Navigation className="w-4 h-4" /> Navigation
                    </a>

                    {order.status === "READY" && (
                      <button 
                        onClick={() => updateStatus(order._id, "OUT_FOR_DELIVERY")}
                        className="bg-primary text-black py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors"
                      >
                        Confirm Pickup <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    
                    {order.status === "OUT_FOR_DELIVERY" && (
                      <button 
                        onClick={() => updateStatus(order._id, "DELIVERED")}
                        className="bg-green-500 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-400 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
