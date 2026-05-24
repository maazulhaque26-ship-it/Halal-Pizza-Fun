import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedAddons: { name: string; price: number }[];
  // Variant support (optional — plain products without variants work as before)
  variantId?: string;
  variantLabel?: string; // e.g. "4 pcs", "8 pcs"
}

/**
 * Unique key for a cart item.
 * For variant products: "{productId}:{variantId}"
 * For plain products:   "{productId}"
 */
function itemKey(item: Pick<CartItem, "productId" | "variantId">): string {
  return item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
}

interface CartState {
  items: CartItem[];
  branchId: string | null;
  addItem: (item: CartItem, currentBranchId: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getSubTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      branchId: null,
      addItem: (item, currentBranchId) =>
        set((state) => {
          // If ordering from a different branch, clear cart first
          if (state.branchId && state.branchId !== currentBranchId) {
            return {
              items: [item],
              branchId: currentBranchId,
            };
          }

          const key = itemKey(item);
          const existingItem = state.items.find((i) => itemKey(i) === key);

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                itemKey(i) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
              branchId: currentBranchId,
            };
          }
          return {
            items: [...state.items, item],
            branchId: currentBranchId,
          };
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i) !== itemKey({ productId, variantId })
          ),
        })),
      updateQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i) === itemKey({ productId, variantId })
              ? { ...i, quantity }
              : i
          ),
        })),
      clearCart: () => set({ items: [], branchId: null }),
      getSubTotal: () => {
        return get().items.reduce((total, item) => {
          const addonsTotal = item.selectedAddons.reduce(
            (sum, addon) => sum + addon.price,
            0
          );
          return total + (item.price + addonsTotal) * item.quantity;
        }, 0);
      },
    }),
    {
      name: "hpf-cart-storage",
    }
  )
);
