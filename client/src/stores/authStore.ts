import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useFleetStore } from "@/stores/fleetStore";

export type UserRole = "admin" | "manager" | "driver";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface DemoAccount {
  email: string;
  password: string;
  user: AuthUser;
}

interface LoginResult {
  success: boolean;
  message?: string;
  user?: AuthUser;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  setUser: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "admin@fleet.com",
    password: "admin123",
    user: {
      id: "u1",
      name: "Fleet Admin",
      email: "admin@fleet.com",
      role: "admin",
    },
  },
  {
    email: "manager@fleet.com",
    password: "manager123",
    user: {
      id: "u2",
      name: "Fleet Manager",
      email: "manager@fleet.com",
      role: "manager",
    },
  },
  {
    email: "driver@fleet.com",
    password: "driver123",
    user: {
      id: "u3",
      name: "Fleet Driver",
      email: "driver@fleet.com",
      role: "driver",
    },
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      login: async (email, password) => {
        set({ isLoading: true });

        // simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 700));

        const account = DEMO_ACCOUNTS.find(
          (acc) =>
            acc.email.toLowerCase() === email.trim().toLowerCase() &&
            acc.password === password
        );

        if (!account) {
          set({ isLoading: false });
          return {
            success: false,
            message: "Invalid email or password.",
          };
        }

        const token = crypto.randomUUID();

        set({
          user: account.user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        return {
          success: true,
          user: account.user,
        };
      },

      logout: () => {
        // stop active trip timers / clear live trip state
        useFleetStore.getState().resetForLogout?.();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: "fleet-auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);