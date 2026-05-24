"use client";

import { Fragment, useMemo, useState, useEffect, useRef } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { Crosshair, LocateFixed, MapPin, Search, Loader } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { reverseGeocode, searchAddress, buildIndianStreet, type NominatimAddress } from "@/lib/services/nominatim";
import { branchIcon, customerIcon } from "./leafletIcons";
import MapRecenter from "./MapRecenter";
import type { BranchMapBranch, MapPoint } from "./types";

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

function ClickSelector({ onSelect }: { onSelect: (point: MapPoint) => void }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function getBranchPoint(branch: BranchMapBranch): MapPoint {
  return { lat: branch.location.coordinates[1], lng: branch.location.coordinates[0] };
}

export default function CustomerLocationPicker({
  branches = [],
  value,
  onChange,
  height = "360px",
}: {
  branches?: BranchMapBranch[];
  value?: MapPoint | null;
  onChange: (location: { coordinates: MapPoint; address: string; raw?: NominatimAddress | null }) => void;
  height?: string;
}) {
  const [selected, setSelected] = useState<MapPoint | null>(value || null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-suggest while typing (debounced)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const matches = await searchAddress(query);
        setResults(matches);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce for 300ms

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const center = useMemo(() => {
    if (selected) return selected;
    const firstBranch = branches.find((branch) => branch.location?.coordinates?.length === 2);
    return firstBranch ? getBranchPoint(firstBranch) : DEFAULT_CENTER;
  }, [branches, selected]);

  const selectPoint = async (point: MapPoint) => {
    setSelected(point);
    const geo = await reverseGeocode(point.lat, point.lng);
    const displayAddr = geo
      ? (geo.address ? buildIndianStreet(geo.address, geo.displayName) + ", " + (geo.address?.city || geo.address?.town || geo.address?.state_district || geo.address?.state || "") : geo.displayName)
      : `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
    onChange({
      coordinates: point,
      address: displayAddr,
      raw: geo,
    });
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location detection is not available in this browser");
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
        toast.error("Could not detect your current location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const chooseResult = (result: NominatimAddress) => {
    setResults([]);
    setQuery(result.displayName);
    selectPoint({ lat: result.lat, lng: result.lng });
  };

  const [mapId] = useState(() => Math.random().toString(36).substring(7));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          {loading && <Loader className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary animate-spin" />}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
              }
            }}
            placeholder="Search address with OpenStreetMap"
            className="w-full rounded-xl border border-white/10 bg-background py-3 pl-10 pr-10 text-sm font-semibold text-white/90 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="button"
          onClick={detectCurrentLocation}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-white/70 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" />
          Locate
        </button>
      </div>

      {query.trim() && !loading && results.length === 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-lg p-4 text-center text-sm text-white/40">
          No matching addresses found
        </div>
      )}

      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-lg">
          {results.map((result) => (
            <button
              type="button"
              key={`${result.lat}-${result.lng}-${result.displayName}`}
              onClick={() => chooseResult(result)}
              className="flex w-full items-start gap-2 border-b border-white/8 px-4 py-3 text-left text-sm text-white/70 last:border-0 hover:bg-primary/10"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{result.displayName}</span>
            </button>
          ))}
        </div>
      )}

      <div className="hpf-map-shell" style={{ height }}>
        <MapContainer key={mapId} center={[center.lat, center.lng]} zoom={selected ? 15 : 11} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={center} zoom={selected ? 15 : 11} />
          <ClickSelector onSelect={selectPoint} />

          {branches.map((branch) => {
            if (!branch.location?.coordinates?.length) return null;
            const point = getBranchPoint(branch);
            return (
              <Fragment key={branch._id}>
                <Circle
                  center={[point.lat, point.lng]}
                  radius={(Number(branch.deliveryRadiusKm) || 5) * 1000}
                  pathOptions={{ color: "#D4AF37", fillColor: "#D4AF37", fillOpacity: 0.1, opacity: 0.45 }}
                />
                <Marker position={[point.lat, point.lng]} icon={branchIcon}>
                  <Popup>{branch.name}</Popup>
                </Marker>
              </Fragment>
            );
          })}

          {selected && (
            <Marker position={[selected.lat, selected.lng]} icon={customerIcon}>
              <Popup>Selected delivery location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
        <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-3">Map Legend</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400/30 border-2 border-yellow-500/60 shrink-0"></div>
            <span className="text-white/60">Branch delivery zone (tap the map within these zones)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 shrink-0"></div>
            <span className="text-white/60">Branch location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 shrink-0"></div>
            <span className="text-white/60">Your delivery location</span>
          </div>
        </div>
      </div>
    </div>
  );
}
