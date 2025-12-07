import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  token?: string;
  user?: any;
  status: 'idle' | 'loading' | 'authenticated';
  error?: string;
  lastBaseUrl?: string;
  login: (baseUrl: string, email: string, password: string) => Promise<void>;
  register: (baseUrl: string, email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string, baseUrl: string) => void;
}

const request = async (baseUrl: string, path: string, init?: RequestInit) => {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Ошибка ${response.status}`);
  }
  if (response.status === 204) {
    return undefined;
  }
  return response.json();
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      token: undefined,
      user: undefined,
      status: 'idle',
      error: undefined,
      login: async (baseUrl, email, password) => {
        set({ status: 'loading', error: undefined });
        try {
          const data = await request(baseUrl, '/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });
          const token = data.token;
          set({ token, status: 'authenticated', lastBaseUrl: baseUrl });
          const profile = await request(baseUrl, '/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          set({ user: profile });
        } catch (error) {
          set({
            status: 'idle',
            error: error instanceof Error ? error.message : 'Ошибка авторизации'
          });
        }
      },
      register: async (baseUrl, email, password, name) => {
        set({ status: 'loading', error: undefined });
        try {
          await request(baseUrl, '/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name })
          });
          await get().login(baseUrl, email, password);
        } catch (error) {
          set({
            status: 'idle',
            error: error instanceof Error ? error.message : 'Ошибка регистрации'
          });
        }
      },
      logout: () => {
        set({ token: undefined, user: undefined, status: 'idle', error: undefined });
      },
      setToken: (token, baseUrl) => {
        set({ token, lastBaseUrl: baseUrl, status: 'authenticated', error: undefined });
      }
    }),
    {
      name: 'session'
    }
  )
);
