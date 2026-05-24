"use client";

import { motion } from "framer-motion";
import { Star, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ASSETS } from "@/config/constants";

interface RestaurantCardProps {
  name: string;
  image: string;
  rating: number;
  cuisine: string;
  priceForTwo: string;
  time: string;
  location: string;
  isOffer?: boolean;
}

export default function RestaurantCard({
  name,
  image,
  rating,
  cuisine,
  priceForTwo,
  time,
  location,
  isOffer,
}: RestaurantCardProps) {
  const [imgSrc, setImgSrc] = useState(image || ASSETS.FALLBACK_FOOD_IMAGE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-2xl transition-all duration-300"
    >
      <div className="relative h-56 w-full">
        <Image
          src={imgSrc}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImgSrc(ASSETS.FALLBACK_FOOD_IMAGE)}
        />
        {isOffer && (
          <div className="absolute bottom-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
            Up to 20% OFF
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold">{rating}</span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors">
            {name}
          </h3>
          <span className="text-sm font-bold text-muted-foreground">{priceForTwo}</span>
        </div>
        
        <div className="flex items-center justify-between text-muted-foreground text-sm font-medium mb-4">
          <span className="truncate max-w-[150px]">{cuisine}</span>
          <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            <span>{time}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="truncate">{location}</span>
        </div>
      </div>
    </motion.div>
  );
}

