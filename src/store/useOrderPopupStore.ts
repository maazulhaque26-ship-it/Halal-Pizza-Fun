import { create } from "zustand";

interface OrderPopupState {
  activeOrder: any | null;
  isProcessing: boolean;
  setActiveOrder: (order: any | null) => void;
  setIsProcessing: (v: boolean) => void;
}

export const useOrderPopupStore = create<OrderPopupState>((set) => ({
  activeOrder: null,
  isProcessing: false,
  setActiveOrder: (activeOrder) => set({ activeOrder }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
}));
