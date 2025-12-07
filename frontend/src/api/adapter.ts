import { OpenAPI } from '@/shared/api';

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
  
  return 'https://afst-1.onrender.com/api/v1';
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
    token: OpenAPI.TOKEN,
  };
}

export function setupAuthInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [url, config] = args;
    const token = getApiToken();
    
    if (token && config) {
      const headers = new Headers(config.headers);
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      config.headers = headers;
    }
    
    try {
      const response = await originalFetch(url, config);
      
      if (response.status === 401) {
        clearApiToken();
        window.location.href = '/afst/login';
      }
      
      return response;
    } catch (error) {
      console.error('[API] Fetch error:', error);
      throw error;
    }
  };
  
  console.log('[API] Auth interceptor setup complete');
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
  console.error('[API] Error:', error);
  
  if (error.status === 401) {
    clearApiToken();
    window.location.href = '/afst/login';
  }
  
  if (error.status === 403) {
    console.error('[API] Forbidden - insufficient permissions');
  }
  
  if (error.status === 404) {
    console.error('[API] Resource not found');
  }
  
  if (error.status >= 500) {
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
