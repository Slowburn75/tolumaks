import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, cartApi, unwrapData } from "@/lib/api";
import type { User, LoginInput, RegisterInput } from "@/types";

function setSessionCookies(role?: string | null) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `tolumak_session=1; path=/; max-age=${maxAge}; samesite=lax`;
  if (role) {
    document.cookie = `tolumak_role=${role}; path=/; max-age=${maxAge}; samesite=lax`;
  }
}

function clearSessionCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "tolumak_session=; path=/; max-age=0";
  document.cookie = "tolumak_role=; path=/; max-age=0";
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  updateProfile: (data: FormData | Record<string, unknown>) => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (data: LoginInput) => {
        set({ isLoading: true });
        try {
          const res = unwrapData<{ accessToken: string; user: User }>(await authApi.login(data));
          set({
            user: res.user,
            token: res.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          setSessionCookies(res.user?.role);

          // Merge guest cart into server cart
          try {
            const cartRaw = localStorage.getItem("tolumak-cart");
            if (cartRaw) {
              const cartParsed = JSON.parse(cartRaw);
              const items = cartParsed?.state?.items || [];
              if (items.length) {
                await cartApi.mergeCart(
                  items.map((i: { productId: string; quantity: number; size?: string; color?: string }) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    size: i.size,
                    color: i.color,
                  })),
                );
              }
            }
          } catch {
            // non-fatal
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterInput) => {
        set({ isLoading: true });
        try {
          const res = unwrapData<{ message: string; user: User }>(await authApi.register(data));
          set({
            user: res.user,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          if (get().token) await authApi.logout();
        } catch {
          // still clear local session
        }
        clearSessionCookies();
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        try {
          localStorage.removeItem("tolumak-cart");
        } catch {}
      },

      getMe: async () => {
        try {
          const res = unwrapData<User>(await authApi.getMe());
          set({ user: res, isAuthenticated: true });
          setSessionCookies(res.role);
        } catch {
          clearSessionCookies();
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data: FormData | Record<string, unknown>) => {
        const res = unwrapData<User>(await authApi.updateProfile(data));
        set({ user: res });
      },

      setUser: (user: User) => set({ user }),

      setToken: (token: string) => set({ token }),
    }),
    {
      name: "tolumak-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user
          ? { id: state.user.id, role: state.user.role, name: state.user.name, email: state.user.email }
          : null,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = true;
          if (state.user?.role) {
            setSessionCookies(state.user.role);
          } else {
            setSessionCookies();
          }
        }
      },
    }
  )
);

export function useAuth() {
  return useAuthStore();
}
