import { create } from 'zustand';
import type { User } from '../domain/user';

interface AuthStoreState {
  user: User | null;
  isLoading: boolean;
  hasLoaded: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoading: false,
  hasLoaded: false,
  setUser: (user) => set({ user, hasLoaded: true }),
  setLoading: (isLoading) => set({ isLoading }),
}));
