/**
 * useOrderTransferStore - Zustand store for order transfer management
 * 
 * Manages:
 * - Pending transfers for a branch
 * - Transfer history for an order
 * - Transfer statistics
 */

import { create } from "zustand";

export interface OrderTransfer {
  _id: string;
  orderId: string;
  fromBranchId: string;
  toBranchId: string;
  reason: string;
  transferredAt: Date;
  transferStatus: string;
}

interface OrderTransferStore {
  pendingTransfers: OrderTransfer[];
  transferHistory: OrderTransfer[];
  setPendingTransfers: (transfers: OrderTransfer[]) => void;
  setTransferHistory: (transfers: OrderTransfer[]) => void;
  addTransfer: (transfer: OrderTransfer) => void;
  clearPendingTransfers: () => void;
  clearTransferHistory: () => void;
}

export const useOrderTransferStore = create<OrderTransferStore>((set) => ({
  pendingTransfers: [],
  transferHistory: [],
  setPendingTransfers: (transfers) => set({ pendingTransfers: transfers }),
  setTransferHistory: (transfers) => set({ transferHistory: transfers }),
  addTransfer: (transfer) =>
    set((state) => ({
      transferHistory: [transfer, ...state.transferHistory],
    })),
  clearPendingTransfers: () => set({ pendingTransfers: [] }),
  clearTransferHistory: () => set({ transferHistory: [] }),
}));
