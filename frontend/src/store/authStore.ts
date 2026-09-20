import { create } from "zustand";
import { api } from "../lib/api.ts";

type User = { id: string; username: string; email: string };

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;

  setToken: (t: string) => void;
  clear: () => void;
  signup: (username: string, email: string, password: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,

  setToken: (t) => set({ token: t }),
  clear: () => set({ user: null, token: null }),

  signup: async (username, email, password) => {
    const r = await api.post("/auth/signup", { username, email, password });
    set({ user: r.data.data.user, token: r.data.data.accessToken });
  },
  signin: async (email, password) => {
    const r = await api.post("/auth/signin", { email, password });
    set({ user: r.data.data.user, token: r.data.data.accessToken });
  },
  logout: async () => {
    await api.post("/auth/logout").catch(() => {});
    set({ user: null, token: null });
  },
  restore: async () => {
    try {
      const r = await api.post("/auth/refresh");
      set({ token: r.data.data.accessToken });
      const me = await api.get("/auth/me");
      set({ user: me.data.data.user });
    } catch (error) {
      set({ user: null, token: null });
    } finally {
      set({ loading: false });
    }
  },
}));
