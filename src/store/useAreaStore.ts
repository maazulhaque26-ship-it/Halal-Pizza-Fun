/**
 * useAreaStore - Zustand store for area management
 * 
 * Manages:
 * - Currently selected area
 * - Areas list cache
 * - Area search results
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Area {
  _id: string;
  name: string;
  description?: string;
  assignedBranchId?: string;
  landmarks?: string[];
}

interface AreaStore {
  selectedArea: Area | null;
  areas: Area[];
  setSelectedArea: (area: Area | null) => void;
  setAreas: (areas: Area[]) => void;
  clearSelectedArea: () => void;
}

export const useAreaStore = create<AreaStore>()(
  persist(
    (set) => ({
      selectedArea: null,
      areas: [],
      setSelectedArea: (area) => set({ selectedArea: area }),
      setAreas: (areas) => set({ areas }),
      clearSelectedArea: () => set({ selectedArea: null }),
    }),
    {
      name: "area-store",
      partialize: (state) => ({
        selectedArea: state.selectedArea,
      }),
    }
  )
);
