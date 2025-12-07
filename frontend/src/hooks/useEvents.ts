import { useEffect, useCallback } from 'react';
import { eventBus, type EventBusEvents, type EventName } from '@/lib/eventBus';

export function useEvent<E extends EventName>(
  event: E,
  callback: (data: EventBusEvents[E]) => void,
) {
  useEffect(() => {
    const unsubscribe = eventBus.on(event, callback);
    return () => unsubscribe();
  }, [event, callback]);
}

export function useEventEmitter() {
  const emit = useCallback(<E extends EventName>(event: E, data: EventBusEvents[E]) => {
    eventBus.emit(event, data);
  }, []);

  return { emit };
}

export function useBookEvents(handlers: {
  onCreated?: (data: EventBusEvents['book:created']) => void;
  onUpdated?: (data: EventBusEvents['book:updated']) => void;
  onDeleted?: (data: EventBusEvents['book:deleted']) => void;
  onBorrowed?: (data: EventBusEvents['book:borrowed']) => void;
  onReturned?: (data: EventBusEvents['book:returned']) => void;
}) {
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    if (handlers.onCreated) {
      unsubscribes.push(eventBus.on('book:created', handlers.onCreated));
    }
    if (handlers.onUpdated) {
      unsubscribes.push(eventBus.on('book:updated', handlers.onUpdated));
    }
    if (handlers.onDeleted) {
      unsubscribes.push(eventBus.on('book:deleted', handlers.onDeleted));
    }
    if (handlers.onBorrowed) {
      unsubscribes.push(eventBus.on('book:borrowed', handlers.onBorrowed));
    }
    if (handlers.onReturned) {
      unsubscribes.push(eventBus.on('book:returned', handlers.onReturned));
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [handlers]);
}

export function useConnectionStatus(onStatusChange: (status: 'connected' | 'disconnected' | 'reconnecting') => void) {
  useEvent('connection:status', (data) => {
    onStatusChange(data.status);
  }, [onStatusChange]);
}

export function useNotifications() {
  const { emit } = useEventEmitter();

  const showSuccess = useCallback((message: string) => {
    emit('notification:show', { type: 'success', message });
  }, [emit]);

  const showError = useCallback((message: string) => {
    emit('notification:show', { type: 'error', message });
  }, [emit]);

  const showInfo = useCallback((message: string) => {
    emit('notification:show', { type: 'info', message });
  }, [emit]);

  const showWarning = useCallback((message: string) => {
    emit('notification:show', { type: 'warning', message });
  }, [emit]);

  return { showSuccess, showError, showInfo, showWarning };
}
