import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import apiClient from '@/api/client';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  initialize: () => Promise<void>;
  fetchUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ user: User }>;
  register: (email: string, password: string, name: string) => Promise<{ user: User }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      // Called once on app startup — verifies stored token is still valid
      initialize: async () => {
        const { token, isInitialized } = get();
        if (isInitialized) return;

        if (!token) {
          set({ isInitialized: true, isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });
          const response = await apiClient.get('/auth/me');
          const user = response.data.user || response.data;
          set({ user, isAuthenticated: true });
        } catch {
          // Token invalid / expired — clear state silently
          set({ token: null, user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const response = await apiClient.get('/auth/me');
          set({ user: response.data.user || response.data });
        } catch {
          // Silent — don't logout on refresh failure, let interceptor handle 401
        }
      },

      login: async (email: string, password: string) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { token, user } = response.data;
        set({ token, user, isAuthenticated: true, isInitialized: true });
        // Sync OpenAPI client token so generated services (BooksService etc.) work immediately
        import('@/api/wrapper').then(({ OpenAPI }) => { OpenAPI.TOKEN = () => token; });
        return { user };
      },

      register: async (email: string, password: string, name: string) => {
        const response = await apiClient.post('/auth/register', { email, password, name });
        const { token, user } = response.data;
        set({ token, user, isAuthenticated: true, isInitialized: true });
        import('@/api/wrapper').then(({ OpenAPI }) => { OpenAPI.TOKEN = () => token; });
        return { user };
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
