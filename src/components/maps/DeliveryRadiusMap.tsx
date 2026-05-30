"use client";

import "leaflet/dist/leaflet.css";

import { Fragment, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { branchIcon, customerIcon } from "./leafletIcons";
import MapRecenter from "./MapRecenter";
import type { BranchMapBranch, MapPoint } from "./types";

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

function branchPoint(branch: BranchMapBranch): MapPoint {
  return {
    lat: branch.location.coordinates[1],
    lng: branch.location.coordinates[0],
  };
}

function resolveCenter(branches: BranchMapBranch[], customerLocation?: MapPoint, center?: MapPoint) {
  if (center) return center;
  if (customerLocation) return customerLocation;
  const first = branches.find((branch) => branch.location?.coordinates?.length === 2);
  return first ? branchPoint(first) : DEFAULT_CENTER;
}

export default function DeliveryRadiusMap({
  branches,
  customerLocation,
  center,
  zoom = 12,
  height = "420px",
}: {
  branches: BranchMapBranch[];
  customerLocation?: MapPoint | null;
  center?: MapPoint;
  zoom?: number;
  height?: string;
}) {
  const mapCenter = resolveCenter(branches, customerLocation || undefined, center);

  const [mapId] = useState(() => Math.random().toString(36).substring(7));

  return (
    <div className="hpf-map-shell" style={{ height }}>
      <MapContainer key={mapId} center={[mapCenter.lat, mapCenter.lng]} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={mapCenter} zoom={zoom} />

        {branches.map((branch) => {
          if (!branch.location?.coordinates?.length) return null;
          const point = branchPoint(branch);
          return (
            <Fragment key={branch._id}>
              <Circle
                center={[point.lat, point.lng]}
                radius={branch.deliveryRadiusKm * 1000}
                pathOptions={{
                  color: "#D4AF37",
                  fillColor: "#D4AF37",
                  fillOpacity: 0.12,
                  opacity: 0.55,
                  weight: 2,
                }}
              />
              <Marker position={[point.lat, point.lng]} icon={branchIcon}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-black text-white">{branch.name}</p>
                    <p className="text-xs text-white/60">{branch.deliveryRadiusKm} km delivery zone</p>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}

        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
            <Popup>Your selected delivery location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
