import { useEffect, useState, useRef, useCallback } from 'react';

interface UseSSEOptions {
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number; // milliseconds
  maxReconnectInterval?: number;
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectIntervalRef = useRef(options.reconnectInterval || 1000);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
      reconnectIntervalRef.current = options.reconnectInterval || 1000; // Reset backoff
    };

    eventSource.onmessage = (event) => {
      options.onMessage?.(event);
    };

    eventSource.onerror = (err) => {
      setConnected(false);
      const errorObj = new Error('SSE connection failed');
      setError(errorObj);
      options.onError?.(err);

      // Close the failed connection
      eventSource.close();

      // Exponential backoff
      const maxInterval = options.maxReconnectInterval || 30000;
      const nextInterval = Math.min(reconnectIntervalRef.current * 2, maxInterval);
      reconnectIntervalRef.current = nextInterval;

      // Reconnect after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectIntervalRef.current);
    };
  }, [url, options]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return { connected, error };
}
