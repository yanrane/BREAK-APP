import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  currentStreak: number;
}

interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (tokens, user) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user }),
      setAccessToken: (token) => set({ accessToken: token }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'break-auth' },
  ),
);
