import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  userToken: string | null;
  user: UserProfile | null;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userToken: null,
      user: null,
      login: (token, user) => set({ isAuthenticated: true, userToken: token, user }),
      logout: () => set({ isAuthenticated: false, userToken: null, user: null }),
    }),
    {
      name: 'master-sheet-auth',
    }
  )
);
