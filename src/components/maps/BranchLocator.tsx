"use client";

import "leaflet/dist/leaflet.css";

import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { reverseGeocode, searchAddress, type NominatimAddress } from "@/lib/services/nominatim";
import { branchIcon } from "./leafletIcons";
import MapRecenter from "./MapRecenter";
import DeliveryRadiusMap from "./DeliveryRadiusMap";
import type { BranchMapBranch, MapPoint } from "./types";

function PinDropper({ onSelect }: { onSelect: (point: MapPoint) => void }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

export default function BranchLocator({
  value,
  radiusKm,
  branch,
  onChange,
  height = "340px",
}: {
  value: MapPoint;
  radiusKm: number;
  branch?: Partial<BranchMapBranch>;
  onChange: (location: { coordinates: MapPoint; address?: NominatimAddress | null }) => void;
  height?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimAddress[]>([]);
  const [loading, setLoading] = useState(false);

  const selectPoint = async (point: MapPoint) => {
    const address = await reverseGeocode(point.lat, point.lng);
    onChange({ coordinates: point, address });
  };

  const findCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location detection is unavailable in this browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        selectPoint({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setLoading(false);
        toast.error("Could not detect current location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const matches = await searchAddress(query);
      setResults(matches);
      if (matches.length === 0) toast.error("No matching address found");
    } finally {
      setLoading(false);
    }
  };

  const previewBranch: BranchMapBranch = {
    _id: branch?._id || "preview",
    name: branch?.name || "Branch preview",
    contactNumber: branch?.contactNumber,
    deliveryRadiusKm: radiusKm,
    isActive: branch?.isActive,
    isAcceptingOrders: branch?.isAcceptingOrders,
    address: branch?.address,
    operatingHours: branch?.operatingHours,
    location: { type: "Point", coordinates: [value.lng, value.lat] },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                runSearch();
              }
            }}
            placeholder="Search branch address with OpenStreetMap"
            className="w-full rounded-xl border border-white/10 bg-background py-3 pl-10 pr-4 text-sm font-semibold text-white/90 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="button"
          onClick={runSearch}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#080d15] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary hover:text-black disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
        <button
          type="button"
          onClick={findCurrentLocation}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-white/70 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" />
          Locate
        </button>
      </div>

      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-lg">
          {results.map((result) => (
            <button
              type="button"
              key={`${result.lat}-${result.lng}-${result.displayName}`}
              onClick={() => {
                setResults([]);
                setQuery(result.displayName);
                selectPoint({ lat: result.lat, lng: result.lng });
              }}
              className="flex w-full items-start gap-2 border-b border-white/8 px-4 py-3 text-left text-sm text-white/70 last:border-0 hover:bg-primary/10"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{result.displayName}</span>
            </button>
          ))}
        </div>
      )}

      <div className="hpf-map-shell" style={{ height }}>
        <MapContainer key={value.lat + ',' + value.lng + 'locator'} center={[value.lat, value.lng]} zoom={14} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={value} zoom={14} />
          <PinDropper onSelect={selectPoint} />
          <Marker position={[value.lat, value.lng]} icon={branchIcon} />
        </MapContainer>
      </div>

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-white/50">Delivery zone preview</p>
        <DeliveryRadiusMap branches={[previewBranch]} center={value} zoom={12} height="260px" />
      </div>
    </div>
  );
}
