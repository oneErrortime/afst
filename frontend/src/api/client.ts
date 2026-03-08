import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useApiConfigStore } from '@/store/apiConfigStore';

const getBaseUrl = (): string => {
  const state = useApiConfigStore.getState();
  const activeEndpoint = state.getActiveEndpoint();
  
  if (activeEndpoint) {
    return activeEndpoint.url;
  }
  
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  if (import.meta.env.DEV) {
    return '/api/v1';
  }
  
  return 'https://afst-5.onrender.com/api/v1';
};

/**
 * Reads the JWT token from zustand's persisted storage.
 * zustand/persist saves state as JSON under the key defined in the store
 * ('auth-storage'), NOT as a bare localStorage['token'] entry.
 * Reading from the correct key prevents the auth intercept from sending
 * requests without a token after page refresh, which caused a redirect loop.
 */
const getPersistedToken = (): string | null => {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const token = (JSON.parse(raw) as { state?: { token?: string | null } })?.state?.token;
      if (token) return token;
    }
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

export const createApiClient = () => {
  const client = axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      config.baseURL = getBaseUrl();

      // Zustand persist stores auth under key 'auth-storage' as JSON,
      // NOT as a bare localStorage['token'] entry.
      const token = getPersistedToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Use eventBus so the React router handles navigation (no full reload)
        import('@/lib/eventBus').then(({ eventBus }) => {
          eventBus.emit('api:unauthorized', {});
        });
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const api = createApiClient();

export const checkApiConnection = async (): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> => {
  const store = useApiConfigStore.getState();
  store.setConnectionStatus('checking');
  
  const startTime = Date.now();
  
  try {
    await api.get('/books', { params: { limit: 1 }, timeout: 5000 });
    const latency = Date.now() - startTime;
    
    store.setConnectionStatus('connected');
    store.setLastChecked(new Date().toISOString());
    
    return { success: true, latency };
  } catch (error) {
    const axiosError = error as AxiosError;
    store.setConnectionStatus('error');
    store.setLastChecked(new Date().toISOString());
    
    return {
      success: false,
      error: axiosError.message || 'Connection failed',
    };
  }
};

export const getSetupStatus = async (): Promise<{ setup_needed: boolean }> => {
  const response = await api.get('/setup/status');
  return response.data;
};

export const createAdmin = async (data: { email: string; password: string; name?: string }): Promise<{ message: string }> => {
  const response = await api.post('/setup/create-admin', data);
  return response.data;
};

export default api;
