import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiEndpoint {
  id: string;
  name: string;
  url: string;
  description?: string;
  isDefault?: boolean;
}

interface ApiConfigState {
  endpoints: ApiEndpoint[];
  activeEndpointId: string;
  connectionStatus: 'connected' | 'disconnected' | 'checking' | 'error';
  lastChecked: string | null;

  getActiveEndpoint: () => ApiEndpoint | undefined;
  setActiveEndpoint: (id: string) => void;
  addEndpoint: (endpoint: Omit<ApiEndpoint, 'id'>) => void;
  updateEndpoint: (id: string, endpoint: Partial<ApiEndpoint>) => void;
  removeEndpoint: (id: string) => void;
  setConnectionStatus: (status: ApiConfigState['connectionStatus']) => void;
  setLastChecked: (date: string) => void;
  resetToDefaults: () => void;
}

const DEFAULT_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'render-production',
    name: 'Render.com (Production)',
    url: 'https://afst-4.onrender.com/api/v1',
    description: 'Production бэкенд на Render.com',
    isDefault: true,
  },
  {
    id: 'local-dev',
    name: 'Local Development',
    url: 'http://localhost:8080/api/v1',
    description: 'Локальный сервер разработки',
  },
];

export const useApiConfigStore = create<ApiConfigState>()(
  persist(
    (set, get) => ({
      endpoints: DEFAULT_ENDPOINTS,
      activeEndpointId: 'render-production',
      connectionStatus: 'disconnected',
      lastChecked: null,

      getActiveEndpoint: () => {
        const { endpoints, activeEndpointId } = get();
        return endpoints.find((e) => e.id === activeEndpointId);
      },

      setActiveEndpoint: (id) => {
        set({ activeEndpointId: id, connectionStatus: 'disconnected' });
      },

      addEndpoint: (endpoint) => {
        const id = `custom-${Date.now()}`;
        set((state) => ({
          endpoints: [...state.endpoints, { ...endpoint, id }],
        }));
      },

      updateEndpoint: (id, updates) => {
        set((state) => ({
          endpoints: state.endpoints.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      removeEndpoint: (id) => {
        const endpoint = get().endpoints.find((e) => e.id === id);
        if (endpoint?.isDefault) return;

        set((state) => ({
          endpoints: state.endpoints.filter((e) => e.id !== id),
          activeEndpointId:
            state.activeEndpointId === id
              ? 'render-production'
              : state.activeEndpointId,
        }));
      },

      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },

      setLastChecked: (date) => {
        set({ lastChecked: date });
      },

      resetToDefaults: () => {
        set({
          endpoints: DEFAULT_ENDPOINTS,
          activeEndpointId: 'render-production',
        });
      },
    }),
    {
      name: 'api-config-storage',
      partialize: (state) => ({
        endpoints: state.endpoints,
        activeEndpointId: state.activeEndpointId,
      }),
    }
  )
);
