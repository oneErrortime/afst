import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getBaseUrl } from '@/api/wrapper';

type SSEEventType =
  | 'connected' | 'ping'
  | 'book.uploaded' | 'book.processed'
  | 'access.granted' | 'access.revoked'
  | 'subscription.new' | 'subscription.expired'
  | 'reading.progress';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SSEHandler<T = any> = (data: T) => void;
type HandlerMap = Partial<Record<SSEEventType, SSEHandler>>;

interface UseSSEOptions {
  handlers: HandlerMap;
  enabled?: boolean;
}

const ALL_EVENTS: SSEEventType[] = [
  'connected', 'ping', 'book.uploaded', 'book.processed',
  'access.granted', 'access.revoked', 'subscription.new',
  'subscription.expired', 'reading.progress',
];

export function useSSE({ handlers, enabled = true }: UseSSEOptions) {
  const { token, isAuthenticated } = useAuthStore();
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const delayRef = useRef(1000);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return;

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/events/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => { delayRef.current = 1000; };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      const delay = Math.min(delayRef.current, 30_000);
      delayRef.current = delay * 2;
      retryRef.current = setTimeout(connect, delay);
    };

    for (const type of ALL_EVENTS) {
      es.addEventListener(type, (e: MessageEvent) => {
        const h = handlersRef.current[type];
        if (!h) return;
        try { h(JSON.parse(e.data)); } catch { h(e.data); }
      });
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;
    connect();
    return () => {
      clearTimeout(retryRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [enabled, isAuthenticated, connect]);
}
