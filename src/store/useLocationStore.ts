import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationState {
  coordinates: { lat: number; lng: number } | null;
  address: string | null;
  nearestBranchId: string | null;
  setLocation: (coords: { lat: number; lng: number }, address: string) => void;
  setNearestBranch: (branchId: string) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      coordinates: null,
      address: null,
      nearestBranchId: null,
      setLocation: (coordinates, address) => set({ coordinates, address }),
      setNearestBranch: (nearestBranchId) => set({ nearestBranchId }),
      clearLocation: () => set({ coordinates: null, address: null, nearestBranchId: null }),
    }),
    { name: "hpf-location-storage" }
  )
);

