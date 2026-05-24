import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BranchInfo {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  contactNumber: string;
  whatsappNumber?: string;
  deliveryCharge?: number;
  estimatedDeliveryTime?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  operatingHours: {
    open: string;
    close: string;
  };
}

export interface AreaInfo {
  _id: string;
  name: string;
  assignedBranchId?: string | { _id: string; name: string };
  landmarks?: string[];
}

interface BranchState {
  selectedBranch: BranchInfo | null;
  selectedCity: string | null;
  selectedArea: AreaInfo | null;
  setSelectedBranch: (branch: BranchInfo | null) => void;
  setSelectedCity: (city: string | null) => void;
  setSelectedArea: (area: AreaInfo | null) => void;
  clearBranchSelection: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      selectedBranch: null,
      selectedCity: null,
      selectedArea: null,
      setSelectedBranch: (branch) => set({ selectedBranch: branch }),
      setSelectedCity: (city) => set({ selectedCity: city }),
      setSelectedArea: (area) => set({ selectedArea: area }),
      clearBranchSelection: () =>
        set({ selectedBranch: null, selectedCity: null, selectedArea: null }),
    }),
    {
      name: "hpf-branch-selection",
    }
  )
);
