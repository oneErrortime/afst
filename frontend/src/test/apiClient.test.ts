/**
 * Tests for api/client.ts
 *
 * Key regression: axios interceptor must read token from
 * localStorage['auth-storage'].state.token, NOT from localStorage['token'].
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

const BASE = 'https://afst-4.onrender.com/api/v1';

// Helper: write token the way zustand persist does
const persistToken = (token: string) => {
  localStorage.setItem(
    'auth-storage',
    JSON.stringify({ state: { token, isAuthenticated: true, user: null } })
  );
};

beforeEach(() => localStorage.clear());

describe('axios interceptor — Authorization header', () => {
  it('sends no Authorization header when localStorage is empty', async () => {
    let received: string | null = null;
    server.use(
      http.get(`${BASE}/books`, ({ request }) => {
        received = request.headers.get('Authorization');
        return HttpResponse.json({ books: [] });
      })
    );

    const { default: apiClient } = await import('@/api/client');
    await apiClient.get('/books');
    expect(received).toBeNull();
  });

  it('sends correct Authorization header when token in auth-storage', async () => {
    persistToken('jwt-valid-token');
    let received: string | null = null;
    server.use(
      http.get(`${BASE}/books`, ({ request }) => {
        received = request.headers.get('Authorization');
        return HttpResponse.json({ books: [] });
      })
    );

    // Re-import to get fresh instance with populated localStorage
    const { createApiClient } = await import('@/api/client');
    const client = createApiClient();
    await client.get('/books');
    expect(received).toBe('Bearer jwt-valid-token');
  });

  it('does NOT send Authorization from bare localStorage token key (regression)', async () => {
    // This was the old broken behavior
    localStorage.setItem('token', 'should-not-be-used');
    let received: string | null = null;
    server.use(
      http.get(`${BASE}/books`, ({ request }) => {
        received = request.headers.get('Authorization');
        return HttpResponse.json({ books: [] });
      })
    );

    const { createApiClient } = await import('@/api/client');
    const client = createApiClient();
    await client.get('/books');
    // Old code sent 'Bearer should-not-be-used' — fixed code sends null
    expect(received).toBeNull();
  });

  it('emits api:unauthorized event on 401 response', async () => {
    const { eventBus } = await import('@/lib/eventBus');
    const events: unknown[] = [];
    const unsub = eventBus.on('api:unauthorized', (d) => events.push(d));

    server.use(http.get(`${BASE}/books`, () => HttpResponse.json({}, { status: 401 })));
    const { createApiClient } = await import('@/api/client');
    const client = createApiClient();
    await client.get('/books').catch(() => {});

    // Give dynamic import in interceptor time to fire
    await new Promise(r => setTimeout(r, 50));

    expect(events.length).toBeGreaterThan(0);
    unsub();
  });
});
