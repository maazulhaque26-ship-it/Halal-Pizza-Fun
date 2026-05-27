"use client";

import { motion } from "framer-motion";
import { ChevronRight, Star } from "lucide-react";
import Image from "next/image";

const collections = [
  {
    id: 1,
    title: "Top Trending Places",
    count: "24 Places",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 2,
    title: "Best of the Week",
    count: "12 Places",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 3,
    title: "Rooftop Dining",
    count: "15 Places",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 4,
    title: "Great Buffets",
    count: "8 Places",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600",
  },
];

export default function CollectionSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-extrabold mb-4"
            >
              Collections
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg"
            >
              Explore curated lists of top restaurants, cafes, pubs, and bars in your city, based on trends
            </motion.p>
          </div>
          <motion.button 
            whileHover={{ x: 5 }}
            className="flex items-center gap-2 text-primary font-bold hover:underline"
          >
            All collections in New York <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-white text-xl font-bold mb-1">{item.title}</h3>
                <div className="flex items-center gap-2 text-white/80 font-medium">
                  <span>{item.count}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
