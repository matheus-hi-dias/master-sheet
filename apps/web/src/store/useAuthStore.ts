import { create } from 'zustand';

import { api } from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  accessToken: null,
  login: async (email, password) => {
    const data = await api.auth.login({ email, password });
    set({ isAuthenticated: true, accessToken: data.access_token });
  },
  logout: async () => {
    try {
      await api.auth.logout();
    } finally {
      set({ isAuthenticated: false, accessToken: null });
    }
  },
  refresh: async () => {
    try {
      const data = await api.auth.refresh();
      set({ isAuthenticated: true, accessToken: data.access_token });
      return true;
    } catch {
      set({ isAuthenticated: false, accessToken: null });
      return false;
    }
  },
  bootstrap: async () => {
    await get().refresh();
  },
}));
