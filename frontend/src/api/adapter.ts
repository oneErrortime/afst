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
  
  return 'https://afst-5.onrender.com/api/v1';
};

/**
 * Single source of truth for token reads — always mirrors what zustand persist writes.
 * zustand/persist stores state as JSON under 'auth-storage', NOT as a bare 'token' key.
 */
function readPersistedToken(): string | null {
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
}

export function initializeAPI(config?: Partial<ApiConfig>) {
  const baseUrl = config?.baseUrl || getBaseUrl();
  const token = config?.token || readPersistedToken();
  
  OpenAPI.BASE = baseUrl;
  
  if (token) {
    OpenAPI.TOKEN = token;
  }
  
  console.log('[API] Initialized with base URL:', baseUrl);
}

export function setApiToken(token: string | null) {
  if (token) {
    OpenAPI.TOKEN = token;
    console.log('[API] Token set');
  } else {
    OpenAPI.TOKEN = undefined;
    console.log('[API] Token removed');
  }
}

export function getApiToken(): string | null {
  return readPersistedToken();
}

export function clearApiToken() {
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

export function setupAuthInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [url, options = {}] = args;
    const token = getApiToken();

    // Inject Authorization header when token exists
    if (token) {
      const headers = new Headers((options as RequestInit).headers as HeadersInit);
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      (options as RequestInit).headers = headers;
    }

    try {
      const response = await originalFetch(url, options as RequestInit);

      if (response.status === 401) {
        clearApiToken();
        // Use eventBus so React Router handles navigation — no hard reload.
        // Hard window.location.href causes a redirect loop:
        //   1. Page reloads → zustand rehydrates with stale token
        //   2. initialize() calls /auth/me → another 401 → another reload
        import('@/lib/eventBus').then(({ eventBus }) => {
          eventBus.emit('api:unauthorized', {});
        });
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
    // Watch 'auth-storage' — the key zustand/persist uses for auth state
    if (event.key === 'auth-storage') {
      try {
        const parsed = event.newValue
          ? (JSON.parse(event.newValue) as { state?: { token?: string | null } })
          : null;
        const newToken = parsed?.state?.token ?? null;
        if (newToken) {
          OpenAPI.TOKEN = newToken;
          console.log('[API] Token updated from storage');
        } else {
          OpenAPI.TOKEN = undefined;
          console.log('[API] Token removed from storage');
        }
      } catch {
        OpenAPI.TOKEN = undefined;
      }
    }
  });
  
  console.log('[API] Storage listener setup complete');
}

export function handleApiError(error: any): never {
  console.error('[API] Error:', error);
  
  if (error?.status === 401 || error?.response?.status === 401) {
    clearApiToken();
    // Use eventBus instead of hard redirect to preserve React Router history
    import('@/lib/eventBus').then(({ eventBus }) => {
      eventBus.emit('api:unauthorized', {});
    });
  }
  
  if (error?.status === 403) {
    console.error('[API] Forbidden - insufficient permissions');
  }
  
  if (error?.status === 404) {
    console.error('[API] Resource not found');
  }
  
  if (error?.status >= 500) {
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
