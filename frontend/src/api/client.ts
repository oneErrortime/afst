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
  
  return 'https://afst-4.onrender.com/api/v1';
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
      
      const token = localStorage.getItem('token');
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
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/afst/login';
        }
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

export const createAdmin = async (data: any): Promise<any> => {
  const response = await api.post('/setup/create-admin', data);
  return response.data;
};

export default api;
