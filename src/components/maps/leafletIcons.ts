"use client";

import L from "leaflet";

export const branchIcon = L.divIcon({
  className: "hpf-branch-marker",
  html: '<span class="hpf-marker-dot hpf-marker-dot-branch"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

export const customerIcon = L.divIcon({
  className: "hpf-customer-marker",
  html: '<span class="hpf-marker-dot hpf-marker-dot-customer"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});
