"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { MapPin, Phone } from "lucide-react";
import { branchIcon } from "./leafletIcons";
import MapRecenter from "./MapRecenter";
import type { BranchMapBranch, MapPoint } from "./types";

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

function getBranchPoint(branch: BranchMapBranch): MapPoint {
  return {
    lat: branch.location.coordinates[1],
    lng: branch.location.coordinates[0],
  };
}

function getCenter(branches: BranchMapBranch[], center?: MapPoint): MapPoint {
  if (center) return center;
  const branch = branches.find((item) => item.location?.coordinates?.length === 2);
  return branch ? getBranchPoint(branch) : DEFAULT_CENTER;
}

export default function BranchMap({
  branches,
  center,
  zoom = 12,
  height = "420px",
  interactive = true,
}: {
  branches: BranchMapBranch[];
  center?: MapPoint;
  zoom?: number;
  height?: string;
  interactive?: boolean;
}) {
  const mapCenter = getCenter(branches, center);

  return (
    <div className="hpf-map-shell" style={{ height }}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={mapCenter} zoom={zoom} />

        {branches.map((branch) => {
          if (!branch.location?.coordinates?.length) return null;
          const point = getBranchPoint(branch);
          const address = [branch.address?.street, branch.address?.city].filter(Boolean).join(", ");

          return (
            <Marker key={branch._id} position={[point.lat, point.lng]} icon={branchIcon}>
              <Popup>
                <div className="min-w-48 space-y-2">
                  <div>
                    <p className="font-black text-white">{branch.name}</p>
                    <p className="text-xs font-semibold text-emerald-700">
                      {branch.isAcceptingOrders === false ? "Not accepting orders" : "Accepting orders"}
                    </p>
                  </div>
                  {address && (
                    <p className="flex gap-1 text-xs text-white/60">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      {address}
                    </p>
                  )}
                  {branch.contactNumber && (
                    <p className="flex gap-1 text-xs text-white/60">
                      <Phone className="mt-0.5 h-3 w-3 shrink-0" />
                      {branch.contactNumber}
                    </p>
                  )}
                  <p className="text-xs font-bold text-white/90">
                    Delivery radius: {branch.deliveryRadiusKm} km
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
