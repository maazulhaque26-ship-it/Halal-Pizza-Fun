import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen pt-24 bg-black">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold text-white mb-4">Track Your Order</h1>
        <p className="text-gray-400 mb-8">Enter your order ID to see live updates</p>
        <div className="flex gap-2">
          <input type="text" placeholder="e.g. ORD-12345" className="flex-1 glass bg-transparent border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
          <button className="bg-primary text-black font-bold px-8 py-3 rounded-xl hover:bg-accent transition-colors">Track</button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
