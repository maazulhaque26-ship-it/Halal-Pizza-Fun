"use client";

import { motion } from "framer-motion";
import { Smartphone, Download } from "lucide-react";

export default function AppSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Get the <span className="text-primary">HPF</span> App
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              We will send you a link, open it on your phone to download the app. 
              Get access to exclusive deals and real-time order tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <div className="flex items-center gap-4 border border-border rounded-xl px-4 py-3 bg-muted/30 flex-1">
                <input type="radio" name="contact" id="email" defaultChecked className="accent-primary" />
                <label htmlFor="email" className="text-sm font-bold">Email</label>
                <input type="radio" name="contact" id="phone" className="accent-primary" />
                <label htmlFor="phone" className="text-sm font-bold">Phone</label>
              </div>
            </div>

            <div className="flex gap-4 mb-10">
              <input 
                type="text" 
                placeholder="Email or Phone Number" 
                className="flex-1 bg-muted/50 border border-border rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button className="bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                Share App Link
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Download app from</p>
              <div className="flex gap-4">
                <img src="https://b.zmtcdn.com/data/webuikit/9f0c85a5e33482770ae0d4b97a2b947b1569574213.png" alt="App Store" className="h-12 w-fit cursor-pointer hover:scale-105 transition-transform" />
                <img src="https://b.zmtcdn.com/data/webuikit/23e930757c3df49840c482a8638ff5c31556001144.png" alt="Google Play" className="h-12 w-fit cursor-pointer hover:scale-105 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 relative">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, type: "spring" }}
            className="relative z-10"
          >
            <div className="relative w-full max-w-[350px] mx-auto aspect-[9/19] bg-gray-900 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=400" 
                alt="App Interface" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-white">
                <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold mb-2">Order in Seconds</h4>
                <p className="text-sm text-white/70">Tap to order your favorite food from the best restaurants.</p>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-border z-20 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">NEW APP</p>
                <p className="text-sm font-bold">Download Now</p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Background circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}
