import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import apiClient from '@/api/client';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setToken: (token: string) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          set({ isLoading: true });
          const response = await apiClient.get('/auth/me');
          set({ user: response.data.user || response.data, isAuthenticated: true });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true });
      },

      register: async (email: string, password: string, name: string) => {
        const response = await apiClient.post('/auth/register', { email, password, name });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        isAuthenticated: state.isAuthenticated,
        user: state.user 
      }),
    }
  )
);
