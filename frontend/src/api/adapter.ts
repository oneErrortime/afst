import { OpenAPI } from '@/shared/api';
import axios from 'axios';
import { toast } from '@/components/ui/Toast';

export interface ApiConfig {
  baseUrl: string;
  token?: string;
}

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (import.meta.env.DEV) {
    return 'http://localhost:8080/api/v1';
  }
  
  return 'https://afst-4.onrender.com/api/v1';
};

export function initializeAPI(config?: Partial<ApiConfig>) {
  const baseUrl = config?.baseUrl || getBaseUrl();
  const token = config?.token || localStorage.getItem('token');
  
  OpenAPI.BASE = baseUrl;
  
  if (token) {
    OpenAPI.TOKEN = token;
  }
  
  console.log('[API] Initialized with base URL:', baseUrl);
}

export function setApiToken(token: string | null) {
  if (token) {
    localStorage.setItem('token', token);
    OpenAPI.TOKEN = token;
    console.log('[API] Token set');
  } else {
    localStorage.removeItem('token');
    OpenAPI.TOKEN = undefined;
    console.log('[API] Token removed');
  }
}

export function getApiToken(): string | null {
  return localStorage.getItem('token');
}

export function clearApiToken() {
  localStorage.removeItem('token');
  OpenAPI.TOKEN = undefined;
  console.log('[API] Token cleared');
}

export function updateApiConfig(config: Partial<ApiConfig>) {
  if (config.baseUrl) {
    OpenAPI.BASE = config.baseUrl;
    console.log('[API] Base URL updated:', config.baseUrl);
  }
  
  if (config.token !== undefined) {
    setApiToken(config.token);
  }
}

export function getApiConfig(): ApiConfig {
  return {
    baseUrl: OpenAPI.BASE,
    token: OpenAPI.TOKEN as string | undefined,
  };
}

let interceptorsSetup = false;

export function setupAuthInterceptor() {
  if (interceptorsSetup) return;
  
  // Setup global axios interceptors (used by generated services)
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      try {
        handleApiError(error);
      } catch (e) {
        return Promise.reject(e);
      }
    }
  );

  const originalFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [url, config] = args;
    const token = getApiToken();
    
    if (token && config) {
      const headers = new Headers(config.headers as HeadersInit);
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      (config as RequestInit).headers = headers;
    }
    
    try {
      const response = await originalFetch(url, config);
      if (response.status === 401) {
        clearApiToken();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/afst/login';
        }
      }
      return response;
    } catch (error) {
      console.error('[API] Fetch error:', error);
      throw error;
    }
  };
  
  interceptorsSetup = true;
  console.log('[API] Auth interceptors setup complete');
}

export function listenToStorageChanges() {
  window.addEventListener('storage', (event) => {
    if (event.key === 'token') {
      const newToken = event.newValue;
      if (newToken) {
        OpenAPI.TOKEN = newToken;
        console.log('[API] Token updated from storage');
      } else {
        OpenAPI.TOKEN = undefined;
        console.log('[API] Token removed from storage');
      }
    }
  });
  
  console.log('[API] Storage listener setup complete');
}

export function handleApiError(error: any): never {
  const status = error?.status || error?.response?.status;
  const body = error?.body || error?.response?.data;
  const message = body?.message || body?.error || error?.message;

  console.error('[API] Error:', { status, message, error });
  
  if (status === 401) {
    clearApiToken();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/afst/login';
    }
  }
  
  if (status === 403) {
    console.error('[API] Forbidden - insufficient permissions');
  }
  
  if (status === 404) {
    console.error('[API] Resource not found');
  }
  
  if (status === 503) {
    console.error('[API] Service Unavailable - Maintenance Mode?');
    toast.warning('Система временно недоступна (техническое обслуживание)');
  }

  if (status >= 500) {
    console.error('[API] Server error');
  }
  
  throw error;
}

export function initializeApiSystem(config?: Partial<ApiConfig>) {
  initializeAPI(config);
  setupAuthInterceptor();
  listenToStorageChanges();
  
  console.log('[API] Full system initialized');
}
