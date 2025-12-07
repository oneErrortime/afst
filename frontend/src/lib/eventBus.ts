type EventCallback<T = unknown> = (data: T) => void;
type UnsubscribeFn = () => void;

interface EventBusEvents {
  'book:created': { id: string; title: string };
  'book:updated': { id: string; changes: Record<string, unknown> };
  'book:deleted': { id: string };
  'book:borrowed': { bookId: string; readerId: string; loanId: string };
  'book:returned': { bookId: string; loanId: string };
  'user:login': { userId: string };
  'user:logout': Record<string, never>;
  'user:updated': { userId: string; changes: Record<string, unknown> };
  'group:created': { id: string; name: string };
  'group:updated': { id: string; changes: Record<string, unknown> };
  'group:deleted': { id: string };
  'collection:created': { id: string; name: string };
  'collection:updated': { id: string };
  'collection:deleted': { id: string };
  'subscription:activated': { planId: string; userId: string };
  'subscription:cancelled': { userId: string };
  'reading:started': { bookId: string; sessionId: string };
  'reading:ended': { bookId: string; sessionId: string; duration: number };
  'reading:progress': { bookId: string; page: number; totalPages: number };
  'notification:show': { type: 'success' | 'error' | 'info' | 'warning'; message: string };
  'api:error': { endpoint: string; status: number; message: string };
  'api:unauthorized': Record<string, never>;
  'connection:status': { status: 'connected' | 'disconnected' | 'reconnecting' };
}

type EventName = keyof EventBusEvents;

class EventBus {
  private listeners: Map<EventName, Set<EventCallback>> = new Map();
  private eventHistory: Array<{ event: EventName; data: unknown; timestamp: number }> = [];
  private maxHistory = 100;

  on<E extends EventName>(event: E, callback: EventCallback<EventBusEvents[E]>): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
    return () => this.off(event, callback);
  }

  off<E extends EventName>(event: E, callback: EventCallback<EventBusEvents[E]>): void {
    this.listeners.get(event)?.delete(callback as EventCallback);
  }

  emit<E extends EventName>(event: E, data: EventBusEvents[E]): void {
    this.eventHistory.push({ event, data, timestamp: Date.now() });
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  once<E extends EventName>(event: E, callback: EventCallback<EventBusEvents[E]>): UnsubscribeFn {
    const onceCallback: EventCallback<EventBusEvents[E]> = (data) => {
      this.off(event, onceCallback);
      callback(data);
    };
    return this.on(event, onceCallback);
  }

  getHistory(event?: EventName, limit = 10) {
    const filtered = event
      ? this.eventHistory.filter((e) => e.event === event)
      : this.eventHistory;
    return filtered.slice(-limit);
  }

  clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }
}

export const eventBus = new EventBus();

export function useEventBus() {
  return eventBus;
}

export type { EventBusEvents, EventName };
