"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { MapPoint } from "./types";

export default function MapRecenter({ center, zoom }: { center: MapPoint; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately and after a tiny delay to ensure correct container rendering
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    map.invalidateSize();
    map.flyTo([center.lat, center.lng], zoom ?? map.getZoom(), {
      duration: 0.55,
    });
  }, [center.lat, center.lng, map, zoom]);

  return null;
}
