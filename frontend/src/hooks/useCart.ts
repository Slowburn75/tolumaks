import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartApi, unwrapData } from "@/lib/api";
import type { Product } from "@/types";
import toast from "react-hot-toast";

interface LocalCartItem {
  id?: string;
  productId: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  savedForLater: boolean;
}

function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("tolumak-auth");
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return Boolean(parsed?.state?.token);
  } catch {
    return false;
  }
}

interface CartState {
  items: LocalCartItem[];
  isOpen: boolean;
  isLoading: boolean;
  setOpen: (open: boolean) => void;
  toggleCart: () => void;
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => Promise<void>;
  removeItem: (productId: string, size?: string, color?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
  toggleSaveForLater: (productId: string, size?: string, color?: string) => void;
  clearCart: () => Promise<void>;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,

      setOpen: (open: boolean) => set({ isOpen: open }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      fetchCart: async () => {
        if (!isLoggedIn()) return;
        set({ isLoading: true });
        try {
          const res = await cartApi.getCart();
          const cart = unwrapData<{ items?: LocalCartItem[] }>(res);
          const items = cart?.items || (res as { items?: LocalCartItem[] }).items;
          if (items) {
            set({
              items: items.map((i) => ({
                ...i,
                productId: i.productId || (i as { product?: { id: string } }).product?.id || "",
                savedForLater: i.savedForLater ?? false,
              })),
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (product: Product, quantity = 1, size?: string, color?: string) => {
        const prev = get().items;
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.productId === product.id && item.size === size && item.color === color
          );
          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
            return { items: newItems };
          }
          return {
            items: [
              ...state.items,
              { productId: product.id, product, quantity, size, color, savedForLater: false },
            ],
          };
        });

        if (isLoggedIn()) {
          try {
            const res = await cartApi.addToCart({ productId: product.id, quantity, size, color });
            const cart = unwrapData<{ items?: LocalCartItem[] }>(res);
            if (cart?.items) {
              set({
                items: cart.items.map((i) => ({
                  ...i,
                  productId: i.productId,
                  savedForLater: false,
                })),
              });
            }
          } catch (err) {
            set({ items: prev });
            toast.error(err instanceof Error ? err.message : "Could not add to cart");
          }
        }
      },

      removeItem: async (productId: string, size?: string, color?: string) => {
        const item = get().items.find(
          (i) => i.productId === productId && i.size === size && i.color === color
        );
        const prev = get().items;
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size && i.color === color)
          ),
        }));
        if (isLoggedIn() && item?.id) {
          try {
            await cartApi.removeCartItem(item.id);
          } catch (err) {
            set({ items: prev });
            toast.error(err instanceof Error ? err.message : "Could not remove item");
          }
        }
      },

      updateQuantity: async (productId: string, quantity: number, size?: string, color?: string) => {
        if (quantity < 1) return;
        const item = get().items.find(
          (i) => i.productId === productId && i.size === size && i.color === color
        );
        const prev = get().items;
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.size === size && i.color === color
              ? { ...i, quantity }
              : i
          ),
        }));
        if (isLoggedIn() && item?.id) {
          try {
            await cartApi.updateCartItem(item.id, { quantity });
          } catch (err) {
            set({ items: prev });
            toast.error(err instanceof Error ? err.message : "Could not update cart");
          }
        }
      },

      toggleSaveForLater: (productId: string, size?: string, color?: string) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.size === size && item.color === color
              ? { ...item, savedForLater: !item.savedForLater }
              : item
          ),
        }));
      },

      clearCart: async () => {
        set({ items: [] });
        if (isLoggedIn()) {
          try {
            await cartApi.clearCart();
          } catch {
            // local already cleared
          }
        }
      },

      getItemCount: () => get().items.filter((i) => !i.savedForLater).reduce((s, i) => s + i.quantity, 0),

      getSubtotal: () =>
        get()
          .items.filter((i) => !i.savedForLater)
          .reduce(
            (sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity,
            0
          ),

      getTotal: () => get().getSubtotal(),
    }),
    {
      name: "tolumak-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export function useCart() {
  return useCartStore();
}
