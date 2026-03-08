/**
 * Tests for useAuthStore
 *
 * These tests cover the root cause of the redirect loop:
 *   - Token must be stored under 'auth-storage' (zustand persist key)
 *   - initialize() must correctly hydrate from that key
 *   - 401 from /auth/me must clear state (not cause infinite loop)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

const BASE = 'https://afst-4.onrender.com/api/v1';

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    token: null, user: null, isAuthenticated: false,
    isLoading: false, isInitialized: false,
  });
});

describe('useAuthStore — initialize()', () => {
  it('sets isInitialized=true with no token (guest)', async () => {
    await useAuthStore.getState().initialize();
    const { isAuthenticated, isInitialized } = useAuthStore.getState();
    expect(isInitialized).toBe(true);
    expect(isAuthenticated).toBe(false);
  });

  it('validates a valid token against /auth/me and sets user', async () => {
    // Simulate zustand hydration with a valid token
    useAuthStore.setState({ token: 'jwt-valid-token', isAuthenticated: false });
    await useAuthStore.getState().initialize();

    const { isAuthenticated, user, isInitialized } = useAuthStore.getState();
    expect(isInitialized).toBe(true);
    expect(isAuthenticated).toBe(true);
    expect(user?.email).toBe('test@lib.dev');
  });

  it('clears state when /auth/me returns 401 — prevents redirect loop', async () => {
    useAuthStore.setState({ token: 'jwt-expired', isAuthenticated: true });

    // /auth/me will 401 for this token (MSW handler checks token value)
    await useAuthStore.getState().initialize();

    const { isAuthenticated, token, isInitialized } = useAuthStore.getState();
    expect(isInitialized).toBe(true);
    expect(isAuthenticated).toBe(false);
    expect(token).toBeNull();
  });

  it('does not call /auth/me twice (idempotent)', async () => {
    useAuthStore.setState({ token: 'jwt-valid-token', isInitialized: true });
    let calls = 0;
    server.use(http.get(`${BASE}/auth/me`, () => { calls++; return HttpResponse.json({}); }));

    await useAuthStore.getState().initialize();
    expect(calls).toBe(0); // Already initialized — should skip
  });
});

describe('useAuthStore — login()', () => {
  it('sets token and user on successful login', async () => {
    await useAuthStore.getState().login('test@lib.dev', 'correct');
    const { token, isAuthenticated, user } = useAuthStore.getState();

    expect(token).toBe('jwt-valid-token');
    expect(isAuthenticated).toBe(true);
    expect(user?.email).toBe('test@lib.dev');
  });

  it('throws on wrong credentials', async () => {
    await expect(
      useAuthStore.getState().login('test@lib.dev', 'wrong')
    ).rejects.toThrow();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('useAuthStore — logout()', () => {
  it('clears all auth state', async () => {
    useAuthStore.setState({ token: 'jwt-valid-token', isAuthenticated: true, user: { id: '1', email: 'x', name: 'X', role: 'reader' } });
    useAuthStore.getState().logout();

    const { token, isAuthenticated, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
  });
});

describe('zustand persist key', () => {
  it('stores token under auth-storage key (not bare token key)', async () => {
    await useAuthStore.getState().login('test@lib.dev', 'correct');

    // The bug was reading from 'token' — correct key is 'auth-storage'
    const bare = localStorage.getItem('token');
    const storage = localStorage.getItem('auth-storage');

    expect(bare).toBeNull(); // should NOT be set
    expect(storage).not.toBeNull(); // should be set
    expect(JSON.parse(storage!).state.token).toBe('jwt-valid-token');
  });
});
